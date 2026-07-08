import React from "react";

// ─────────────────────────────────────────────────────────
// ЗАМЕНИ ЗДЕСЬ СВОЙ ТЕКСТ И ССЫЛКИ. Ищи пометки TODO.
// ─────────────────────────────────────────────────────────
const PHOTO_URL = "/photo.jpg";
const BIO = [
  "Привет! Меня зовут Юрий, и в данный момент я обучаюсь на географическом факультете МГУ имени М. В. Ломоносова.",
  "В 2023 году я выбрал это направление, успешно сдал ЕГЭ и поступил на бюджет в лучший ВУЗ страны.",
  "С тех пор продолжаю углубляться в географию и развиваться в этой сфере.",
  "Я убеждён, что география – это предмет, который помогает видеть взаимосвязи буквально во всём: между природой, людьми, экономикой и событиями в мире. Поэтому моя задача как преподавателя – помочь ученикам не просто запомнить материал, а по-настоящему понять предмет и увидеть в нём логику.",
];
const EXPERIENCE = [
  { number: "3", label: "года преподаю" },
  { number: "100+", label: "учеников подготовлено" },
  { number: "4,7", label: "средний балл на ОГЭ" },
];
const TELEGRAM_CHANNEL = "https://t.me/prostayageo";
const TELEGRAM_CONTACT = "https://t.me/prostayageo";

export default function About() {
  return (
    <div className="relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto p-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>Юрий</h1>
          <p className="text-lg text-slate-500 mt-2">Репетитор по географии, ОГЭ/ЕГЭ</p>
          <div className="mt-6 max-w-2xl space-y-4">
            {BIO.map((paragraph, i) => (
              <p key={i} className="text-slate-700 leading-relaxed text-lg">{paragraph}</p>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg">
            {EXPERIENCE.map((e, i) => (
              <div key={i}>
                <p className="text-3xl sm:text-4xl font-bold text-green-700">{e.number}</p>
                <p className="text-sm text-slate-500 mt-1">{e.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-10">
            <a href={TELEGRAM_CONTACT} target="_blank" rel="noopener noreferrer"
              className="text-center bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-3 rounded-xl transition-colors">
              Написать в Telegram
            </a>
            <a href={TELEGRAM_CHANNEL} target="_blank" rel="noopener noreferrer"
              className="text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium px-6 py-3 rounded-xl transition-colors">
              Подписаться на канал
            </a>
          </div>
        </div>

        <div className="lg:col-span-2 order-first lg:order-last">
          {PHOTO_URL ? (
            <img src={PHOTO_URL} alt="Фото преподавателя" className="w-full aspect-[4/5] object-cover rounded-2xl border border-slate-200" />
          ) : (
            <div className="w-full aspect-[4/5] rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 text-6xl font-bold">
              Ю
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
