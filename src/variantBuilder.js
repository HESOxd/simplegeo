// Сборка "полного варианта", максимально совпадающего по структуре с реальным
// КИМ ОГЭ 2026 по географии (спецификация ФИПИ):
//   - 30 заданий: 8 с ответом-цифрой (single), 5 словом (short/word),
//     14 числом/последовательностью/выбором нескольких (short/number + multi + sequence),
//     3 развёрнутых (essay) — строго на местах 12, 29, 30.
//   - Задания 9-12 — один блок с топографическим планом (9-11 обычные,
//     12 — развёрнутый "сравни два участка и обоснуй", та же карта).
//   - Задания 23-25 — один блок про демографическую таблицу (естественный/
//     миграционный прирост населения России).
//   - Задания 16-17 — пара "определи пункт по координатам → его климат".
//   - Плюс распределение по разделам курса близко к официальному 2/5/1/5/3/3/11.
//
// Используется и из React (случайный вариант), и из Node-скрипта генерации
// "вариантов недели" (см. scripts/generateWeeklyVariants.js) — поэтому здесь
// только чистый JS без браузерных API.

import { shuffle } from "./utils.js";

const SECTION_TARGET = { "1": 2, "2": 5, "3": 1, "4": 5, "5": 3, "6": 3, "7": 11 };
const AGGREGATE_TARGET = { single: 8, word: 5, numberGroup: 14 };

const MAP_POSITIONS = [9, 10, 11, 12];
const POPULATION_POSITIONS = [23, 24, 25];
const COORD_CLIMATE_POSITIONS = [16, 17];
const TEXT_ESSAY_POSITIONS = [29, 30];
const ALL_POSITIONS = Array.from({ length: 30 }, (_, i) => i + 1);

function groupByGroupId(tasks) {
  const groups = {};
  for (const t of tasks) {
    if (!t.groupId) continue;
    (groups[t.groupId] ||= []).push(t);
  }
  return Object.values(groups);
}

function isNumberGroupTask(t) {
  return t.type === "multi" || t.type === "sequence" || (t.type === "short" && t.format === "number");
}
function isWordTask(t) {
  return t.type === "short" && t.format === "word";
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

  // 1. Блок с картой (9-12): группа с "map"-эссе и минимум 2 соседями.
  const mapGroups = shuffle(
    groups.filter((g) => g.some((t) => t.type === "essay" && t.essayKind === "map") && g.length >= 3),
    rng
  );
  if (mapGroups[0]) {
    const group = mapGroups[0];
    const essay = group.find((t) => t.type === "essay" && t.essayKind === "map");
    take(essay, 12);
    const siblings = shuffle(group.filter((t) => t !== essay), rng);
    [9, 10, 11].forEach((pos, i) => siblings[i] && take(siblings[i], pos));
  }

  // 2. Блок про население (23-25): группа без эссе, по теме население/прирост/миграция.
  // В реальных данных такие группы почти всегда размером 2 (не 4, как карта) —
  // берём что есть, третья позиция при нехватке уйдёт в обычное заполнение ниже.
  const popRe = /насел|прирост|миграц|рождаем|смертност/i;
  const popGroups = shuffle(
    groups.filter((g) => g.length >= 2 && g.every((t) => t.type !== "essay") && g.some((t) => popRe.test(t.q))),
    rng
  );
  if (popGroups[0]) {
    const picked = shuffle(popGroups[0], rng);
    [23, 24, 25].forEach((pos, i) => picked[i] && take(picked[i], pos));
  }

  // 3. Пара координаты → климат (16-17). В отличие от карты и населения, эти
  // два задания в открытом банке ФИПИ НЕ хранятся как одна группа (каждое —
  // отдельный самостоятельный вопрос), поэтому берём их по отдельности, без
  // требования общего groupId.
  const coordRe = /координат/i;
  const climateRe = /климат/i;
  const coordTask = shuffle(TASKS.filter((t) => t.type !== "essay" && !used.has(t.id) && coordRe.test(t.q)), rng)[0];
  take(coordTask, 16);
  const climateTask = shuffle(TASKS.filter((t) => t.type !== "essay" && !used.has(t.id) && climateRe.test(t.q)), rng)[0];
  take(climateTask, 17);

  // 4. Текстовые развёрнутые ответы (29, 30) — без картинки, разные задания.
  const textEssays = shuffle(
    TASKS.filter((t) => t.type === "essay" && t.essayKind === "text" && !used.has(t.id)),
    rng
  );
  take(textEssays[0], 29);
  take(textEssays[1], 30);

  // Если задание 12 всё ещё не занято (не нашлось подходящей карты-группы) —
  // берём любое доступное эссе, чтобы позиция не осталась пустой.
  if (!positions[12]) {
    const anyEssay = shuffle(TASKS.filter((t) => t.type === "essay" && !used.has(t.id)), rng)[0];
    take(anyEssay, 12);
  }

  // 5. Остальные позиции — по общим долям (8 single / 5 word / 14 numberGroup),
  // с учётом того, что кластеры выше уже могли забрать часть каждой доли.
  const remainingPositions = ALL_POSITIONS.filter((p) => !positions[p]);

  const filledSoFar = Object.values(positions);
  const usedCount = {
    single: filledSoFar.filter((t) => t.type === "single").length,
    word: filledSoFar.filter(isWordTask).length,
    numberGroup: filledSoFar.filter(isNumberGroupTask).length,
  };

  let familyQueue = [
    ...Array(Math.max(0, AGGREGATE_TARGET.single - usedCount.single)).fill("single"),
    ...Array(Math.max(0, AGGREGATE_TARGET.word - usedCount.word)).fill("word"),
    ...Array(Math.max(0, AGGREGATE_TARGET.numberGroup - usedCount.numberGroup)).fill("numberGroup"),
  ];
  while (familyQueue.length < remainingPositions.length) familyQueue.push("numberGroup");
  familyQueue = shuffle(familyQueue, rng).slice(0, remainingPositions.length);

  const sectionCount = {};
  for (const t of filledSoFar) sectionCount[t.sec] = (sectionCount[t.sec] || 0) + 1;

  function pickForFamily(family) {
    const matcher = family === "single" ? (t) => t.type === "single" : family === "word" ? isWordTask : isNumberGroupTask;
    let candidates = TASKS.filter((t) => !used.has(t.id) && matcher(t));
    if (!candidates.length) return null;
    candidates = shuffle(candidates, rng);
    // Предпочитаем разделы, которые ещё не набрали свою целевую долю.
    candidates.sort((a, b) => {
      const da = (sectionCount[a.sec] || 0) - (SECTION_TARGET[a.sec] || 0);
      const db = (sectionCount[b.sec] || 0) - (SECTION_TARGET[b.sec] || 0);
      return da - db;
    });
    const chosen = candidates[0];
    used.add(chosen.id);
    sectionCount[chosen.sec] = (sectionCount[chosen.sec] || 0) + 1;
    return chosen;
  }

  remainingPositions.forEach((pos, i) => {
    const family = familyQueue[i];
    const chosen =
      pickForFamily(family) || pickForFamily("numberGroup") || pickForFamily("word") || pickForFamily("single");
    if (chosen) positions[pos] = chosen;
  });

  return ALL_POSITIONS.filter((pos) => positions[pos]).map((pos) => ({ ...positions[pos], pos }));
}

export const REAL_EXAM_TOTAL = 30;
