// Сборка мини-диагностики ОГЭ v2 и кодирование результата в URL.
// Спека: docs/diagnostic-spec.md. Концепция: docs в Agent Store (diagnostic-v2).
// Эссе (поз. 12/29/30) и №9 (линейка) не берём.

import { shuffle } from "./utils.js";
import { buildPositionPools } from "./positionClassifier.js";

/** @typedef {{ key: string, title: string, positions: number[], count: number, examPrimaryMax: number }} DiagnosticBlock */

/** Типы с выбором ответа — приоритет модели B′. */
const CHOICE_TYPES = new Set(["single", "multi"]);

/** Counts v1 — для чтения старых ссылок `?r=` (encode всегда v2). */
export const DIAGNOSTIC_V1_COUNTS = {
  topo: 3,
  maps: 2,
  climate: 3,
  nature: 3,
  people: 3,
  world: 3,
  regions: 2,
};

/**
 * Блоки диагностики v2.
 * examPrimaryMax — сумма макс. первичных баллов позиций пула по SPEC 2027
 * (ориентир слоя 2 / тай-брейк; не «потерянные баллы»).
 */
export const DIAGNOSTIC_BLOCKS = /** @type {DiagnosticBlock[]} */ ([
  { key: "topo", title: "Топография (план местности)", positions: [10, 11], count: 2, examPrimaryMax: 2 },
  { key: "maps", title: "Карты, координаты, часовые пояса", positions: [7, 26], count: 2, examPrimaryMax: 2 },
  { key: "climate", title: "Атмосфера и климат", positions: [5, 6, 16, 17, 18], count: 2, examPrimaryMax: 5 },
  { key: "nature", title: "Природа России", positions: [4, 8, 14, 15, 22], count: 2, examPrimaryMax: 5 },
  { key: "people", title: "Население и хозяйство России", positions: [13, 19, 23, 24, 25], count: 2, examPrimaryMax: 5 },
  { key: "world", title: "Мир: материки и страны", positions: [1, 3, 20, 21, 27], count: 2, examPrimaryMax: 5 },
  { key: "regions", title: "Регионы России по тексту", positions: [2, 28], count: 1, examPrimaryMax: 2 },
]);

export const DIAGNOSTIC_TOTAL = DIAGNOSTIC_BLOCKS.reduce((s, b) => s + b.count, 0); // 13

/** Совместимость: старое имя examPoints → examPrimaryMax. */
export function blockExamPoints(block) {
  return block.examPrimaryMax ?? block.examPoints ?? 0;
}

function isChoiceTask(t) {
  return CHOICE_TYPES.has(t.type);
}

/** Кандидаты позиции: без эссе, без занятых id/groupId; при preferChoice — только single/multi, если есть. */
function candidatesForPos(pool, usedIds, usedGroupIds, preferChoice) {
  const base = (pool || []).filter((t) => {
    if (t.type === "essay") return false;
    if (usedIds.has(t.id)) return false;
    if (t.groupId && usedGroupIds.has(t.groupId)) return false;
    return true;
  });
  if (!preferChoice) return base;
  const choice = base.filter(isChoiceTask);
  return choice.length ? choice : base;
}

function pickTask(pool, usedIds, usedGroupIds, rng, preferChoice) {
  const candidates = shuffle(candidatesForPos(pool, usedIds, usedGroupIds, preferChoice), rng);
  return candidates[0] || null;
}

function markUsed(task, usedIds, usedGroupIds) {
  usedIds.add(task.id);
  if (task.groupId) usedGroupIds.add(task.groupId);
}

/**
 * Позиции, где в доступном пуле есть choice-задания.
 * Для climate/nature избегаем short/sequence, если хватает choice-позиций.
 */
function positionHasChoice(pools, pos, usedIds, usedGroupIds) {
  return candidatesForPos(pools[pos], usedIds, usedGroupIds, true).some(isChoiceTask);
}

/**
 * Выбрать count позиций блока с предпочтением choice (модель B′).
 * people: не больше одного short; climate: 18 (short) — запасной; nature: 8 (sequence) — запасной.
 */
function selectPositions(block, pools, usedIds, usedGroupIds, rng) {
  const { positions, count, key } = block;
  if (positions.length <= count) return [...positions];

  const scored = positions.map((pos) => {
    const hasChoice = positionHasChoice(pools, pos, usedIds, usedGroupIds);
    let penalty = 0;
    // Запасные слоты без выбора — ниже приоритет
    if (key === "climate" && pos === 18) penalty += 2;
    if (key === "nature" && pos === 8) penalty += 2;
    if (key === "people" && (pos === 13 || pos === 23 || pos === 24)) penalty += 1; // short
    if (key === "people" && pos === 19) penalty += 1; // sequence
    if (key === "world" && (pos === 3 || pos === 20 || pos === 21)) penalty += 1;
    if (key === "maps") penalty += 0; // в банке нет choice — оба слота short/sequence
    const score = (hasChoice ? 10 : 0) - penalty;
    return { pos, score, hasChoice };
  });

  // Детерминированный shuffle внутри одинакового score
  const ordered = shuffle(scored, rng).sort((a, b) => b.score - a.score);
  let selected = ordered.slice(0, count).map((x) => x.pos);

  // people: лимит 1 short на блок
  if (key === "people") {
    const shortPos = new Set([13, 23, 24]);
    const shorts = selected.filter((p) => shortPos.has(p));
    if (shorts.length > 1) {
      const keepShort = shorts[0];
      const rest = selected.filter((p) => !shortPos.has(p) || p === keepShort);
      const fillers = ordered
        .map((x) => x.pos)
        .filter((p) => !rest.includes(p) && !shortPos.has(p));
      selected = [...rest];
      for (const p of fillers) {
        if (selected.length >= count) break;
        selected.push(p);
      }
      // если всё ещё не хватает — добираем чем угодно
      for (const p of ordered.map((x) => x.pos)) {
        if (selected.length >= count) break;
        if (!selected.includes(p)) selected.push(p);
      }
    }
  }

  return selected.slice(0, count);
}

/**
 * Топо: сначала группа плана с №10 и №11, затем оба задания из неё.
 * Fallback — независимый выбор, если общих групп нет (в банке обычно есть).
 */
function pickTopoPair(pools, usedIds, usedGroupIds, rng) {
  const pool10 = (pools[10] || []).filter((t) => t.type !== "essay" && !usedIds.has(t.id));
  const pool11 = (pools[11] || []).filter((t) => t.type !== "essay" && !usedIds.has(t.id));

  const byGroup11 = new Map();
  for (const t of pool11) {
    if (!t.groupId || usedGroupIds.has(t.groupId)) continue;
    if (!byGroup11.has(t.groupId)) byGroup11.set(t.groupId, []);
    byGroup11.get(t.groupId).push(t);
  }

  const sharedGroups = [];
  for (const t of pool10) {
    if (!t.groupId || usedGroupIds.has(t.groupId)) continue;
    const mates = byGroup11.get(t.groupId);
    if (mates?.length) sharedGroups.push({ t10: t, t11: mates[0], groupId: t.groupId });
  }

  if (sharedGroups.length) {
    const pick = shuffle(sharedGroups, rng)[0];
    return [
      { ...pick.t10, pos: 10, blockKey: "topo" },
      { ...pick.t11, pos: 11, blockKey: "topo" },
    ];
  }

  // Fallback без общего groupId (не должен срабатывать на текущем банке)
  const t10 = pickTask(pools[10], usedIds, usedGroupIds, rng, false);
  if (!t10) throw new Error("Диагностика: пустой пул для позиции 10 (блок topo)");
  markUsed(t10, usedIds, usedGroupIds);
  const t11 = pickTask(pools[11], usedIds, usedGroupIds, rng, true);
  if (!t11) throw new Error("Диагностика: пустой пул для позиции 11 (блок topo)");
  return [
    { ...t10, pos: 10, blockKey: "topo" },
    { ...t11, pos: 11, blockKey: "topo" },
  ];
}

/**
 * Собирает набор диагностики v2 (13 заданий).
 * Топо 10+11 из одного groupId; остальные блоки — B′ (prefer choice).
 *
 * @param {Array} TASKS
 * @param {() => number} [rng]
 * @returns {Array} задания с полями pos, blockKey
 */
export function buildDiagnosticSet(TASKS, rng = Math.random) {
  const pools = buildPositionPools(TASKS);
  const usedIds = new Set();
  const usedGroupIds = new Set();
  const picked = [];

  // 1) topo — связка по groupId
  const topoPair = pickTopoPair(pools, usedIds, usedGroupIds, rng);
  for (const task of topoPair) {
    markUsed(task, usedIds, usedGroupIds);
    picked.push(task);
  }

  // 2) остальные блоки
  for (const block of DIAGNOSTIC_BLOCKS) {
    if (block.key === "topo") continue;
    const selectedPos = selectPositions(block, pools, usedIds, usedGroupIds, rng);
    for (const pos of selectedPos) {
      const preferChoice = true;
      const task = pickTask(pools[pos], usedIds, usedGroupIds, rng, preferChoice);
      if (!task) {
        throw new Error(`Диагностика: пустой пул для позиции ${pos} (блок ${block.key})`);
      }
      markUsed(task, usedIds, usedGroupIds);
      picked.push({ ...task, pos, blockKey: block.key });
    }
  }

  picked.sort((a, b) => a.pos - b.pos);
  return picked;
}

/**
 * Светофор блока по числу верных ответов.
 * wrong=0 → green; wrong=1 → yellow; wrong≥2 → red.
 * Для total=1: 1/1 green, 0/1 red (жёлтого нет).
 * @returns {"green"|"yellow"|"red"}
 */
export function blockTrafficLight(correct, total) {
  const wrong = total - correct;
  if (wrong <= 0) return "green";
  if (total <= 1) return "red";
  if (wrong === 1) return "yellow";
  return "red";
}

/** Собрать { topo: [верно, всего], ... } из ответов VariantRunner. */
export function summarizeBlocks(answers) {
  const blocks = {};
  for (const b of DIAGNOSTIC_BLOCKS) {
    blocks[b.key] = [0, 0];
  }
  for (const a of answers) {
    const key = a.task?.blockKey;
    if (!key || !blocks[key]) continue;
    blocks[key][1] += 1;
    if (a.right) blocks[key][0] += 1;
  }
  return blocks;
}

/**
 * Ранжирование блоков для hero / Telegram / плана.
 * 1) red → yellow → green; 2) wrong/total; 3) wrong; 4) examPrimaryMax.
 */
export function rankDiagnosticBlocks(blocks) {
  const lightRank = { red: 0, yellow: 1, green: 2 };
  return DIAGNOSTIC_BLOCKS.map((b) => {
    const [ok, total] = blocks[b.key] || [0, b.count];
    const wrong = total - ok;
    const light = blockTrafficLight(ok, total);
    const ratio = total > 0 ? wrong / total : 0;
    return {
      ...b,
      ok,
      total,
      wrong,
      light,
      examPrimaryMax: blockExamPoints(b),
      ratio,
    };
  }).sort((a, b) => {
    if (lightRank[a.light] !== lightRank[b.light]) return lightRank[a.light] - lightRank[b.light];
    if (b.ratio !== a.ratio) return b.ratio - a.ratio;
    if (b.wrong !== a.wrong) return b.wrong - a.wrong;
    return b.examPrimaryMax - a.examPrimaryMax;
  });
}

function utf8ToBase64Url(str) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUtf8(code) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(code, "base64url").toString("utf8");
  }
  const pad = code.length % 4 === 0 ? "" : "=".repeat(4 - (code.length % 4));
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/**
 * Кодирует результат в параметр r (всегда v2).
 * Формат: v2|YYYY-MM-DD|topo:1/2|maps:2/2|…
 * @param {{ date: string, blocks: Record<string, [number, number]> }} result
 * @returns {string}
 */
export function encodeResult(result) {
  const parts = [`v2`, result.date];
  for (const b of DIAGNOSTIC_BLOCKS) {
    const [ok, total] = result.blocks[b.key] || [0, b.count];
    parts.push(`${b.key}:${ok}/${total}`);
  }
  return utf8ToBase64Url(parts.join("|"));
}

/**
 * Декодирует r. Понимает v1 (старые totals) и v2 (текущие).
 * Битая / чужая строка → null.
 * @param {string} code
 * @returns {{ date: string, blocks: Record<string, [number, number]>, version: 1|2 } | null}
 */
export function decodeResult(code) {
  if (!code || typeof code !== "string") return null;
  let raw;
  try {
    raw = base64UrlToUtf8(code);
  } catch {
    return null;
  }
  const parts = raw.split("|");
  if (parts.length < 2) return null;
  const ver = parts[0];
  if (ver !== "v1" && ver !== "v2") return null;
  const version = ver === "v1" ? 1 : 2;
  const date = parts[1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const expectedCounts = version === 1 ? DIAGNOSTIC_V1_COUNTS : null;

  const blocks = {};
  const seen = new Set();
  for (let i = 2; i < parts.length; i++) {
    const m = /^([a-z]+):(\d+)\/(\d+)$/.exec(parts[i]);
    if (!m) return null;
    const [, key, okStr, totalStr] = m;
    const meta = DIAGNOSTIC_BLOCKS.find((b) => b.key === key);
    if (!meta || seen.has(key)) return null;
    const ok = Number(okStr);
    const total = Number(totalStr);
    const expectTotal = expectedCounts ? expectedCounts[key] : meta.count;
    if (total !== expectTotal || ok > total || ok < 0) return null;
    blocks[key] = [ok, total];
    seen.add(key);
  }
  if (seen.size !== DIAGNOSTIC_BLOCKS.length) return null;
  return { date, blocks, version };
}

const HISTORY_KEY = "diag:history";

export function loadDiagHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Добавляет результат в историю (в начало). Возвращает предыдущий, если был. */
export function pushDiagHistory(result) {
  let prev = null;
  try {
    const hist = loadDiagHistory();
    prev = hist[0] || null;
    const entry = { version: 2, date: result.date, blocks: result.blocks };
    const next = [entry, ...hist].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* приватный режим — не сохраняем */
  }
  return prev;
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
