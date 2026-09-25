// Иконки бренда SimpleGeo — 26 штук в одном спрайте public/brand/icons/sprite.svg
// (отдельные SVG там же, рядом со спрайтом). Все нарисованы через currentColor, поэтому
// цвет иконки = цвет текста родителя: text-brand, text-white и т.д.
//
// Свои иконки не рисуем и эмодзи вместо иконок не ставим — брендбук: «Эмодзи в
// разделах → иконки из /icons». Нужна новая иконка — сначала она появляется в
// бренд-системе, потом здесь.
//
// Доступные имена: compass graticule globe mountain map wave cloud-rain sun
// thermometer leaf lightning factory population ship pin route scale layers
// target timer book flag check cross arrow-right chevron-right
export function Icon({ name, className = "w-5 h-5", title }) {
  return (
    <svg
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <use href={`/brand/icons/sprite.svg#sg-${name}`} />
    </svg>
  );
}
