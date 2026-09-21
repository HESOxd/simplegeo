// Сборка «полного варианта» — самая сложная логика проекта. Она обязана
// повторять структуру реального КИМ ОГЭ: 30 позиций, пять сцепленных блоков
// с общим контекстом (карта, погода, наблюдения, демография, текст).
// Ошибка тут не падает с исключением — она молча выдаёт вариант, который
// «выглядит нормально», но не соответствует экзамену.

import { describe, it, expect } from "vitest";
import { TASKS } from "../src/data.js";
import { buildFaithfulVariant, REAL_EXAM_TOTAL } from "../src/variantBuilder.js";
import { buildPositionPools, buildClusterGroups, POSITION_TOPIC } from "../src/positionClassifier.js";
import { seededRng } from "../src/utils.js";

const POSITIONS = Array.from({ length: 30 }, (_, i) => i + 1);
const CLUSTERS = {
  "карта (9-12)": [9, 10, 11, 12],
  "погода (5-6)": [5, 6],
  "наблюдения (16-17)": [16, 17],
  "демография (23-24)": [23, 24],
  "текст (28-30)": [28, 29, 30],
};

// Один и тот же набор вариантов для всех тестов — 60 прогонов с фиксированными
// seed, чтобы падение всегда воспроизводилось одинаково.
const RUNS = Array.from({ length: 60 }, (_, i) => buildFaithfulVariant(TASKS, seededRng(i)));

describe("классификатор позиций", () => {
  const pools = buildPositionPools(TASKS);

  it("у каждой из 30 позиций есть непустой пул заданий", () => {
    const empty = POSITIONS.filter((p) => !pools[p] || pools[p].length === 0);
    expect(empty).toEqual([]);
  });

  it("у каждой позиции описана тема", () => {
    const missing = POSITIONS.filter((p) => !POSITION_TOPIC[p]);
    expect(missing).toEqual([]);
  });

  it("сцепленные группы существуют для всех пяти блоков", () => {
    const cg = buildClusterGroups(TASKS);
    for (const key of ["mapGroups", "weatherGroups", "studentGroups", "popPairGroups", "textGroups"]) {
      expect(cg[key], key).toBeTruthy();
      expect(cg[key].length, `${key} пуст`).toBeGreaterThan(0);
    }
  });

  it("[ПРОВЕРКА] пул каждой позиции достаточен для 5 вариантов недели", () => {
    const thin = POSITIONS.filter((p) => pools[p].length < 5).map((p) => `поз.${p}: ${pools[p].length}`);
    expect(thin).toEqual([]);
  });
});

describe("структура собранного варианта", () => {
  it("ровно 30 заданий, позиции 1..30 по порядку", () => {
    const broken = RUNS.map((v, i) => {
      if (v.length !== REAL_EXAM_TOTAL) return `прогон ${i}: ${v.length} заданий`;
      const pos = v.map((t) => t.pos);
      if (pos.join(",") !== POSITIONS.join(",")) return `прогон ${i}: позиции ${pos.join(",")}`;
      return null;
    }).filter(Boolean);
    expect(broken).toEqual([]);
  });

  it("внутри варианта нет повторов заданий", () => {
    const broken = RUNS.map((v, i) => {
      const ids = v.map((t) => t.id);
      return new Set(ids).size === ids.length ? null : `прогон ${i}`;
    }).filter(Boolean);
    expect(broken).toEqual([]);
  });

  it("внутри варианта нет двух заданий с одинаковым вопросом", () => {
    const broken = RUNS.map((v, i) => {
      const qs = v.map((t) => t.q.replace(/\s+/g, " ").trim());
      return new Set(qs).size === qs.length ? null : `прогон ${i}`;
    }).filter(Boolean);
    expect(broken).toEqual([]);
  });

  it("каждое задание взято из пула своей позиции", () => {
    const pools = buildPositionPools(TASKS);
    const sets = Object.fromEntries(POSITIONS.map((p) => [p, new Set(pools[p].map((t) => t.id))]));
    const broken = [];
    RUNS.forEach((v, i) => {
      for (const t of v) if (!sets[t.pos].has(t.id)) broken.push(`прогон ${i}, поз.${t.pos}`);
    });
    expect(broken).toEqual([]);
  });

  it("сцепленные блоки не растащены: общий контекст сохранён", () => {
    const broken = [];
    RUNS.forEach((v, i) => {
      const at = Object.fromEntries(v.map((t) => [t.pos, t]));
      for (const [name, positions] of Object.entries(CLUSTERS)) {
        const groupIds = new Set(positions.map((p) => at[p]?.groupId));
        if (groupIds.size !== 1 || groupIds.has(undefined)) {
          broken.push(`прогон ${i}, ${name}: ${[...groupIds].join(" / ")}`);
        }
      }
    });
    expect(broken).toEqual([]);
  });

  it("развёрнутые ответы стоят на позициях 12, 29, 30", () => {
    const broken = [];
    RUNS.forEach((v, i) => {
      const at = Object.fromEntries(v.map((t) => [t.pos, t]));
      for (const p of [12, 29, 30]) {
        if (at[p]?.type !== "essay") broken.push(`прогон ${i}, поз.${p}: ${at[p]?.type}`);
      }
    });
    expect(broken).toEqual([]);
  });

  it("тип каждого задания поддерживается интерфейсом прохождения", () => {
    const known = new Set(["single", "multi", "short", "sequence", "essay"]);
    const broken = [];
    RUNS.forEach((v, i) => {
      for (const t of v) if (!known.has(t.type)) broken.push(`прогон ${i}, поз.${t.pos}: ${t.type}`);
    });
    expect(broken).toEqual([]);
  });
});

describe("воспроизводимость", () => {
  it("один seed — один и тот же вариант (на этом держатся варианты недели)", () => {
    const a = buildFaithfulVariant(TASKS, seededRng(12345)).map((t) => t.id);
    const b = buildFaithfulVariant(TASKS, seededRng(12345)).map((t) => t.id);
    expect(a).toEqual(b);
  });

  it("разные seed дают разные варианты", () => {
    const a = buildFaithfulVariant(TASKS, seededRng(1)).map((t) => t.id);
    const b = buildFaithfulVariant(TASKS, seededRng(2)).map((t) => t.id);
    expect(a).not.toEqual(b);
  });

  it("варианты не однообразные: 60 прогонов дают много разных наборов", () => {
    const unique = new Set(RUNS.map((v) => v.map((t) => t.id).join("|")));
    expect(unique.size).toBe(RUNS.length);
  });
});

describe("excludeIds — исключение уже использованных заданий", () => {
  it("исключённые задания не попадают в вариант", () => {
    const first = buildFaithfulVariant(TASKS, seededRng(77));
    const exclude = new Set(first.map((t) => t.id));
    const second = buildFaithfulVariant(TASKS, seededRng(78), exclude);
    const overlap = second.filter((t) => exclude.has(t.id)).map((t) => t.id);
    expect(overlap).toEqual([]);
  });

  it("пять вариантов подряд (как в неделе) не пересекаются и все по 30 заданий", () => {
    const used = new Set();
    const sizes = [];
    for (let i = 0; i < 5; i++) {
      const v = buildFaithfulVariant(TASKS, seededRng(500 + i), used);
      expect(v.filter((t) => used.has(t.id))).toEqual([]);
      v.forEach((t) => used.add(t.id));
      sizes.push(v.length);
    }
    expect(sizes).toEqual([30, 30, 30, 30, 30]);
  });

  it("[ГРАНИЦА] при исчерпании пула вариант молча теряет структуру, а не падает", () => {
    // Фиксируем реальное поведение: начиная примерно с 19-го варианта подряд
    // позиция 27 (самый узкий пул) добирается «чем попало» — задание встаёт не
    // на своё место, но вариант всё равно возвращается как валидный.
    // Тест держит границу: если VARIANT_COUNT когда-нибудь поднимут, это
    // всплывёт здесь, а не у ученика.
    const pools = buildPositionPools(TASKS);
    const sets = Object.fromEntries(POSITIONS.map((p) => [p, new Set(pools[p].map((t) => t.id))]));
    const used = new Set();
    let firstBadVariant = null;
    for (let i = 0; i < 26; i++) {
      const v = buildFaithfulVariant(TASKS, seededRng(1000 + i), used);
      v.forEach((t) => used.add(t.id));
      const off = v.filter((t) => !sets[t.pos].has(t.id));
      if (off.length && firstBadVariant === null) firstBadVariant = i + 1;
    }
    expect(firstBadVariant).not.toBeNull();
    expect(firstBadVariant).toBeGreaterThan(5); // 5 вариантов недели — в безопасной зоне
  });
});
