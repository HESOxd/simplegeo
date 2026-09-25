import React, { useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Trainer from "./pages/Trainer.jsx";
import Variant from "./pages/Variant.jsx";
import ByPosition from "./pages/ByPosition.jsx";
import WeeklyVariants from "./pages/WeeklyVariants.jsx";
import Demo2027 from "./pages/Demo2027.jsx";
import Diagnostic, { DiagnosticResultPage } from "./pages/Diagnostic.jsx";
import About from "./pages/About.jsx";
import Course from "./pages/Course.jsx";
import NotFound from "./pages/NotFound.jsx";
import { PageBackgroundProvider } from "./brand/PageBackground.jsx";
import { pageTitle } from "./pageTitles.js";

const NAV = [
  { to: "/tasks", label: "Задания и варианты" },
  { to: "/about", label: "О себе" },
  { to: "/course", label: "Курс" },
];

// Шапка — чернила (#1C211D), выбрано 24.09.2026 из четырёх вариантов (бумага,
// белая, чернильная, зелёная). Логотип — официальная версия «на тёмном» (белый
// «simple», зелёный #5CC48A «geo»), обрезанная без охранного поля, как -tight.
// Меню: активный пункт белый, остальные line-strong (10,2:1); полоска под
// активным — brand-400 (7,6:1): обычный brand на чернилах даёт 2,98:1.
function TopNav() {
  const { pathname } = useLocation();
  return (
    <div className="relative z-10 bg-ink">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 px-4">
        <Link to="/tasks" className="flex-shrink-0 pt-3 sm:py-2.5">
          <img src="/brand/logo/simplegeo-wordmark-on-dark-tight.svg" alt="SimpleGeo" className="block h-5 sm:h-6 w-auto" />
        </Link>
        <div className="flex sm:flex-1 sm:justify-center sm:gap-2">
          {NAV.map((item) => {
            const active = pathname === item.to || (item.to === "/tasks" && pathname.startsWith("/tasks"));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex-1 sm:flex-none px-1 sm:px-4 text-center text-sm font-medium py-3.5 transition-colors whitespace-nowrap ${
                  active ? "text-white" : "text-line-strong hover:text-white"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-px h-[3px] rounded-full bg-brand-400" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Название вкладки меняется вместе со страницей (сайт одностраничный, сам
// браузер его не поменяет). Список — в pageTitles.js.
function usePageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = pageTitle(pathname);
  }, [pathname]);
}

export default function App() {
  usePageTitle();
  return (
    <PageBackgroundProvider>
    <div className="min-h-screen bg-paper">
      <TopNav />
      <div className="relative">
      <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<Trainer />} />
        <Route path="/tasks/variant" element={<Variant />} />
        <Route path="/tasks/by-number" element={<ByPosition />} />
        <Route path="/tasks/weekly" element={<WeeklyVariants />} />
        <Route path="/tasks/demo-2027" element={<Demo2027 />} />
        <Route path="/tasks/diagnostic" element={<Diagnostic />} />
        <Route path="/tasks/diagnostic/result" element={<DiagnosticResultPage />} />
        <Route path="/diagnostic" element={<Navigate to="/tasks/diagnostic" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/course" element={<Course />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
    </div>
    </PageBackgroundProvider>
  );
}
