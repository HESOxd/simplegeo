// Классификатор "какое задание из банка может стоять на позиции N (1-30)
// реального варианта ОГЭ" — единый источник истины для сборки полного
// варианта (variantBuilder.js) и для тренировки по конкретному номеру
// задания (pages/ByPosition.jsx).
//
// Построено и перепроверено по трём независимым реальным вариантам
// с geo-oge.sdamgia.ru (позиция-в-позицию) + официальной спецификации
// ФИПИ 2026 г. (Приложение "Обобщённый план варианта КИМ ОГЭ 2026 года") +
// кластеризации нашего банка по полям groupId/kes. Коды из спецификации
// не всегда дословно совпадают с полем kes в нашем банке (разные версии
// кодификатора элементов содержания) — там, где код спецификации разошёлся
// с реальным содержанием на живых вариантах, ориентир — содержание.
//
// Позиции 1 и 4 намеренно НЕ сужены до узкой темы: и по спецификации
// (широкий диапазон кодов), и по трём образцам вариантов на этих местах
// каждый раз оказывалась разная тема (мировые факты / народы России /
// ресурсы / ООПТ) — сужать их было бы подгонкой под 3 случайных примера.

import { shuffle } from "./utils.js";

export function groupByGroupId(tasks) {
  const groups = {};
  for (const t of tasks) {
    if (!t.groupId) continue;
    (groups[t.groupId] ||= []).push(t);
  }
  return Object.values(groups);
}

export const POSITION_TOPIC = {
  1: "Общий факт по географии мира",
  2: "С каким государством граничит регион",
  3: "Города России по температуре",
  4: "Природа, ресурсы, народы России",
  5: "Погодная карта: циклон/антициклон",
  6: "Погодная карта: прогноз на завтра",
  7: "Объект по географическим координатам",
  8: "Слои горных пород по возрасту",
  9: "Расстояние по топоплану",
  10: "Направление по топоплану",
  11: "Профиль рельефа местности",
  12: "Выбор участка на топоплане",
  13: "Статистическая таблица, доля в %",
  14: "Стихийные явления, регионы риска",
  15: "Рациональное природопользование",
  16: "Вывод по собранным данным наблюдений",
  17: "Высота Солнца/долгота дня по координатам",
  18: "Климатограмма и карта",
  19: "Города по численности/высоте",
  20: "Соответствие: слоган и регион/страна",
  21: "Регион или страна по описанию",
  22: "Верные высказывания (2 из 5)",
  23: "Население: сравнение регионов по таблице",
  24: "Население: расчёт по таблице",
  25: "Плотность/численность населения (2 из 5)",
  26: "Порядок встречи Нового года",
  27: "Центры промышленности (2 из 5)",
  28: "Факт по тексту",
  29: "Развёрнутый ответ по тексту",
  30: "Развёрнутый ответ по тексту (причина)",
};

const RE = {
  matching: /Установите соответствие/i,
  timezone: /Новый год|поясн/i,
  population: /насел|прирост|миграц|рождаем|смертност/i,
  settlementFalsePositive: /населённ(ый|ого|ом) пункт/i,
  border: /гранич|выход к.*границ/i,
  coords: /координат/i,
  rockLayers: /слои|горн[ыо][йх] по?род/i,
  natureUse: /природопользован/i,
  studentData: /(учащ|школьник).{0,30}(проанализ|собран|обменял)/i,
  climatogram: /климатограмм/i,
  briefDescription: /краткому описани/i,
  statements: /высказыван/i,
  industryCenters: /центр[ыа]?.{0,20}(металлург|производств|промышленност)/i,
  cyclone: /цикло[нн]|антицикло/i,
  percentTable: /долю|удельный вес/i,
};

// Строит пулы кандидатов на каждую из 30 позиций. Пулы для "широких"
// позиций 1 и 4 пересекаются с прочими — это ожидаемо (ФИПИ тоже не
// разграничивает их жёстко), для сборки одного варианта пересечение
// разруливается через used-set в variantBuilder.js.
export function buildPositionPools(TASKS) {
  const groups = groupByGroupId(TASKS);
  const pools = {};

  // 9-12: топоплан (группы из essay+2×short+single)
  const mapGroups = groups.filter(
    (g) => g.filter((t) => t.type === "essay" && t.essayKind === "map").length === 1 && g.length >= 3
  );
  pools[12] = mapGroups.map((g) => g.find((t) => t.type === "essay" && t.essayKind === "map")).filter(Boolean);
  pools[11] = mapGroups.map((g) => g.find((t) => t.type === "single")).filter(Boolean);
  pools[9] = mapGroups.flatMap((g) => g.filter((t) => t.type === "short" && !/направ/i.test(t.q)));
  pools[10] = mapGroups.flatMap((g) => g.filter((t) => t.type === "short" && /направ/i.test(t.q)));

  // 3: города по климату
  pools[3] = TASKS.filter((t) => t.type === "sequence" && t.kes.startsWith("7.2.3"));

  // 5-6: погодная карта (циклон/антициклон), делится по формулировке
  const weatherMap = TASKS.filter((t) => t.kes.startsWith("4.3.1"));
  pools[5] = weatherMap.filter((t) => RE.cyclone.test(t.q));
  pools[6] = weatherMap.filter((t) => !RE.cyclone.test(t.q));

  // 8: слои горных пород
  pools[8] = TASKS.filter((t) => t.type === "sequence" && RE.rockLayers.test(t.q));

  // 13: статистическая таблица, доля/удельный вес
  pools[13] = TASKS.filter((t) => t.type === "short" && t.format === "number" && RE.percentTable.test(t.q));

  // 14: стихийные явления
  pools[14] = TASKS.filter((t) => t.type === "multi" && t.kes.startsWith("6.6"));

  // 15: рациональное природопользование
  pools[15] = TASKS.filter((t) => t.type === "multi" && RE.natureUse.test(t.q));

  // 16-17: общий набор данных наблюдений (вывод / расчёт по координатам)
  const studentGroups = groups.filter((g) => g.some((t) => RE.studentData.test(t.q)));
  pools[16] = studentGroups.flatMap((g) => g.filter((t) => RE.studentData.test(t.q)));
  pools[17] = studentGroups.flatMap((g) => g.filter((t) => !RE.studentData.test(t.q)));

  // 18: климатограмма
  pools[18] = TASKS.filter((t) => RE.climatogram.test(t.q));

  // 19: города по численности/высоте
  pools[19] = TASKS.filter((t) => t.type === "sequence" && t.kes.startsWith("7.3.4"));

  // 20: соответствие (слоган/регион или слоган/страна)
  pools[20] = TASKS.filter((t) => t.type === "sequence" && RE.matching.test(t.q));

  // 22: верные высказывания
  pools[22] = TASKS.filter((t) => t.type === "multi" && RE.statements.test(t.q));

  // 23-24: демографическая таблица (пара из одной groupId-группы)
  const popPairs = groups.filter(
    (g) =>
      g.length === 2 &&
      g.every((t) => t.type === "short" && t.format === "number") &&
      g.some((t) => RE.population.test(t.q) && !RE.settlementFalsePositive.test(t.q))
  );
  pools[23] = popPairs.map((g) => g[0]);
  pools[24] = popPairs.map((g) => g[1]);

  // 25: плотность/численность населения
  pools[25] = TASKS.filter((t) => t.type === "multi" && t.kes.startsWith("7.3.3"));

  // 26: часовые пояса
  pools[26] = TASKS.filter((t) => t.type === "sequence" && RE.timezone.test(t.q));

  // 27: центры промышленности
  pools[27] = TASKS.filter((t) => t.type === "multi" && RE.industryCenters.test(t.q));

  // 28-30: текстовый блок (short + 2×essay/text)
  const textGroups = groups.filter(
    (g) =>
      g.length === 3 &&
      g.filter((t) => t.type === "essay" && t.essayKind === "text").length === 2 &&
      g.some((t) => t.type === "short")
  );
  pools[28] = textGroups.map((g) => g.find((t) => t.type === "short")).filter(Boolean);
  const textEssayPairs = textGroups.map((g) => g.filter((t) => t.type === "essay"));
  pools[29] = textEssayPairs.map((pair) => pair[0]);
  pools[30] = textEssayPairs.map((pair) => pair[1]);

  // 2: сосед по границе (слово)
  pools[2] = TASKS.filter((t) => t.type === "short" && t.format === "word" && RE.border.test(t.q));

  // 7: объект по координатам (слово)
  pools[7] = TASKS.filter((t) => t.type === "short" && t.format === "word" && RE.coords.test(t.q));

  // 21: регион/страна по описанию (слово)
  pools[21] = TASKS.filter((t) => t.type === "short" && t.format === "word" && RE.briefDescription.test(t.q));

  // 1 и 4: намеренно широкие — любой одиночный выбор, не занятый узкими
  // позициями 5,6,11,18. Разделять их дальше означало бы подгонять под
  // 3 случайных образца — по факту на этих местах в реальных вариантах
  // тема каждый раз разная.
  const narrowSingleIds = new Set(
    [...pools[5], ...pools[6], ...pools[11], ...pools[18]].map((t) => t.id)
  );
  const freeSingle = TASKS.filter((t) => t.type === "single" && !narrowSingleIds.has(t.id));
  pools[1] = freeSingle;
  pools[4] = freeSingle;

  return pools;
}

// Группы заданий, которые в реальном варианте всегда стоят РЯДОМ и делят
// один и тот же контекст (карту/таблицу/текст) — для сборки полного
// варианта (variantBuilder.js), где важно не перемешать позиции из разных
// исходных карт/таблиц. Каждый элемент — { posA: task, posB: task, ... }.
export function buildClusterGroups(TASKS) {
  const groups = groupByGroupId(TASKS);

  const mapGroups = groups
    .filter((g) => g.filter((t) => t.type === "essay" && t.essayKind === "map").length === 1 && g.length >= 3)
    .map((g) => ({
      12: g.find((t) => t.type === "essay" && t.essayKind === "map"),
      11: g.find((t) => t.type === "single"),
      9: g.find((t) => t.type === "short" && !/направ/i.test(t.q)),
      10: g.find((t) => t.type === "short" && /направ/i.test(t.q)),
    }))
    .filter((g) => g[9] && g[10] && g[11] && g[12]);

  const weatherGroups = groups
    .filter((g) => g.length === 2 && g.every((t) => t.kes.startsWith("4.3.1")))
    .map((g) => ({
      5: g.find((t) => RE.cyclone.test(t.q)),
      6: g.find((t) => !RE.cyclone.test(t.q)),
    }))
    .filter((g) => g[5] && g[6]);

  const studentGroups = groups
    .filter((g) => g.length === 2 && g.some((t) => RE.studentData.test(t.q)) && g.some((t) => !RE.studentData.test(t.q)))
    .map((g) => ({
      16: g.find((t) => RE.studentData.test(t.q)),
      17: g.find((t) => !RE.studentData.test(t.q)),
    }))
    .filter((g) => g[16] && g[17]);

  const popPairGroups = groups
    .filter(
      (g) =>
        g.length === 2 &&
        g.every((t) => t.type === "short" && t.format === "number") &&
        g.some((t) => RE.population.test(t.q) && !RE.settlementFalsePositive.test(t.q))
    )
    .map((g) => ({ 23: g[0], 24: g[1] }));

  const textGroups = groups
    .filter(
      (g) =>
        g.length === 3 &&
        g.filter((t) => t.type === "essay" && t.essayKind === "text").length === 2 &&
        g.some((t) => t.type === "short")
    )
    .map((g) => {
      const essays = g.filter((t) => t.type === "essay");
      return { 28: g.find((t) => t.type === "short"), 29: essays[0], 30: essays[1] };
    })
    .filter((g) => g[28] && g[29] && g[30]);

  return { mapGroups, weatherGroups, studentGroups, popPairGroups, textGroups };
}

export { RE };
