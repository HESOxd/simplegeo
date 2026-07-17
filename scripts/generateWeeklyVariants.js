// Генерирует 5 "вариантов недели" — детерминированно по номеру ISO-недели,
// так что все посетители сайта видят один и тот же набор всю неделю, а на
// следующей неделе — другой. Запускается по расписанию через GitHub Actions
// (.github/workflows/weekly-variants.yml), можно и вручную:
//   node scripts/generateWeeklyVariants.js
//
// Хранит в public/weekly-variants.json только id заданий (не сами задания —
// они и так есть в src/data.js), чтобы файл был маленьким.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TASKS } from "../src/data.js";
import { buildFaithfulVariant } from "../src/variantBuilder.js";
import { seededRng } from "../src/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "..", "public", "weekly-variants.json");
const VARIANT_COUNT = 5;

function isoWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function main() {
  const weekId = isoWeekId();
  const baseSeed = hashString(weekId);

  const variants = [];
  const usedAcrossWeek = new Set();
  for (let i = 0; i < VARIANT_COUNT; i++) {
    const rng = seededRng(baseSeed + i * 7919); // разные простые сдвиги на каждый вариант
    const deck = buildFaithfulVariant(TASKS, rng, usedAcrossWeek);
    deck.forEach((t) => usedAcrossWeek.add(t.id));
    variants.push(deck.map((t) => t.id));
  }

  const output = {
    weekId,
    generatedAt: new Date().toISOString(),
    variants,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Записано ${OUT_PATH}`);
  console.log(`Неделя: ${weekId}, вариантов: ${variants.length}, заданий в каждом: ${variants.map((v) => v.length).join(", ")}`);
}

main();
