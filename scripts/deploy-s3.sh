#!/usr/bin/env bash
# Заливка dist/ в Selectel S3. Общая для deploy.yml и weekly-variants.yml —
# правила кэша и сжатия живут в одном месте.
#
# Нужны переменные: S3_BUCKET, S3_ENDPOINT, SITE_URL (+ ключи AWS_* для aws).
#
# Сжатие. Хостинг сам файлы не сжимает: без этого главный JS (весь банк
# заданий) уходит ученику целиком — 3,2 МБ вместо ~0,5 МБ. Поэтому текстовые
# файлы (js, css, svg, json) заливаются уже сжатыми gzip, с заголовком
# Content-Encoding: gzip — браузер распакует сам.
#
# Страховка. Перед заливкой — проба: маленький сжатый файл кладётся в бакет и
# скачивается с живого сайта. Если хостинг не отдал заголовок или содержимое не
# совпало — заливаем без сжатия, как раньше (сайт работает, просто тяжелее), и
# в логе появляется предупреждение. После заливки главный JS проверяется ещё
# раз; если он не читается — всё перезаливается без сжатия, а сборка краснеет.
set -euo pipefail

: "${S3_BUCKET:?нужна переменная S3_BUCKET}"
: "${S3_ENDPOINT:?нужна переменная S3_ENDPOINT}"
: "${SITE_URL:?нужна переменная SITE_URL}"

DIST=./dist
DEST="s3://${S3_BUCKET}"
IMMUTABLE="public, max-age=31536000, immutable"
NOCACHE="no-cache, no-store, must-revalidate"
HOUR="public, max-age=3600"
# Файлы с постоянным именем, которые меняются, — без годового кэша. Заливаются
# отдельно, без сжатия (они маленькие), после остальных (см. ниже).
NOCACHE_FILES=(index.html weekly-variants.json)
HOUR_FILES=(robots.txt sitemap.xml favicon.ico)
# Что сжимаем (кроме файлов из списков выше).
GZ_TYPES=(js css svg json)

s3() { aws s3 "$@" --endpoint-url "$S3_ENDPOINT"; }

# Фильтры aws: только сжимаемые / всё, кроме сжимаемых.
GZ_ONLY=(--exclude "*")
NOT_GZ=()
for ext in "${GZ_TYPES[@]}"; do
  GZ_ONLY+=(--include "*.${ext}")
  NOT_GZ+=(--exclude "*.${ext}")
done
SEPARATE=()
for f in "${NOCACHE_FILES[@]}" "${HOUR_FILES[@]}"; do SEPARATE+=(--exclude "$f"); done
GZ_ONLY+=("${SEPARATE[@]}")
NOT_GZ+=("${SEPARATE[@]}")

# --- проба ---------------------------------------------------------------
gzip_works() {
  local name="gzip-probe-${GITHUB_RUN_ID:-local}-$$.txt"
  local text="simplegeo gzip probe"
  local tmp; tmp=$(mktemp)
  printf '%s' "$text" | gzip -9 -n > "$tmp"
  s3 cp "$tmp" "${DEST}/${name}" --content-encoding gzip \
    --content-type "text/plain; charset=utf-8" --cache-control "no-store" >/dev/null
  local enc body headers
  headers=$(curl -fsSI -H "Accept-Encoding: gzip" "${SITE_URL}/${name}" || true)
  enc=$(printf '%s\n' "$headers" | tr -d '\r' \
    | awk -F': ' 'tolower($1)=="content-encoding"{print tolower($2)}')
  body=$(curl -fsS --compressed "${SITE_URL}/${name}" || true)
  s3 rm "${DEST}/${name}" >/dev/null || true
  rm -f "$tmp"
  [ "$enc" = "gzip" ] && [ "$body" = "$text" ]
}

# --- заливка -------------------------------------------------------------
# Порядок важен: сначала новые файлы, потом index.html, и только потом уборка
# устаревших. Если выкладка оборвётся посередине, старая страница продолжит
# работать со своими файлами — белого экрана не будет.
GZDIR=""

prepare_gzip() {
  GZDIR=$(mktemp -d)
  cp -R "$DIST"/. "$GZDIR"/
  for ext in "${GZ_TYPES[@]}"; do
    find "$GZDIR" -type f -name "*.${ext}" ! -name "weekly-variants.json" -print0 |
      while IFS= read -r -d '' f; do gzip -9 -n -c "$f" > "$f.tmp" && mv "$f.tmp" "$f"; done
  done
}

# upload_gzip / upload_plain [--delete]: с --delete ещё и убирают устаревшие
# файлы. У сжатой заливки два прохода — каждый со своим типом файлов.
upload_gzip() {
  s3 sync "$GZDIR" "$DEST" ${1+"$1"} "${GZ_ONLY[@]}" \
    --content-encoding gzip --cache-control "$IMMUTABLE"
  s3 sync "$GZDIR" "$DEST" ${1+"$1"} "${NOT_GZ[@]}" \
    --cache-control "$IMMUTABLE"
}

upload_plain() {
  s3 sync "$DIST" "$DEST" ${1+"$1"} \
    "${SEPARATE[@]}" \
    --cache-control "$IMMUTABLE"
}

# Главный JS после заливки должен совпасть байт в байт с собранным: браузер
# (как и curl --compressed) получает сжатый файл и распаковывает его.
main_js_ok() {
  local js tmp ok=1
  js=$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' "$DIST/index.html" | head -1 || true)
  [ -n "$js" ] || return 1
  tmp=$(mktemp)
  if curl -fsS --compressed -o "$tmp" "${SITE_URL}${js}" && cmp -s "$tmp" "${DIST}${js}"; then ok=0; fi
  rm -f "$tmp"
  return "$ok"
}

if gzip_works; then
  echo "Хостинг отдаёт сжатые файлы правильно — заливаем со сжатием."
  prepare_gzip
  upload_gzip
  MODE=gzip
else
  echo "::warning::Проба сжатия не прошла — заливаем без сжатия, как раньше."
  upload_plain
  MODE=plain
fi

# index.html — точка входа SPA, её отдаёт хостинг на ЛЮБОЙ вложенный
# маршрут (/tasks, /about, /course). Без no-cache промежуточные кэши
# держат её "свежей" эвристически часами и подсовывают ссылки на уже
# удалённые (пересобранные) JS/CSS — из-за этого белый экран при
# обновлении страницы.
s3 cp "$DIST/index.html" "${DEST}/index.html" --cache-control "$NOCACHE"

# weekly-variants.json — та же логика: имя файла не меняется, а
# содержимое должно обновляться раз в неделю, поэтому без no-cache
# браузеры/CDN отдавали бы старые варианты ещё год.
if [ -f "$DIST/weekly-variants.json" ]; then
  s3 cp "$DIST/weekly-variants.json" "${DEST}/weekly-variants.json" --cache-control "$NOCACHE"
fi

# robots.txt, sitemap.xml, favicon.ico — адрес задан стандартом, переименовать
# при правке нельзя. Кэш — час: правка дойдёт быстро, а лишних запросов нет.
for f in "${HOUR_FILES[@]}"; do
  if [ -f "$DIST/$f" ]; then s3 cp "$DIST/$f" "${DEST}/$f" --cache-control "$HOUR"; fi
done

FAILED=0
if [ "$MODE" = gzip ] && ! main_js_ok; then
  echo "::error::Главный JS после сжатой заливки не читается — перезаливаю без сжатия."
  upload_plain
  MODE=plain
  FAILED=1
fi

# Уборка устаревших файлов — только теперь, когда новая index.html на месте.
if [ "$MODE" = gzip ]; then upload_gzip --delete; else upload_plain --delete; fi
[ -n "$GZDIR" ] && rm -rf "$GZDIR"

if [ "$FAILED" = 1 ]; then exit 1; fi
echo "Готово."
