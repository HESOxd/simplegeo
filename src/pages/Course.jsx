import React from "react";

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
    <div className="max-w-6xl mx-auto p-4 py-10">
      <p className="text-emerald-700 font-semibold tracking-wide text-sm uppercase">SimpleGeo</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mt-4">
        <div className="lg:col-span-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">{COURSE_NAME}</h1>
          <p className="text-lg text-slate-500 mt-3 max-w-xl">{COURSE_DESCRIPTION}</p>

          <p className="font-semibold text-slate-900 mt-10 mb-4">Что входит</p>
          <ul className="space-y-4">
            {INCLUDES.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700 text-lg">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center lg:sticky lg:top-10">
            <p className="text-sm text-slate-500 mb-1">Стоимость</p>
            <p className="text-4xl font-bold text-slate-900 mb-6">{PRICE}</p>
            <a href={TELEGRAM_SIGNUP} target="_blank" rel="noopener noreferrer"
              className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-colors">
              Записаться в Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
