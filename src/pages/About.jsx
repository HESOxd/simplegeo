import React from "react";
import { Shell } from "./Trainer.jsx";

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
    <Shell>
      <div className="mb-8">
        <p className="text-emerald-700 font-semibold tracking-wide text-sm uppercase">SimpleGeo</p>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">О себе</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          {PHOTO_URL ? (
            <img src={PHOTO_URL} alt="Фото преподавателя" className="w-20 h-20 rounded-full object-cover border-2 border-emerald-100" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-bold">
              Ю
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900">Юрий</p>
            <p className="text-sm text-slate-500">Репетитор по географии, ОГЭ/ЕГЭ</p>
          </div>
        </div>
        <p className="text-slate-700 leading-relaxed">{BIO}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {EXPERIENCE.map((e, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{e.number}</p>
            <p className="text-xs text-slate-500 mt-1">{e.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="font-semibold text-slate-900 mb-3">Связаться</p>
        <div className="flex flex-col gap-2">
          <a href={TELEGRAM_CONTACT} target="_blank" rel="noopener noreferrer"
            className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-colors">
            Написать в Telegram
          </a>
          <a href={TELEGRAM_CHANNEL} target="_blank" rel="noopener noreferrer"
            className="w-full text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium py-3 rounded-xl transition-colors">
            Подписаться на канал
          </a>
        </div>
      </div>
    </Shell>
  );
}
