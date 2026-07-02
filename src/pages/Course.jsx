import React from "react";

// ─────────────────────────────────────────────────────────
// ЗАМЕНИ ЗДЕСЬ СВОЙ ТЕКСТ И ССЫЛКИ. Ищи пометки TODO.
// ─────────────────────────────────────────────────────────
const COURSE_NAME = "ПОЛНЫЙ ГАЙД ПО РЕШЕНИЮ ЗАДАНИЙ ОГЭ";
const COURSE_TAGLINE = "Всё, что нужно для уверенной подготовки к экзамену по географии";
const FEATURES = [
  {
    title: "Xmind файл,",
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
    <div className="w-[52px] h-[52px] flex-shrink-0 rounded-[14px] bg-[oklch(0.92_0.06_150)] flex items-center justify-center">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(0.4 0.1 155)" strokeWidth="1.8" strokeLinecap="round" className="w-6 h-6">
        {children}
      </svg>
    </div>
  );
}

export default function Course() {
  return (
    <div className="max-w-6xl mx-auto p-4 py-10">
      <div className="relative overflow-hidden rounded-[32px] bg-[oklch(0.985_0.005_95)] border border-slate-200 shadow-xl">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 1000" preserveAspectRatio="none">
          <path d="M800 0 C 700 40, 620 160, 700 300 C 800 460, 620 520, 660 660 C 700 800, 560 860, 620 1000 L 800 1000 Z" fill="oklch(0.86 0.13 150)" />
          <path d="M0 1000 C 60 900, 40 780, -20 700 L -20 1000 Z" fill="oklch(0.5 0.13 155)" />
        </svg>

        <div className="relative px-6 sm:px-14 pt-12 sm:pt-16">
          <div className="inline-flex items-center gap-2 mb-7">
            <div className="w-[26px] h-[26px] rounded-[8px] bg-[oklch(0.5_0.13_155)]" />
            <span className="font-extrabold text-lg tracking-[0.06em] text-[oklch(0.5_0.13_155)]">SIMPLEGEO</span>
          </div>

          <h1
            className="font-extrabold text-4xl sm:text-5xl leading-[1.12] text-[oklch(0.22_0.03_250)] mb-7 max-w-md"
            style={{ fontFamily: "'Unbounded', sans-serif" }}
          >
            {COURSE_NAME}
          </h1>

          <div className="inline-block bg-[oklch(0.5_0.13_155)] text-white font-extrabold text-lg sm:text-xl leading-snug rounded-2xl px-6 py-4 max-w-xl text-center">
            {COURSE_TAGLINE}
          </div>
        </div>

        <div className="relative px-6 sm:px-14 pt-9 flex flex-col">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 py-4 ${i < FEATURES.length - 1 ? "border-b border-[oklch(0.9_0.01_90)]" : ""}`}
            >
              <FeatureIcon>{f.icon}</FeatureIcon>
              <div>
                <p className="font-bold text-lg text-[oklch(0.22_0.03_250)]">{f.title}</p>
                <p className="font-medium text-base text-[oklch(0.45_0.02_90)]">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative px-6 sm:px-14 sm:pl-[176px] pt-2 pb-10">
          <div className="w-full max-w-[393px] bg-white p-[9px] rounded-[14px] shadow-[0_16px_32px_-10px_rgba(0,0,0,0.28)] -rotate-[4deg]">
            <img src={PREVIEW_IMAGE} alt="превью содержимого Xmind файла" className="w-full h-[189px] object-cover object-top rounded-[9px] block" />
          </div>
        </div>

        <div className="relative px-6 sm:px-14 pb-12 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div>
            <p className="text-sm text-slate-500">Стоимость</p>
            <p className="text-3xl font-bold text-[oklch(0.22_0.03_250)]">{PRICE}</p>
          </div>
          <a href={TELEGRAM_SIGNUP} target="_blank" rel="noopener noreferrer"
            className="text-center bg-[oklch(0.5_0.13_155)] hover:opacity-90 text-white font-semibold px-6 py-3.5 rounded-xl transition-opacity">
            Записаться в Telegram
          </a>
        </div>
      </div>
    </div>
  );
}
