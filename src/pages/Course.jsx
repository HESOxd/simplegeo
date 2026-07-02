import React from "react";
import { Shell } from "./Trainer.jsx";

// ─────────────────────────────────────────────────────────
// ЗАМЕНИ ЗДЕСЬ СВОЙ ТЕКСТ И ССЫЛКИ. Ищи пометки TODO.
// ─────────────────────────────────────────────────────────
const COURSE_NAME = "Разбор ОГЭ по географии";
const COURSE_DESCRIPTION = "Для учеников 9 класса любого уровня. Всё, что нужно для уверенной сдачи экзамена.";
const INCLUDES = [
  "Разбор всех заданий в формате mind map",
  "Примеры решения типовых задач",
  "Основные лайфхаки по каждому типу заданий",
];
const PRICE = "699 ₽";
const TELEGRAM_SIGNUP = "https://t.me/prostayageo";

export default function Course() {
  return (
    <Shell>
      <div className="mb-8">
        <p className="text-emerald-700 font-semibold tracking-wide text-sm uppercase">SimpleGeo</p>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">{COURSE_NAME}</h1>
        <p className="text-slate-500 mt-2">{COURSE_DESCRIPTION}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <p className="font-semibold text-slate-900 mb-3">Что входит</p>
        <ul className="space-y-2.5">
          {INCLUDES.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-slate-700">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-500 mb-1">Стоимость</p>
        <p className="text-3xl font-bold text-slate-900 mb-5">{PRICE}</p>
        <a href={TELEGRAM_SIGNUP} target="_blank" rel="noopener noreferrer"
          className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-colors">
          Записаться в Telegram
        </a>
      </div>
    </Shell>
  );
}
