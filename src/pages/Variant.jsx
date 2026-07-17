import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TASKS } from "../data.js";
import { buildFaithfulVariant } from "../variantBuilder.js";
import VariantRunner from "../VariantRunner.jsx";
import { Shell } from "./Trainer.jsx";

// Собирает вариант, максимально совпадающий по структуре с реальным ОГЭ
// (позиции 9-12 — блок с картой, 23-25 — блок про население, 16-17 — пара
// координаты/климат, 12/29/30 — развёрнутый ответ). См. src/variantBuilder.js.

export default function Variant() {
  const [deck, setDeck] = useState(null); // null = ещё не начали

  function start() {
    setDeck(buildFaithfulVariant(TASKS));
  }

  if (!deck) {
    return (
      <Shell>
        <Link to="/tasks" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">← К тренажёру по разделам</Link>
        <div className="mb-8">
          <p className="text-green-700 font-semibold tracking-wide text-sm uppercase">ОГЭ · География</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Полный вариант</h1>
          <p className="text-slate-500 mt-2">
            30 заданий, как в настоящем варианте ОГЭ. Без таймера — в конце подробный разбор
            каждого ответа: что верно, что нет, и как правильно.
          </p>
        </div>
        <button onClick={start} className="w-full bg-gradient-to-r from-green-200 to-green-400 hover:from-green-300 hover:to-green-500 text-slate-900 font-semibold py-3.5 rounded-xl transition-colors">
          Начать вариант
        </button>
      </Shell>
    );
  }

  return <VariantRunner deck={deck} backTo="/tasks" onRestart={start} />;
}
