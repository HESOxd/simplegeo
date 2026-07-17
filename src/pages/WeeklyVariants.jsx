import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TASKS } from "../data.js";
import VariantRunner from "../VariantRunner.jsx";
import { Shell } from "./Trainer.jsx";

function progressKey(weekId, i) {
  return `weekly-variant-${weekId}-${i}`;
}

function readVariantStatus(weekId, i) {
  try {
    const raw = localStorage.getItem(progressKey(weekId, i));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.screen === "review") {
      const right = (data.answers || []).filter((a) => a.right).length;
      return { done: true, score: right, total: (data.answers || []).length };
    }
    return { done: false, pos: data.pos || 0 };
  } catch {
    return null;
  }
}

export default function WeeklyVariants() {
  const [data, setData] = useState(null); // {weekId, variants: [[id,...] x5]}
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    fetch("/weekly-variants.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <Shell>
        <Link to="/tasks" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">← К тренажёру по разделам</Link>
        <p className="text-slate-500">Варианты недели ещё не сгенерированы. Загляни чуть позже.</p>
      </Shell>
    );
  }
  if (!data) {
    return (
      <Shell>
        <p className="text-slate-400">Загрузка…</p>
      </Shell>
    );
  }

  if (activeIndex !== null) {
    const ids = data.variants[activeIndex];
    const deck = ids.map((id) => TASKS.find((t) => t.id === id)).filter(Boolean);
    return (
      <VariantRunner
        deck={deck}
        backTo="/tasks/weekly"
        persistKey={progressKey(data.weekId, activeIndex)}
      />
    );
  }

  return (
    <Shell>
      <Link to="/tasks" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">← К тренажёру по разделам</Link>
      <div className="mb-8">
        <p className="text-green-700 font-semibold tracking-wide text-sm uppercase">ОГЭ · География</p>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">Варианты недели</h1>
        <p className="text-slate-500 mt-2">
          5 фиксированных вариантов на эту неделю ({data.weekId}) — одинаковые у всех,
          обновляются раз в неделю. Можно начать и продолжить позже с того же места.
        </p>
      </div>

      <div className="space-y-3">
        {data.variants.map((_, i) => {
          const status = readVariantStatus(data.weekId, i);
          return (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="w-full flex items-center justify-between bg-white rounded-2xl border border-slate-200 hover:border-green-400 hover:bg-green-50/40 transition-colors p-5 text-left"
            >
              <div>
                <p className="font-semibold text-slate-900">Вариант {i + 1}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {status?.done
                    ? `Пройден: ${status.score}/${status.total} верных`
                    : status
                    ? `Продолжить с задания ${status.pos + 1} из 30`
                    : "30 заданий, ещё не начат"}
                </p>
              </div>
              <span className="text-green-700 font-semibold text-sm shrink-0">
                {status?.done ? "Пройти снова →" : status ? "Продолжить →" : "Начать →"}
              </span>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}
