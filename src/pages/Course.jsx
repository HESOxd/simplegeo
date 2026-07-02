import React from "react";

// ─────────────────────────────────────────────────────────
// ЗАМЕНИ ЗДЕСЬ СВОЙ ТЕКСТ И ССЫЛКИ. Ищи пометки TODO.
// ─────────────────────────────────────────────────────────
const COURSE_NAME = "Полный гайд по решению заданий ОГЭ";
const COURSE_TAGLINE = "Всё, что нужно для уверенной подготовки к экзамену по географии";
const FEATURES = [
  {
    title: "Xmind файл",
    desc: "с удобным интерфейсом",
    icon: (
      <path d="M4 12a2 2 0 100-4 2 2 0 000 4zM4 20a2 2 0 100-4 2 2 0 000 4zM20 8a2 2 0 100-4 2 2 0 000 4zM6 11l12-5.5M6 13l12 5.5" />
    ),
  },
  {
    title: "Подробное решение",
    desc: "с объяснением для каждого задания",
    icon: (
      <path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM13 3v5h5M9 13h6M9 17h6" />
    ),
  },
  {
    title: "Лайфхаки и советы",
    desc: "для успешной сдачи экзамена",
    icon: (
      <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0012 3z" />
    ),
  },
];
const PRICE = "699 ₽";
const TELEGRAM_SIGNUP = "https://t.me/prostayageo";

function FeatureIcon({ children }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        {children}
      </svg>
    </div>
  );
}

export default function Course() {
  return (
    <div className="max-w-6xl mx-auto p-4 py-10">
      <div className="relative overflow-hidden rounded-3xl bg-[#FAF6EE] border border-slate-200 p-8 sm:p-12">
        <div
          className="absolute -right-24 top-0 h-full w-[28rem] bg-emerald-300/70 pointer-events-none hidden sm:block"
          style={{ borderRadius: "45% 55% 60% 40% / 50% 40% 60% 50%" }}
        />

        <div className="relative max-w-xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-emerald-600" />
            <span className="text-xs font-bold tracking-widest text-slate-900 uppercase">SimpleGeo</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 uppercase leading-[1.1]">
            {COURSE_NAME}
          </h1>

          <div className="inline-block mt-5 bg-emerald-700 text-white text-sm font-semibold rounded-xl px-5 py-3 leading-snug">
            {COURSE_TAGLINE}
          </div>

          <div className="mt-9 space-y-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <FeatureIcon>{f.icon}</FeatureIcon>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{f.title}</p>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div>
              <p className="text-sm text-slate-500">Стоимость</p>
              <p className="text-3xl font-bold text-slate-900">{PRICE}</p>
            </div>
            <a href={TELEGRAM_SIGNUP} target="_blank" rel="noopener noreferrer"
              className="text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors">
              Записаться в Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
