// Проверка банка заданий (src/data.js). Файл генерируется пайплайном
// ~/Desktop/fipi_parser/, руками не правится — поэтому единственный способ
// поймать испорченное задание до того, как его увидит ученик, это такой тест.

import { describe, it, expect } from "vitest";
import { TASKS, SECTIONS } from "../src/data.js";
import { isTaskRight } from "../src/utils.js";

const byType = (t) => TASKS.filter((x) => x.type === t);

describe("банк заданий — общая целостность", () => {
  it("непустой и все id уникальны", () => {
    expect(TASKS.length).toBeGreaterThan(2000);
    const ids = TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("у каждого задания есть текст вопроса", () => {
    const empty = TASKS.filter((t) => !String(t.q || "").trim()).map((t) => t.id);
    expect(empty).toEqual([]);
  });

  it("каждое задание относится к известному разделу", () => {
    const bad = TASKS.filter((t) => !SECTIONS[t.sec]).map((t) => `${t.id}: sec=${t.sec}`);
    expect(bad).toEqual([]);
  });

  it("тип задания — один из поддерживаемых интерфейсом", () => {
    const known = new Set(["single", "multi", "short", "sequence", "essay"]);
    const bad = TASKS.filter((t) => !known.has(t.type)).map((t) => `${t.id}: ${t.type}`);
    expect(bad).toEqual([]);
  });

  it("[РЕГРЕССИЯ] в банке нет двух полностью одинаковых заданий под разными id", () => {
    // Осторожно: одинаковый ТЕКСТ вопроса — это норма, в банке ФИПИ 164 такие
    // группы (одна формулировка, разные варианты ответа). Настоящая проблема —
    // когда совпадает вообще всё, включая ответ и картинку: такое задание
    // занимает два слота в банке и может встретиться ученику дважды.
    const sig = (t) =>
      JSON.stringify([
        t.q.replace(/\s+/g, " ").trim(),
        t.options ?? null,
        t.correct ?? null,
        t.answer ?? null,
        t.image ?? null,
        t.table ?? null,
        t.optionImages ?? null,
      ]);
    const seen = new Map();
    const dups = [];
    for (const t of TASKS) {
      const k = sig(t);
      if (seen.has(k)) dups.push(`${seen.get(k)} == ${t.id}`);
      else seen.set(k, t.id);
    }
    expect(dups).toEqual([]);
  });

  it("[ПРОВЕРКА] задания с общей формулировкой, но разными ответами — известная особенность банка", () => {
    // Фиксируем масштаб явления. Если число резко вырастет — в пайплайне
    // что-то сломалось; если упадёт до нуля — банк перегенерировали иначе.
    // Опасность таких пар в том, что две из них в одном варианте выглядят
    // для ученика как одно и то же задание с разными «правильными» ответами
    // (что этого не происходит, проверяет tests/variantBuilder.test.js).
    const groups = new Map();
    for (const t of TASKS) {
      const k = t.q.replace(/\s+/g, " ").trim();
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(t);
    }
    const shared = [...groups.values()].filter((g) => g.length > 1);
    expect(shared.length).toBeLessThan(200);
  });
});

describe("задания с выбором варианта", () => {
  it("single: есть варианты ответа (текстом или картинками)", () => {
    const bad = byType("single")
      .filter((t) => !t.options && !t.optionImages)
      .map((t) => t.id);
    expect(bad).toEqual([]);
  });

  it("single: correct — существующий индекс в списке вариантов", () => {
    const bad = byType("single")
      .filter((t) => {
        const opts = t.options || t.optionImages || [];
        return !Number.isInteger(t.correct) || t.correct < 0 || t.correct >= opts.length;
      })
      .map((t) => `${t.id}: correct=${t.correct}`);
    expect(bad).toEqual([]);
  });

  it("multi: correct — массив минимум из двух разных существующих индексов", () => {
    const bad = byType("multi")
      .filter((t) => {
        if (!Array.isArray(t.correct) || t.correct.length < 2) return true;
        if (new Set(t.correct).size !== t.correct.length) return true;
        const n = (t.options || []).length;
        return t.correct.some((i) => !Number.isInteger(i) || i < 0 || i >= n);
      })
      .map((t) => `${t.id}: ${JSON.stringify(t.correct)}`);
    expect(bad).toEqual([]);
  });

  it("варианты ответа не пустые", () => {
    const bad = TASKS.filter((t) => t.options?.some((o) => !String(o ?? "").trim())).map((t) => t.id);
    expect(bad).toEqual([]);
  });
});

describe("задания с вводом ответа", () => {
  it("short: ответ непустой, format известен", () => {
    const bad = byType("short")
      .filter((t) => !String(t.answer ?? "").trim() || !["word", "number"].includes(t.format))
      .map((t) => `${t.id}: format=${t.format} answer=${JSON.stringify(t.answer)}`);
    expect(bad).toEqual([]);
  });

  it("[РЕГРЕССИЯ] числовой ответ действительно выглядит как число", () => {
    // Ловит и испорченные значения, и «минус», записанный длинным тире.
    const bad = byType("short")
      .filter((t) => t.format === "number")
      .filter((t) => !/^-?\d+([.,]\d+)?$/.test(String(t.answer).trim()))
      .map((t) => `${t.id}: ${JSON.stringify(t.answer)}`);
    expect(bad).toEqual([]);
  });

  it("[РЕГРЕССИЯ] в сравниваемых ответах нет длинного тире вместо минуса", () => {
    // en dash / minus sign выглядят как минус, но ученик набирает «-» и
    // получает «неверно» при верном по смыслу ответе.
    // Только short и sequence: в эссе ответ не сравнивается строкой, там тире —
    // обычный знак препинания внутри текста, и это нормально.
    const bad = TASKS.filter((t) => ["short", "sequence"].includes(t.type))
      .filter((t) => /[‒–—−]/.test(String(t.answer ?? "")))
      .map((t) => `${t.id}: ${JSON.stringify(t.answer)}`);
    expect(bad).toEqual([]);
  });

  it("[РЕГРЕССИЯ] ответ не начинается со знака препинания", () => {
    // Признак обрезанного при парсинге значения (например «,3» вместо «-0,3»).
    const bad = byType("short")
      .filter((t) => /^[,;.]/.test(String(t.answer).trim()))
      .map((t) => `${t.id}: ${JSON.stringify(t.answer)}`);
    expect(bad).toEqual([]);
  });

  it("sequence: ответ — только цифры", () => {
    const bad = byType("sequence")
      .filter((t) => !/^\d+$/.test(String(t.answer ?? "").trim()))
      .map((t) => `${t.id}: ${JSON.stringify(t.answer)}`);
    expect(bad).toEqual([]);
  });

  it("essay: есть эталонный ответ, критерии и вид задания", () => {
    const bad = byType("essay")
      .filter((t) => !t.answer || !t.criteria || !["map", "text"].includes(t.essayKind))
      .map((t) => `${t.id}: essayKind=${t.essayKind}`);
    expect(bad).toEqual([]);
  });
});

describe("самопроверка банка: эталонный ответ засчитывается собственной проверкой", () => {
  // Главный тест файла. Берём верный ответ из банка, подаём его в isTaskRight
  // ровно так, как это сделает интерфейс, и требуем «верно». Всё, что здесь
  // падает, ученик увидит как «ты ошибся», ответив правильно.

  it("single", () => {
    const bad = byType("single")
      .filter((t) => !isTaskRight(t, { single: t.correct }))
      .map((t) => t.id);
    expect(bad).toEqual([]);
  });

  it("multi", () => {
    const bad = byType("multi")
      .filter((t) => !isTaskRight(t, { multi: [...t.correct] }))
      .map((t) => t.id);
    expect(bad).toEqual([]);
  });

  it("short", () => {
    const bad = byType("short")
      .filter((t) => !isTaskRight(t, { text: String(t.answer) }))
      .map((t) => `${t.id}: ${JSON.stringify(t.answer)}`);
    expect(bad).toEqual([]);
  });

  it("[РЕГРЕССИЯ] short: ответ, набранный с обычной клавиатуры, тоже засчитывается", () => {
    // Ученик физически не может ввести длинное тире — он нажмёт «-».
    const keyboard = (s) => String(s).replace(/[‒–—−]/g, "-");
    const bad = byType("short")
      .filter((t) => !isTaskRight(t, { text: keyboard(t.answer) }))
      .map((t) => `${t.id}: ${JSON.stringify(t.answer)}`);
    expect(bad).toEqual([]);
  });

  it("sequence", () => {
    const bad = byType("sequence")
      .filter((t) => !isTaskRight(t, { text: String(t.answer) }))
      .map((t) => t.id);
    expect(bad).toEqual([]);
  });
});

describe("картинки", () => {
  it("если картинка указана, это непустая строка", () => {
    const bad = TASKS.filter((t) => t.image !== null && t.image !== undefined)
      .filter((t) => typeof t.image !== "string" || !t.image.trim())
      .map((t) => t.id);
    expect(bad).toEqual([]);
  });

  it("[РИСК] картинки грузятся только с известного домена ФИПИ и ниоткуда больше", () => {
    // Осознанное решение проекта: картинки заданий не копируются к себе, а
    // тянутся с oge.fipi.ru. Цена решения — сайт показывает битые картинки,
    // когда лежит сервер ФИПИ, и IP посетителя уходит на этот сервер.
    // Тест не требует это чинить, но не даёт втихую добавить третий домен.
    const domains = TASKS.filter((t) => typeof t.image === "string" && /^https?:\/\//.test(t.image)).map(
      (t) => t.image.replace(/^(https?:\/\/[^/]+).*$/, "$1")
    );
    expect([...new Set(domains)].sort()).toEqual(["https://oge.fipi.ru"]);
  });
});
