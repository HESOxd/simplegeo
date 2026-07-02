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
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-lg mx-auto flex px-4">
        {NAV.map((item) => {
          const active = pathname === item.to || (item.to === "/tasks" && pathname.startsWith("/tasks"));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 text-center text-sm font-medium py-3.5 border-b-2 transition-colors ${
                active ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
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
