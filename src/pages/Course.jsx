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
    icon: <rect x="5" y="5" width="14" height="14" rx="3" fill="#1f8a5e" />,
  },
  {
    title: "Подробное решение",
    desc: "с объяснением для каждого задания",
    icon: <circle cx="12" cy="12" r="7" fill="#1f8a5e" />,
  },
  {
    title: "Лайфхаки и советы",
    desc: "для успешной сдачи экзамена",
    icon: <path d="M12 4 L20 20 L4 20 Z" fill="#4f6bed" />,
  },
];
const PRICE = "699 ₽";
const TELEGRAM_SIGNUP = "https://t.me/prostayageo";
const PREVIEW_IMAGE = "/course-preview.jpg";

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
                className={`flex items-center gap-3 py-3.5 ${i < FEATURES.length - 1 ? "border-b border-slate-200" : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">{f.icon}</svg>
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

        <div className="w-full lg:w-[340px] flex-shrink-0">
          <img
            src={PREVIEW_IMAGE}
            alt="превью содержимого Xmind файла"
            className="w-full aspect-[4/3] object-cover object-top rounded-2xl border border-slate-200"
          />
        </div>
      </div>
    </div>
  );
}
