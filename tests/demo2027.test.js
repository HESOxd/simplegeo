// Демо-вариант ОГЭ 2027 — единственные данные, набранные вручную с PDF ФИПИ,
// а не сгенерированные пайплайном. Значит, опечатка в ответе здесь вполне
// реальна, и поймать её может только проверка.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMO_2027 } from "../src/data/demo2027.js";
import { isTaskRight } from "../src/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "public");

describe("демо-2027 — состав", () => {
  it("задания есть, id уникальны", () => {
    expect(DEMO_2027.length).toBeGreaterThan(0);
    const ids = DEMO_2027.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("у каждого задания есть текст вопроса", () => {
    const empty = DEMO_2027.filter((t) => !String(t.q || "").trim()).map((t) => t.id);
    expect(empty).toEqual([]);
  });

  it("типы заданий поддерживаются интерфейсом", () => {
    const known = new Set(["single", "multi", "short", "sequence", "essay"]);
    const bad = DEMO_2027.filter((t) => !known.has(t.type)).map((t) => `${t.id}: ${t.type}`);
    expect(bad).toEqual([]);
  });
});

describe("демо-2027 — ответы", () => {
  it("single/multi: correct указывает на существующие варианты", () => {
    const bad = DEMO_2027.filter((t) => {
      const opts = t.options || t.optionImages || [];
      if (t.type === "single") return !Number.isInteger(t.correct) || t.correct < 0 || t.correct >= opts.length;
      if (t.type === "multi") {
        if (!Array.isArray(t.correct) || t.correct.length < 2) return true;
        return t.correct.some((i) => !Number.isInteger(i) || i < 0 || i >= opts.length);
      }
      return false;
    }).map((t) => `${t.id}: ${JSON.stringify(t.correct)}`);
    expect(bad).toEqual([]);
  });

  it("short/sequence/essay: ответ непустой", () => {
    const bad = DEMO_2027.filter(
      (t) => ["short", "sequence", "essay"].includes(t.type) && !String(t.answer ?? "").trim()
    ).map((t) => t.id);
    expect(bad).toEqual([]);
  });

  // У short-заданий демо ответ может быть списком синонимов («Алтай» / «Алтая») —
  // засчитываться должен каждый из них по отдельности.
  const accepted = (t) => (Array.isArray(t.answer) ? t.answer : [t.answer]);

  it("эталонный ответ засчитывается собственной проверкой", () => {
    const bad = DEMO_2027.filter((t) => {
      if (t.type === "single") return !isTaskRight(t, { single: t.correct });
      if (t.type === "multi") return !isTaskRight(t, { multi: [...t.correct] });
      if (t.type === "essay") return false; // самопроверка учеником
      return accepted(t).some((a) => !isTaskRight(t, { text: String(a) }));
    }).map((t) => `${t.id} (${t.type}): ${JSON.stringify(t.answer ?? t.correct)}`);
    expect(bad).toEqual([]);
  });

  it("[РЕГРЕССИЯ] ответ, набранный с обычной клавиатуры, тоже засчитывается", () => {
    const keyboard = (s) => String(s).replace(/[‒–—−]/g, "-");
    const bad = DEMO_2027.filter(
      (t) =>
        ["short", "sequence"].includes(t.type) &&
        accepted(t).some((a) => !isTaskRight(t, { text: keyboard(a) }))
    ).map((t) => `${t.id}: ${JSON.stringify(t.answer)}`);
    expect(bad).toEqual([]);
  });
});

describe("демо-2027 — картинки", () => {
  it("каждая указанная картинка реально лежит в public/", () => {
    const missing = [];
    for (const t of DEMO_2027) {
      for (const src of [t.image, t.image2, ...(t.optionImages || [])]) {
        if (typeof src !== "string" || !src.startsWith("/")) continue;
        if (!fs.existsSync(path.join(PUBLIC_DIR, src.slice(1)))) missing.push(`${t.id}: ${src}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
