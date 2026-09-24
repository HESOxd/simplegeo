// Мини-диагностика v2 — сборка набора, светофор блоков, кодирование r.
// Спека: docs/diagnostic-spec.md.

import { describe, it, expect } from "vitest";
import { TASKS } from "../src/data.js";
import { seededRng } from "../src/utils.js";
import {
  DIAGNOSTIC_BLOCKS,
  DIAGNOSTIC_TOTAL,
  DIAGNOSTIC_V1_COUNTS,
  buildDiagnosticSet,
  blockTrafficLight,
  encodeResult,
  decodeResult,
} from "../src/diagnosticBuilder.js";

const RUNS = Array.from({ length: 40 }, (_, i) => buildDiagnosticSet(TASKS, seededRng(i + 1)));

describe("сборка диагностики", () => {
  it(`отдаёт ровно ${DIAGNOSTIC_TOTAL} заданий (=13)`, () => {
    expect(DIAGNOSTIC_TOTAL).toBe(13);
    const broken = RUNS.map((d, i) => (d.length === 13 ? null : `прогон ${i}: ${d.length}`)).filter(Boolean);
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

  it("нет позиции №9, нет эссе, порядок по возрастанию позиции", () => {
    const broken = RUNS.map((deck, i) => {
      if (deck.some((t) => t.pos === 9)) return `прогон ${i}: позиция 9`;
      if (deck.some((t) => t.type === "essay")) return `прогон ${i}: эссе`;
      const pos = deck.map((t) => t.pos);
      const sorted = [...pos].sort((a, b) => a - b);
      if (pos.join(",") !== sorted.join(",")) return `прогон ${i}: порядок ${pos}`;
      return null;
    }).filter(Boolean);
    expect(broken).toEqual([]);
  });

  it("topo: ровно 10 и 11, из одного groupId", () => {
    const broken = RUNS.map((deck, i) => {
      const topo = deck.filter((t) => t.blockKey === "topo");
      if (topo.length !== 2) return `прогон ${i}: topo count ${topo.length}`;
      const positions = topo.map((t) => t.pos).sort((a, b) => a - b);
      if (positions.join(",") !== "10,11") return `прогон ${i}: topo pos ${positions}`;
      const gids = topo.map((t) => t.groupId);
      if (!gids[0] || gids[0] !== gids[1]) return `прогон ${i}: topo groupId ${gids}`;
      return null;
    }).filter(Boolean);
    expect(broken).toEqual([]);
  });

  it("нет повторов id; groupId уникальны кроме пары topo", () => {
    const broken = RUNS.map((deck, i) => {
      const ids = deck.map((t) => t.id);
      if (new Set(ids).size !== ids.length) return `прогон ${i}: повтор id`;

      const topoGids = deck.filter((t) => t.blockKey === "topo").map((t) => t.groupId);
      if (topoGids.length !== 2 || !topoGids[0] || topoGids[0] !== topoGids[1]) {
        return `прогон ${i}: topo должен делить groupId`;
      }
      const shared = topoGids[0];
      const otherGids = deck
        .filter((t) => t.blockKey !== "topo" && t.groupId)
        .map((t) => t.groupId);
      if (otherGids.includes(shared)) return `прогон ${i}: чужой блок с topo groupId`;
      if (new Set(otherGids).size !== otherGids.length) {
        return `прогон ${i}: повтор groupId вне topo ${otherGids}`;
      }
      return null;
    }).filter(Boolean);
    expect(broken).toEqual([]);
  });
});

describe("светофор блока", () => {
  it("для total=2: 2/2 green, 1/2 yellow, 0/2 red", () => {
    expect(blockTrafficLight(2, 2)).toBe("green");
    expect(blockTrafficLight(1, 2)).toBe("yellow");
    expect(blockTrafficLight(0, 2)).toBe("red");
  });

  it("для total=1 (regions): 1/1 green, 0/1 red", () => {
    expect(blockTrafficLight(1, 1)).toBe("green");
    expect(blockTrafficLight(0, 1)).toBe("red");
  });

  it("для total=3 (совместимость): 3/3 green, 2/3 yellow, 1/3 и 0/3 red", () => {
    expect(blockTrafficLight(3, 3)).toBe("green");
    expect(blockTrafficLight(2, 3)).toBe("yellow");
    expect(blockTrafficLight(1, 3)).toBe("red");
    expect(blockTrafficLight(0, 3)).toBe("red");
  });
});

describe("кодирование результата r", () => {
  const sampleV2 = {
    date: "2026-09-24",
    blocks: {
      topo: [1, 2],
      maps: [2, 2],
      climate: [1, 2],
      nature: [2, 2],
      people: [1, 2],
      world: [0, 2],
      regions: [1, 1],
    },
  };

  it("v2: кодирование/декодирование обратимо", () => {
    const code = encodeResult(sampleV2);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    const decoded = decodeResult(code);
    expect(decoded.date).toEqual(sampleV2.date);
    expect(decoded.blocks).toEqual(sampleV2.blocks);
    expect(decoded.version).toBe(2);
  });

  it("v1: старые ссылки читаются (totals v1)", () => {
    const raw = [
      "v1",
      "2026-09-22",
      "topo:1/3",
      "maps:2/2",
      "climate:1/3",
      "nature:3/3",
      "people:2/3",
      "world:0/3",
      "regions:1/2",
    ].join("|");
    const code = Buffer.from(raw, "utf8").toString("base64url");
    const decoded = decodeResult(code);
    expect(decoded).not.toBeNull();
    expect(decoded.version).toBe(1);
    expect(decoded.blocks.topo).toEqual([1, 3]);
    expect(decoded.blocks.regions).toEqual([1, 2]);
    expect(Object.keys(DIAGNOSTIC_V1_COUNTS)).toHaveLength(7);
  });

  it("битая строка → null", () => {
    expect(decodeResult("")).toBeNull();
    expect(decodeResult("%%%")).toBeNull();
    expect(decodeResult("not-valid")).toBeNull();
    expect(decodeResult(Buffer.from("hello", "utf8").toString("base64url"))).toBeNull();
    const truncated = Buffer.from("v2|2026-09-24|topo:1/2", "utf8").toString("base64url");
    expect(decodeResult(truncated)).toBeNull();
  });

  it("v2 с totals v1 → null", () => {
    const raw = [
      "v2",
      "2026-09-24",
      "topo:1/3",
      "maps:2/2",
      "climate:1/2",
      "nature:2/2",
      "people:1/2",
      "world:0/2",
      "regions:1/1",
    ].join("|");
    const code = Buffer.from(raw, "utf8").toString("base64url");
    expect(decodeResult(code)).toBeNull();
  });
});
