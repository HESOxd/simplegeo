import React from "react";

// ─────────────────────────────────────────────────────────
// ЗАМЕНИ ЗДЕСЬ СВОЙ ТЕКСТ И ССЫЛКИ. Ищи пометки TODO.
// ─────────────────────────────────────────────────────────
const COURSE_TITLE = "Полный гайд по решению заданий ОГЭ";
const COURSE_DESCRIPTION = "Xmind файл с разбором заданий, примерами решений и лайфхаками";
const PRICE = "699 ₽";
const OLD_PRICE = "999 ₽";
const TELEGRAM_SIGNUP = "https://t.me/prostayageo";
const PREVIEW_IMAGE = "/course-preview.jpg";

export default function Course() {
  return (
    <div className="relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto p-4 py-10">
        <h1
          className="font-extrabold text-2xl sm:text-3xl text-slate-900"
          style={{ fontFamily: "'Unbounded', sans-serif" }}
        >
          КУРСЫ
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <a
            href={TELEGRAM_SIGNUP}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-lime-300 transition-colors"
          >
            <img
              src={PREVIEW_IMAGE}
              alt="обложка курса — Полный гайд по решению заданий ОГЭ"
              className="w-full aspect-[2324/1080] object-contain bg-slate-50"
            />
            <div className="p-5">
              <p className="font-bold text-slate-900">{COURSE_TITLE}</p>
              <p className="text-sm text-slate-500 mt-1">{COURSE_DESCRIPTION}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-lime-600">{PRICE}</span>
                  <span className="text-sm text-slate-400 line-through">{OLD_PRICE}</span>
                </p>
                <span className="text-sm text-lime-700 font-medium">Подробнее →</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
