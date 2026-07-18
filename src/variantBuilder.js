// Сборка "полного варианта", повторяющего структуру реального КИМ ОГЭ по
// географии позиция-в-позицию. Источник истины по тому, какое задание банка
// может стоять на позиции N — src/positionClassifier.js (построен и
// перепроверен по трём реальным вариантам с sdamgia.ru + официальной
// спецификации ФИПИ 2026 г., см. комментарий в начале этого модуля).
//
// Пять групп позиций всегда делят один контекст (карту/таблицу/текст) и
// должны браться ЦЕЛИКОМ из одной groupId-группы: 9-12 (топоплан),
// 5-6 (погодная карта), 16-17 (данные наблюдений), 23-24 (демография),
// 28-30 (текст). Остальные 20 позиций закреплены по узкой теме независимо
// друг от друга (см. POSITION_TOPIC в positionClassifier.js) — кроме
// позиций 1 и 4, которые нарочно широкие (в реальных вариантах тема на
// этих местах каждый раз разная).
//
// Используется и из React (случайный вариант), и из Node-скрипта генерации
// "вариантов недели" (см. scripts/generateWeeklyVariants.js) — поэтому здесь
// только чистый JS без браузерных API.

import { shuffle } from "./utils.js";
import { buildPositionPools, buildClusterGroups } from "./positionClassifier.js";

const SECTION_TARGET = { "1": 2, "2": 5, "3": 1, "4": 5, "5": 3, "6": 3, "7": 11 };
const ALL_POSITIONS = Array.from({ length: 30 }, (_, i) => i + 1);

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

  // Берёт первую (после перемешивания) группу, все члены которой ещё
  // свободны, и заполняет ей сразу несколько позиций.
  const takeFirstAvailableGroup = (groups) => {
    for (const g of groups) {
      if (Object.values(g).every((t) => t && !used.has(t.id))) {
        for (const [pos, task] of Object.entries(g)) {
          positions[pos] = task;
          used.add(task.id);
        }
        return true;
      }
    }
    return false;
  };

  const pools = buildPositionPools(TASKS);
  const cg = buildClusterGroups(TASKS);

  // 1. Пять сцепленных кластеров — сначала они, чтобы не растащить общий
  // контекст (карту/таблицу/текст) по разным, не связанным друг с другом
  // задачам при общем доборе ниже.
  takeFirstAvailableGroup(shuffle(cg.mapGroups, rng));
  if (!positions[12]) {
    // Не нашлось полной карты-группы — берём любое доступное эссе-с-картой,
    // чтобы позиция не осталась пустой.
    const anyMapEssay = shuffle(pools[12].filter((t) => !used.has(t.id)), rng)[0];
    take(anyMapEssay, 12);
  }
  takeFirstAvailableGroup(shuffle(cg.weatherGroups, rng));
  takeFirstAvailableGroup(shuffle(cg.studentGroups, rng));
  takeFirstAvailableGroup(shuffle(cg.popPairGroups, rng));
  takeFirstAvailableGroup(shuffle(cg.textGroups, rng));
  if (!positions[29] || !positions[30]) {
    const anyTextEssays = shuffle(
      TASKS.filter((t) => t.type === "essay" && t.essayKind === "text" && !used.has(t.id)),
      rng
    );
    if (!positions[29]) take(anyTextEssays.shift(), 29);
    if (!positions[30]) take(anyTextEssays.shift(), 30);
  }
  if (!positions[28]) {
    const anyWord = shuffle(pools[28].filter((t) => !used.has(t.id)) , rng)[0];
    take(anyWord, 28);
  }

  // 2. Остальные позиции — из готового пула этой позиции (positionClassifier),
  // с предпочтением разделов курса, которые ещё не набрали свою долю.
  const sectionCount = {};
  for (const t of Object.values(positions)) sectionCount[t.sec] = (sectionCount[t.sec] || 0) + 1;

  function pickFromPool(candidatesPool) {
    let candidates = candidatesPool.filter((t) => !used.has(t.id));
    if (!candidates.length) return null;
    candidates = shuffle(candidates, rng);
    candidates.sort((a, b) => {
      const da = (sectionCount[a.sec] || 0) - (SECTION_TARGET[a.sec] || 0);
      const db = (sectionCount[b.sec] || 0) - (SECTION_TARGET[b.sec] || 0);
      return da - db;
    });
    return candidates[0];
  }

  for (const pos of ALL_POSITIONS) {
    if (positions[pos]) continue;
    let chosen = pickFromPool(pools[pos] || []);
    if (!chosen) {
      // Подстраховка: пул этой позиции исчерпан (не должно случаться при
      // разумном excludeIds) — берём любое ещё не занятое задание того же
      // базового типа ответа, что и первый кандидат в исходном пуле.
      const sampleType = (pools[pos] || [])[0]?.type;
      chosen = pickFromPool(TASKS.filter((t) => t.type === sampleType));
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
