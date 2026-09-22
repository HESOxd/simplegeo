// Мини-диагностика — сборка набора, светофор блоков, кодирование r.
// Спека: docs/diagnostic-spec.md, раздел «Тесты».

import { describe, it, expect } from "vitest";
import { TASKS } from "../src/data.js";
import { seededRng } from "../src/utils.js";
import {
  DIAGNOSTIC_BLOCKS,
  DIAGNOSTIC_TOTAL,
  buildDiagnosticSet,
  blockTrafficLight,
  encodeResult,
  decodeResult,
} from "../src/diagnosticBuilder.js";

const RUNS = Array.from({ length: 40 }, (_, i) => buildDiagnosticSet(TASKS, seededRng(i + 1)));

describe("сборка диагностики", () => {
  it(`отдаёт ровно ${DIAGNOSTIC_TOTAL} заданий`, () => {
    expect(DIAGNOSTIC_TOTAL).toBe(19);
    const broken = RUNS.map((d, i) => (d.length === 19 ? null : `прогон ${i}: ${d.length}`)).filter(Boolean);
    expect(broken).toEqual([]);
  });

  it("внутри каждого блока позиции различны и входят в список блока", () => {
    const broken = [];
    for (let i = 0; i < RUNS.length; i++) {
      const deck = RUNS[i];
      for (const block of DIAGNOSTIC_BLOCKS) {
        const items = deck.filter((t) => t.blockKey === block.key);
        if (items.length !== block.count) {
          broken.push(`прогон ${i}: ${block.key} дал ${items.length}`);
          continue;
        }
        const positions = items.map((t) => t.pos);
        if (new Set(positions).size !== positions.length) {
          broken.push(`прогон ${i}: ${block.key} повтор позиций ${positions}`);
        }
        if (positions.some((p) => !block.positions.includes(p))) {
          broken.push(`прогон ${i}: ${block.key} чужая позиция ${positions}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("нет эссе и порядок по возрастанию позиции", () => {
    const broken = RUNS.map((deck, i) => {
      if (deck.some((t) => t.type === "essay")) return `прогон ${i}: эссе`;
      const pos = deck.map((t) => t.pos);
      const sorted = [...pos].sort((a, b) => a - b);
      if (pos.join(",") !== sorted.join(",")) return `прогон ${i}: порядок ${pos}`;
      return null;
    }).filter(Boolean);
    expect(broken).toEqual([]);
  });

  it("нет повторов id и groupId", () => {
    const broken = RUNS.map((deck, i) => {
      const ids = deck.map((t) => t.id);
      if (new Set(ids).size !== ids.length) return `прогон ${i}: повтор id`;
      const gids = deck.map((t) => t.groupId).filter(Boolean);
      if (new Set(gids).size !== gids.length) return `прогон ${i}: повтор groupId`;
      return null;
    }).filter(Boolean);
    expect(broken).toEqual([]);
  });
});

describe("светофор блока", () => {
  it("3/3 → green, 2/3 → yellow, 1/3 и 0/3 → red", () => {
    expect(blockTrafficLight(3, 3)).toBe("green");
    expect(blockTrafficLight(2, 3)).toBe("yellow");
    expect(blockTrafficLight(1, 3)).toBe("red");
    expect(blockTrafficLight(0, 3)).toBe("red");
  });

  it("для блоков из 2: 2/2 green, 1/2 yellow, 0/2 red", () => {
    expect(blockTrafficLight(2, 2)).toBe("green");
    expect(blockTrafficLight(1, 2)).toBe("yellow");
    expect(blockTrafficLight(0, 2)).toBe("red");
  });
});

describe("кодирование результата r", () => {
  const sample = {
    date: "2026-09-22",
    blocks: {
      topo: [1, 3],
      maps: [2, 2],
      climate: [1, 3],
      nature: [3, 3],
      people: [2, 3],
      world: [0, 3],
      regions: [1, 2],
    },
  };

  it("кодирование/декодирование обратимо", () => {
    const code = encodeResult(sample);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeResult(code)).toEqual(sample);
  });

  it("битая строка → null", () => {
    expect(decodeResult("")).toBeNull();
    expect(decodeResult("%%%")).toBeNull();
    expect(decodeResult("not-valid")).toBeNull();
    // валидный base64url, но не наш формат
    expect(decodeResult(Buffer.from("hello", "utf8").toString("base64url"))).toBeNull();
    // обрезанный payload
    const truncated = Buffer.from("v1|2026-09-22|topo:1/3", "utf8").toString("base64url");
    expect(decodeResult(truncated)).toBeNull();
  });
});
