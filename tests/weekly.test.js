// Варианты недели — единственная часть сайта, где данные лежат отдельным
// файлом (public/weekly-variants.json) и ссылаются на банк заданий по id.
// Если банк перегенерировать, id могут измениться, а json останется старым:
// WeeklyVariants.jsx делает .filter(Boolean) и молча покажет вариант из,
// скажем, 22 заданий вместо 30 — без единой ошибки в консоли.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TASKS } from "../src/data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, "..", "public", "weekly-variants.json");

const weekly = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
const known = new Set(TASKS.map((t) => t.id));

describe("public/weekly-variants.json — форма файла", () => {
  it("есть weekId, дата генерации и пять вариантов", () => {
    expect(weekly.weekId).toMatch(/^\d{4}-W\d{2}$/);
    expect(Number.isNaN(Date.parse(weekly.generatedAt))).toBe(false);
    expect(Array.isArray(weekly.variants)).toBe(true);
    expect(weekly.variants).toHaveLength(5);
  });

  it("в каждом варианте ровно 30 заданий", () => {
    expect(weekly.variants.map((v) => v.length)).toEqual([30, 30, 30, 30, 30]);
  });

  it("варианты не пересекаются между собой", () => {
    const flat = weekly.variants.flat();
    expect(flat.length - new Set(flat).size).toBe(0);
  });
});

describe("связь с банком заданий", () => {
  it("каждый id из файла существует в src/data.js", () => {
    const missing = weekly.variants.flat().filter((id) => !known.has(id));
    expect(missing).toEqual([]);
  });

  it("после разрешения id вариант остаётся из 30 заданий", () => {
    // Ровно та операция, что делает WeeklyVariants.jsx.
    const resolved = weekly.variants.map((ids) =>
      ids.map((id) => TASKS.find((t) => t.id === id)).filter(Boolean)
    );
    expect(resolved.map((v) => v.length)).toEqual([30, 30, 30, 30, 30]);
  });

  it("[ПРОВЕРКА] файл не устарел относительно текущей недели", () => {
    // Генератор запускается по понедельникам через GitHub Actions. Две причины,
    // по которым этот тест краснеет, и различать их важно:
    //   1) workflow упал — тогда ученики всю неделю видят прошлонедельные
    //      варианты, и без этого теста об этом никто не узнает;
    //   2) локальная копия просто отстала — бот коммитит новый json прямо в
    //      main, так что после его запуска нужно сделать git pull.
    // Прежде чем чинить генератор, проверь второе: git fetch && git log origin/main.
    const d = new Date();
    const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = u.getUTCDay() || 7;
    u.setUTCDate(u.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((u - yearStart) / 86400000 + 1) / 7);
    const currentWeek = `${u.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
    expect(weekly.weekId).toBe(currentWeek);
  });
});
