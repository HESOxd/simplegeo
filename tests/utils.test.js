// Проверка ядра: norm() и isTaskRight() решают, засчитать ответ ученику или нет.
// Ошибка здесь = ученик получает неверную оценку своего ответа, и заметить это
// без тестов практически невозможно.

import { describe, it, expect } from "vitest";
import { norm, shuffle, seededRng, isTaskRight } from "../src/utils.js";

describe("norm — нормализация текстового ответа", () => {
  it("не различает ё и е", () => {
    expect(norm("Сёла")).toBe(norm("Села"));
  });

  it("не различает регистр и лишние пробелы", () => {
    expect(norm("  Египет  ")).toBe(norm("египет"));
    expect(norm("Северный   Ледовитый")).toBe("северный ледовитый");
  });

  it("убирает финальную точку и запятые", () => {
    expect(norm("Египет.")).toBe("египет");
  });

  it("сохраняет десятичную запятую: «1,4» и «14» — разные ответы", () => {
    // Раньше запятая стиралась вместе с пунктуацией, и «14» засчитывалось
    // вместо «1,4» — ошибка ровно в 10 раз считалась верным ответом.
    expect(norm("1,4")).not.toBe(norm("14"));
  });

  it("«1,4» и «1.4» — один и тот же ответ", () => {
    expect(norm("1,4")).toBe(norm("1.4"));
  });

  it("приводит длинное тире (U+2013) и минус (U+2212) к обычному дефису", () => {
    // В банке минус местами записан через «–», а на клавиатуре ученика только «-».
    expect(norm("–10294")).toBe(norm("-10294"));
    expect(norm("−10294")).toBe(norm("-10294"));
  });

  it("склеивает разряды, разделённые пробелом: «12 102» = «12102»", () => {
    expect(norm("-12 102")).toBe(norm("-12102"));
  });

  it("не склеивает то, что разрядами не является", () => {
    expect(norm("12 10")).toBe("12 10");
    expect(norm("волга 3530")).toBe("волга 3530");
  });
});

describe("isTaskRight — задания с выбором", () => {
  const single = { type: "single", options: ["а", "б", "в"], correct: 1 };

  it("single: засчитывает только правильный индекс", () => {
    expect(isTaskRight(single, { single: 1 })).toBe(true);
    expect(isTaskRight(single, { single: 0 })).toBe(false);
    expect(isTaskRight(single, { single: null })).toBe(false);
  });

  const multi = { type: "multi", options: ["а", "б", "в", "г"], correct: [1, 3] };

  it("multi: порядок выбора не важен", () => {
    expect(isTaskRight(multi, { multi: [3, 1] })).toBe(true);
    expect(isTaskRight(multi, { multi: [1, 3] })).toBe(true);
  });

  it("multi: неполный или лишний выбор не засчитывается", () => {
    expect(isTaskRight(multi, { multi: [1] })).toBe(false);
    expect(isTaskRight(multi, { multi: [1, 3, 0] })).toBe(false);
    expect(isTaskRight(multi, { multi: [] })).toBe(false);
  });

  it("multi: один и тот же вариант, выбранный дважды, ломает сравнение", () => {
    // Через UI так не сделать, но функция экспортируется и используется
    // из нескольких мест — контракт должен быть честным.
    const two = { type: "multi", options: ["а", "б"], correct: [0, 1] };
    expect(isTaskRight(two, { multi: [0, 0, 1] })).toBe(false);
  });

  it("multi: сравнение индексов не должно зависеть от строкового порядка сортировки", () => {
    // [2, 10].sort() по умолчанию даёт [10, 2] — лексикографически.
    // Пока обе стороны сортируются одинаково, это безопасно. Тест это фиксирует,
    // чтобы случайная «оптимизация» одной из сторон не сломала проверку.
    const many = {
      type: "multi",
      options: Array.from({ length: 12 }, (_, i) => `опция ${i}`),
      correct: [2, 10],
    };
    expect(isTaskRight(many, { multi: [10, 2] })).toBe(true);
    expect(isTaskRight(many, { multi: [2, 10] })).toBe(true);
  });
});

describe("isTaskRight — короткий ответ", () => {
  it("засчитывает с точностью до регистра, ё/е и пробелов", () => {
    const t = { type: "short", answer: "Египет" };
    expect(isTaskRight(t, { text: "  египет " })).toBe(true);
    expect(isTaskRight(t, { text: "Турция" })).toBe(false);
  });

  it("пустой ответ не засчитывается", () => {
    expect(isTaskRight({ type: "short", answer: "Египет" }, { text: "" })).toBe(false);
  });

  it("десятичный ответ: «-45» не засчитывается вместо «-4,5»", () => {
    const t = { type: "short", format: "number", answer: "-4,5" };
    expect(isTaskRight(t, { text: "-4,5" })).toBe(true);
    expect(isTaskRight(t, { text: "-4.5" })).toBe(true);
    // Ошибка на порядок должна оставаться ошибкой.
    expect(isTaskRight(t, { text: "-45" })).toBe(false);
  });

  it("ответ с длинным тире в банке засчитывается при вводе обычного минуса", () => {
    const t = { type: "short", format: "number", answer: "–10294" }; // en dash
    expect(isTaskRight(t, { text: "-10294" })).toBe(true);
  });

  it("ответ с пробелом-разделителем разрядов засчитывается и без пробела", () => {
    const t = { type: "short", answer: "–12 102" };
    expect(isTaskRight(t, { text: "-12102" })).toBe(true);
    expect(isTaskRight(t, { text: "-12 102" })).toBe(true);
  });
});

describe("isTaskRight — последовательность и эссе", () => {
  it("sequence: пробелы внутри ответа игнорируются", () => {
    const t = { type: "sequence", answer: "321" };
    expect(isTaskRight(t, { text: "3 2 1" })).toBe(true);
    expect(isTaskRight(t, { text: "321" })).toBe(true);
    expect(isTaskRight(t, { text: "312" })).toBe(false);
  });

  it("essay: засчитывается только явная самопроверка", () => {
    const t = { type: "essay" };
    expect(isTaskRight(t, { selfRight: true })).toBe(true);
    expect(isTaskRight(t, { selfRight: false })).toBe(false);
    expect(isTaskRight(t, { selfRight: null })).toBe(false);
  });

  it("не падает на пустом задании и неизвестном типе", () => {
    expect(isTaskRight(null, { text: "что угодно" })).toBe(false);
    expect(isTaskRight({ type: "чего-то-новое" }, { text: "х" })).toBe(false);
  });
});

describe("shuffle и seededRng", () => {
  it("shuffle не меняет исходный массив и сохраняет состав", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([...src].sort());
  });

  it("seededRng детерминирован: один seed — одна и та же последовательность", () => {
    const a = Array.from({ length: 10 }, seededRng(42));
    const b = Array.from({ length: 10 }, seededRng(42));
    expect(a).toEqual(b);
  });

  it("seededRng: разные seed дают разные последовательности", () => {
    const a = Array.from({ length: 10 }, seededRng(1));
    const b = Array.from({ length: 10 }, seededRng(2));
    expect(a).not.toEqual(b);
  });

  it("seededRng остаётся в диапазоне [0, 1)", () => {
    const rng = seededRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("shuffle с seededRng воспроизводим — на этом держатся варианты недели", () => {
    const src = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffle(src, seededRng(99))).toEqual(shuffle(src, seededRng(99)));
  });
});
