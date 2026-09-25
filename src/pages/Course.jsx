import React from "react";
import { GRADIENT_TEXT } from "./Trainer.jsx";

// ─────────────────────────────────────────────────────────
// ЗАМЕНИ ЗДЕСЬ СВОЙ ТЕКСТ И ССЫЛКИ. Ищи пометки TODO.
// ─────────────────────────────────────────────────────────
const COURSE_TITLE = "Полный гайд по решению заданий ОГЭ";
const COURSE_DESCRIPTION = "Xmind файл с разбором заданий, примерами решений и лайфхаками";
const PRICE = "1499 ₽";
const OLD_PRICE = "3000 ₽";
const TELEGRAM_SIGNUP = "https://t.me/prostayageo";
const PREVIEW_IMAGE = "/course-preview.jpg";

function StrikePrice({ children }) {
  return (
    <span className="relative inline-block text-ink-muted">
      {children}
      <svg
        className="absolute left-0 top-1/2 w-full h-3 -translate-y-1/2 pointer-events-none"
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M2 7.5 C 22 3, 42 9.5, 62 5 S 88 8.5, 98 4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

export default function Course() {
  return (
    <div className="relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto p-4 py-10">
        <p className="font-data text-label text-brand uppercase">ОГЭ · География</p>
        <h1 className="text-3xl font-bold text-ink mt-1">
          Курсы
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <a
            href={TELEGRAM_SIGNUP}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-surface rounded-lg border border-line overflow-hidden hover:border-line-strong transition-colors"
          >
            <img
              src={PREVIEW_IMAGE}
              alt="обложка курса — Полный гайд по решению заданий ОГЭ"
              className="w-full aspect-[2324/1080] object-contain bg-sunk"
            />
            <div className="p-5">
              <p className="font-bold text-ink">{COURSE_TITLE}</p>
              <p className="text-sm text-ink-muted mt-1">{COURSE_DESCRIPTION}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="flex items-baseline gap-2">
                  <span className="font-data font-semibold text-lg tabular-nums text-brand">{PRICE}</span>
                  <span className="font-data text-sm tabular-nums"><StrikePrice>{OLD_PRICE}</StrikePrice></span>
                </p>
                <span className="text-sm font-medium" style={GRADIENT_TEXT}>Подробнее →</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
