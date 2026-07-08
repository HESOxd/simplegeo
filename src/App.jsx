import React from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Trainer from "./pages/Trainer.jsx";
import Variant from "./pages/Variant.jsx";
import About from "./pages/About.jsx";
import Course from "./pages/Course.jsx";

const NAV = [
  { to: "/tasks", label: "Задания и варианты" },
  { to: "/about", label: "О себе" },
  { to: "/course", label: "Курс" },
];

function TopNav() {
  const { pathname } = useLocation();
  return (
    <div className="relative z-10 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 px-4">
        <Link to="/tasks" className="flex-shrink-0 pt-3 sm:py-2.5">
          <img src="/logo.png" alt="SimpleGeo" className="h-5 sm:h-6 w-auto" />
        </Link>
        <div className="flex sm:flex-1 sm:justify-center sm:gap-2">
          {NAV.map((item) => {
            const active = pathname === item.to || (item.to === "/tasks" && pathname.startsWith("/tasks"));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 sm:flex-none px-1 sm:px-4 text-center text-sm font-medium py-3.5 border-b-2 transition-colors whitespace-nowrap ${
                  active ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 110% 90% at 20% -10%, #d4f83a 0%, #e2f97a 22%, #eefab8 42%, #f7fce0 62%, #ffffff 85%)",
      }}
    >
      <TopNav />
      <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<Trainer />} />
        <Route path="/tasks/variant" element={<Variant />} />
        <Route path="/about" element={<About />} />
        <Route path="/course" element={<Course />} />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </div>
  );
}
