import React from "react";

// ─────────────────────────────────────────────────────────
// ЗАМЕНИ ЗДЕСЬ СВОЙ ТЕКСТ И ССЫЛКИ. Ищи пометки TODO.
// ─────────────────────────────────────────────────────────
const PHOTO_URL = "/photo.jpg";
const BIO = "Меня зовут Юрий, я учусь в МГУ на географическом факультете (кафедра географии мирового хозяйства), поступил на бюджет в 2023 году. Преподаю уже третий год и убеждён: география — это предмет, который помогает видеть взаимосвязи буквально во всём. Хочу, чтобы как можно больше людей открывали его для себя.";
const EXPERIENCE = [
  { number: "3", label: "года преподаю" },
  { number: "100+", label: "учеников подготовлено" },
  { number: "4,7", label: "средний балл на ОГЭ" },
];
const TELEGRAM_CHANNEL = "https://t.me/prostayageo";
const TELEGRAM_CONTACT = "https://t.me/prostayageo";

export default function About() {
  return (
    <div className="max-w-6xl mx-auto p-4 py-10">
      <p className="text-emerald-700 font-semibold tracking-wide text-sm uppercase">SimpleGeo</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mt-4">
        <div className="lg:col-span-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">Юрий</h1>
          <p className="text-lg text-slate-500 mt-2">Репетитор по географии, ОГЭ/ЕГЭ</p>
          <p className="text-slate-700 leading-relaxed mt-6 text-lg max-w-2xl">{BIO}</p>

          <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg">
            {EXPERIENCE.map((e, i) => (
              <div key={i}>
                <p className="text-3xl sm:text-4xl font-bold text-emerald-700">{e.number}</p>
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
            <div className="w-full aspect-[4/5] rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-6xl font-bold">
              Ю
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
