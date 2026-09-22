// Сборка мини-диагностики ОГЭ и кодирование результата в URL.
// Спека: docs/diagnostic-spec.md. Эссе (поз. 12/29/30) не берём.

import { shuffle } from "./utils.js";
import { buildPositionPools } from "./positionClassifier.js";

/** @typedef {{ key: string, title: string, positions: number[], count: number, examPoints: number }} DiagnosticBlock */

/** Блоки диагностики — порядок и ключи зафиксированы в спеке. */
export const DIAGNOSTIC_BLOCKS = /** @type {DiagnosticBlock[]} */ ([
  { key: "topo", title: "Топография (план местности)", positions: [9, 10, 11], count: 3, examPoints: 3 },
  { key: "maps", title: "Карты, координаты, часовые пояса", positions: [7, 26], count: 2, examPoints: 2 },
  { key: "climate", title: "Атмосфера и климат", positions: [5, 6, 16, 17, 18], count: 3, examPoints: 5 },
  { key: "nature", title: "Природа России", positions: [4, 8, 14, 15, 22], count: 3, examPoints: 5 },
  { key: "people", title: "Население и хозяйство России", positions: [13, 19, 23, 24, 25], count: 3, examPoints: 5 },
  { key: "world", title: "Мир: материки и страны", positions: [1, 3, 20, 21, 27], count: 3, examPoints: 5 },
  { key: "regions", title: "Регионы России по тексту", positions: [2, 28], count: 2, examPoints: 2 },
]);

export const DIAGNOSTIC_TOTAL = DIAGNOSTIC_BLOCKS.reduce((s, b) => s + b.count, 0); // 19

/**
 * Собирает набор диагностики: внутри блока — N разных позиций,
 * задания без эссе и без повторов groupId, порядок — по возрастанию позиции.
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

  for (const block of DIAGNOSTIC_BLOCKS) {
    const selectedPos = shuffle(block.positions, rng).slice(0, block.count);
    for (const pos of selectedPos) {
      const pool = (pools[pos] || []).filter((t) => {
        if (t.type === "essay") return false;
        if (usedIds.has(t.id)) return false;
        if (t.groupId && usedGroupIds.has(t.groupId)) return false;
        return true;
      });
      const candidates = shuffle(pool, rng);
      const task = candidates[0];
      if (!task) {
        throw new Error(`Диагностика: пустой пул для позиции ${pos} (блок ${block.key})`);
      }
      usedIds.add(task.id);
      if (task.groupId) usedGroupIds.add(task.groupId);
      picked.push({ ...task, pos, blockKey: block.key });
    }
  }

  picked.sort((a, b) => a.pos - b.pos);
  return picked;
}

/**
 * Светофор блока по числу верных ответов.
 * @returns {"green"|"yellow"|"red"}
 */
export function blockTrafficLight(correct, total) {
  const wrong = total - correct;
  if (wrong <= 0) return "green";
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
 * Кодирует результат в параметр r.
 * Формат: v1|YYYY-MM-DD|topo:1/3|maps:2/2|…
 * @param {{ date: string, blocks: Record<string, [number, number]> }} result
 * @returns {string}
 */
export function encodeResult(result) {
  const parts = [`v1`, result.date];
  for (const b of DIAGNOSTIC_BLOCKS) {
    const [ok, total] = result.blocks[b.key] || [0, b.count];
    parts.push(`${b.key}:${ok}/${total}`);
  }
  return utf8ToBase64Url(parts.join("|"));
}

/**
 * Декодирует r. Битая / чужая строка → null.
 * @param {string} code
 * @returns {{ date: string, blocks: Record<string, [number, number]> } | null}
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
  if (parts.length < 2 || parts[0] !== "v1") return null;
  const date = parts[1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

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
    if (total !== meta.count || ok > total || ok < 0) return null;
    blocks[key] = [ok, total];
    seen.add(key);
  }
  if (seen.size !== DIAGNOSTIC_BLOCKS.length) return null;
  return { date, blocks };
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
    const next = [result, ...hist].slice(0, 20);
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
