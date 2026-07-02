import React from "react";

// ─────────────────────────────────────────────────────────
// ЗАМЕНИ ЗДЕСЬ СВОЙ ТЕКСТ И ССЫЛКИ. Ищи пометки TODO.
// ─────────────────────────────────────────────────────────
const COURSE_NAME = "ПОЛНЫЙ ГАЙД ПО РЕШЕНИЮ ЗАДАНИЙ ОГЭ";
const COURSE_DESCRIPTION = "Всё, что нужно для уверенной подготовки к экзамену по географии — в одном файле.";
const FEATURES = [
  {
    title: "Xmind файл",
    desc: "с удобным интерфейсом",
    icon: (
      <>
        <circle cx="6" cy="12" r="2.4" />
        <circle cx="18" cy="6" r="2.4" />
        <circle cx="18" cy="18" r="2.4" />
        <path d="M8.2 11 L15.8 7 M8.2 13 L15.8 17" />
      </>
    ),
  },
  {
    title: "Подробное решение",
    desc: "с объяснением для каждого задания",
    icon: (
      <>
        <path d="M6 3h9l4 4v14H6z" strokeLinejoin="round" />
        <path d="M9 12h7M9 16h7M9 8h3" />
      </>
    ),
  },
  {
    title: "Лайфхаки и советы",
    desc: "для успешной сдачи экзамена",
    icon: (
      <>
        <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9V17h5v-1.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3Z" />
        <path d="M9.5 20h5M10.2 22h3.6" />
      </>
    ),
  },
];
const PRICE = "699 ₽";
const TELEGRAM_SIGNUP = "https://t.me/prostayageo";
const PREVIEW_IMAGE = "/course-preview.jpg";

function FeatureIcon({ children }) {
  return (
    <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1f8a5e" strokeWidth="1.8" strokeLinecap="round" className="w-[22px] h-[22px]">
        {children}
      </svg>
    </div>
  );
}

export default function Course() {
  return (
    <div className="max-w-6xl mx-auto p-4 py-10">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 flex flex-col lg:flex-row gap-10 justify-between">
        <div className="flex-1 max-w-xl">
          <span className="inline-flex items-center gap-2 bg-[#1f8a5e] text-white text-xs font-bold tracking-wide uppercase px-3.5 py-1.5 rounded-lg">
            Тесты
          </span>

          <h1
            className="font-extrabold text-3xl sm:text-4xl leading-[1.15] text-slate-900 mt-4"
            style={{ fontFamily: "'Unbounded', sans-serif" }}
          >
            {COURSE_NAME}
          </h1>

          <p className="text-slate-500 mt-4 text-lg">{COURSE_DESCRIPTION}</p>

          <div className="mt-8 flex flex-col">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`flex items-center gap-3.5 py-3.5 ${i < FEATURES.length - 1 ? "border-b border-slate-200" : ""}`}
              >
                <FeatureIcon>{f.icon}</FeatureIcon>
                <div>
                  <span className="font-bold text-slate-900">{f.title}</span>
                  <span className="text-slate-500"> — {f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
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

        <div className="w-full lg:w-[420px] flex-shrink-0">
          <img
            src={PREVIEW_IMAGE}
            alt="превью содержимого Xmind файла"
            className="w-full aspect-[2324/1080] object-contain rounded-2xl border border-slate-200 bg-slate-50"
          />
        </div>
      </div>
    </div>
  );
}
