// Сборка "полного варианта", повторяющего структуру реального КИМ ОГЭ по
// географии позиция-в-позицию (не просто по общим долям, а по каждому из
// 30 номеров отдельно) — сверено с двумя независимыми реальными вариантами
// с sdamgia.ru (geo-oge.sdamgia.ru/test?id=...):
//
//   9-12  — блок с топопланом: 9 расстояние, 10 направление, 11 профиль
//           рельефа (картинки-варианты), 12 — развёрнутый "сравни 2 участка"
//           по той же карте.
//   20    — фиксированный шаблон "Установите соответствие" (слоганы/регион
//           или слоганы/страна) — единственный сопоставительный sequence-тип
//           в банке, всегда на этом месте.
//   23-24 — пара по одной демографической таблице (естественный/миграционный
//           прирост региона), у нас обе всегда short_answer/число.
//   26    — "Расположите регионы в порядке встречи Нового года" (часовые
//           пояса) — единственный sequence-тип с этой темой, фиксирован здесь.
//   28-30 — блок "прочитайте текст": 28 короткий факт по тексту (word),
//           29-30 — развёрнутые вопросы по тому же тексту.
//
// Все остальные позиции закреплены только по СЕМЬЕ типа ответа (single/word/
// number/multi/sequence) — в самих реальных вариантах конкретная подтема на
// этих местах меняется от варианта к варианту, фиксирован только тип ответа.
// Итоговые агрегаты получаются сами собой: 8 single / 5 word / 14 number-
// group (number+sequence+multi) / 3 essay — ровно как в спецификации ФИПИ.
//
// Используется и из React (случайный вариант), и из Node-скрипта генерации
// "вариантов недели" (см. scripts/generateWeeklyVariants.js) — поэтому здесь
// только чистый JS без браузерных API.

import { shuffle } from "./utils.js";

const SECTION_TARGET = { "1": 2, "2": 5, "3": 1, "4": 5, "5": 3, "6": 3, "7": 11 };

// Семья ответа для каждой НЕ кластеризованной позиции (см. разбор выше).
const FREE_POSITION_FAMILY = {
  1: "single", 2: "word", 3: "sequence", 4: "single", 5: "single", 6: "single",
  7: "word", 8: "sequence",
  // 9/10/11 обычно занимает блок с картой (шаг 1) — семьи здесь только как
  // подстраховка на случай, если в реальных данных у карты меньше 3 соседей
  // (тогда позиция не заполнится в кластере и попадёт в общий добор ниже).
  9: "number", 10: "word", 11: "single",
  13: "number", 14: "multi", 15: "multi", 16: "single", 17: "single", 18: "single",
  19: "sequence",
  21: "word", 22: "multi", 25: "multi", 27: "multi",
};

const ALL_POSITIONS = Array.from({ length: 30 }, (_, i) => i + 1);

const MATCHING_RE = /Установите соответствие/i;
const TIMEZONE_RE = /Новый год|поясн/i;
const POPULATION_RE = /насел|прирост|миграц|рождаем|смертност/i;
const SETTLEMENT_FALSE_POSITIVE_RE = /населённ(ый|ого|ом) пункт/i;

function groupByGroupId(tasks) {
  const groups = {};
  for (const t of tasks) {
    if (!t.groupId) continue;
    (groups[t.groupId] ||= []).push(t);
  }
  return Object.values(groups);
}

function isNumberFamily(t) {
  return t.type === "multi" || t.type === "sequence" || (t.type === "short" && t.format === "number");
}
function isWordFamily(t) {
  return t.type === "short" && t.format === "word";
}
function matchesFamily(t, family) {
  if (family === "single") return t.type === "single";
  if (family === "word") return isWordFamily(t);
  if (family === "number") return t.type === "short" && t.format === "number";
  if (family === "multi") return t.type === "multi";
  if (family === "sequence") return t.type === "sequence";
  return false;
}

/**
 * @param {Array} TASKS - полный банк заданий (из data.js)
 * @param {() => number} rng - генератор случайных чисел в [0,1); по умолчанию Math.random
 * @param {Set<string>} excludeIds - id заданий, которые нельзя использовать (например,
 *   уже занятые другими вариантами недели, чтобы 5 вариантов не повторялись)
 * @returns {Array} 30 заданий в порядке позиций 1-30, каждое с добавленным полем `pos`
 */
export function buildFaithfulVariant(TASKS, rng = Math.random, excludeIds = null) {
  const used = new Set(excludeIds || []);
  const positions = {};
  const take = (task, pos) => {
    if (!task || used.has(task.id)) return false;
    positions[pos] = task;
    used.add(task.id);
    return true;
  };

  const groups = groupByGroupId(TASKS);

  // 1. Блок с картой (9-12): группа с ровно одним "map"-эссе и минимум 2
  // соседями. В 4 из 61 групп в данных по ошибке два эссе-варианта на одну
  // карту — такие пропускаем, иначе один из соседей 9/10/11 останется без
  // пары и уйдёт в общий добор с чужой картой.
  const mapGroups = shuffle(
    groups.filter(
      (g) => g.filter((t) => t.type === "essay" && t.essayKind === "map").length === 1 && g.length >= 3
    ),
    rng
  );
  if (mapGroups[0]) {
    const group = mapGroups[0];
    // Изредка в данных у одной карты по ошибке два эссе-варианта — исключаем
    // ВСЕ эссе группы из "соседей", иначе второе эссе попадёт на 9/10/11.
    const essay = group.find((t) => t.type === "essay" && t.essayKind === "map");
    take(essay, 12);
    const siblings = shuffle(group.filter((t) => !(t.type === "essay" && t.essayKind === "map")), rng);
    [9, 10, 11].forEach((pos, i) => siblings[i] && take(siblings[i], pos));
  }
  if (!positions[12]) {
    // Не нашлось полной карты-группы — берём любое доступное эссе-с-картой,
    // чтобы позиция не осталась пустой.
    const anyMapEssay = shuffle(TASKS.filter((t) => t.type === "essay" && t.essayKind === "map" && !used.has(t.id)), rng)[0];
    take(anyMapEssay, 12);
  }

  // 2. Позиция 20: фиксированный шаблон "Установите соответствие".
  const matchingCandidates = shuffle(
    TASKS.filter((t) => t.type === "sequence" && !used.has(t.id) && MATCHING_RE.test(t.q)),
    rng
  );
  take(matchingCandidates[0], 20);

  // 3. Позиции 23-24: пара заданий на одну демографическую таблицу (одна
  // groupId-группа из двух short_answer/число, без слова "населённый пункт",
  // чтобы не спутать с картографическими заданиями про нас. пункты).
  const popPairs = shuffle(
    groups.filter(
      (g) =>
        g.length === 2 &&
        g.every((t) => t.type === "short" && t.format === "number") &&
        g.some((t) => POPULATION_RE.test(t.q) && !SETTLEMENT_FALSE_POSITIVE_RE.test(t.q))
    ),
    rng
  );
  if (popPairs[0]) {
    const [a, b] = shuffle(popPairs[0], rng);
    take(a, 23);
    take(b, 24);
  }

  // 4. Позиция 26: "Расположите регионы в порядке встречи Нового года" (часовые пояса).
  const timezoneCandidates = shuffle(
    TASKS.filter((t) => t.type === "sequence" && !used.has(t.id) && TIMEZONE_RE.test(t.q)),
    rng
  );
  take(timezoneCandidates[0], 26);

  // 5. Блок "прочитайте текст" (28-30): groupId-группа из короткого факта
  // (word) + двух развёрнутых по тому же отрывку.
  const textGroups = shuffle(
    groups.filter(
      (g) =>
        g.length === 3 &&
        g.filter((t) => t.type === "essay" && t.essayKind === "text").length === 2 &&
        g.some((t) => t.type === "short")
    ),
    rng
  );
  if (textGroups[0]) {
    const group = textGroups[0];
    const factTask = group.find((t) => t.type === "short");
    const essays = shuffle(group.filter((t) => t.type === "essay"), rng);
    take(factTask, 28);
    take(essays[0], 29);
    take(essays[1], 30);
  }
  // Фолбэк, если групповая тройка не нашлась: добираем любыми эссе-текстами.
  if (!positions[29] || !positions[30]) {
    const anyTextEssays = shuffle(
      TASKS.filter((t) => t.type === "essay" && t.essayKind === "text" && !used.has(t.id)),
      rng
    );
    if (!positions[29]) take(anyTextEssays.shift(), 29);
    if (!positions[30]) take(anyTextEssays.shift(), 30);
  }
  if (!positions[28]) {
    const anyWord = shuffle(TASKS.filter((t) => isWordFamily(t) && !used.has(t.id)), rng)[0];
    take(anyWord, 28);
  }

  // 6. Остальные позиции — строго по закреплённой за ними семье типа ответа,
  // с предпочтением разделов курса, которые ещё не набрали свою долю.
  const sectionCount = {};
  for (const t of Object.values(positions)) sectionCount[t.sec] = (sectionCount[t.sec] || 0) + 1;

  function pickForFamily(family) {
    let candidates = TASKS.filter((t) => !used.has(t.id) && matchesFamily(t, family));
    if (!candidates.length) return null;
    candidates = shuffle(candidates, rng);
    candidates.sort((a, b) => {
      const da = (sectionCount[a.sec] || 0) - (SECTION_TARGET[a.sec] || 0);
      const db = (sectionCount[b.sec] || 0) - (SECTION_TARGET[b.sec] || 0);
      return da - db;
    });
    return candidates[0];
  }

  const FALLBACK_FAMILIES = ["number", "multi", "sequence", "word", "single"];

  for (const pos of ALL_POSITIONS) {
    if (positions[pos]) continue;
    const family = FREE_POSITION_FAMILY[pos] || "number";
    let chosen = pickForFamily(family);
    if (!chosen) {
      for (const fallback of FALLBACK_FAMILIES) {
        chosen = pickForFamily(fallback);
        if (chosen) break;
      }
    }
    if (chosen) {
      used.add(chosen.id);
      sectionCount[chosen.sec] = (sectionCount[chosen.sec] || 0) + 1;
      positions[pos] = chosen;
    }
  }

  return ALL_POSITIONS.filter((pos) => positions[pos]).map((pos) => ({ ...positions[pos], pos }));
}

export const REAL_EXAM_TOTAL = 30;
