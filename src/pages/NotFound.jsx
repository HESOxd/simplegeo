import React from "react";
import { Link } from "react-router-dom";
import { Shell } from "./Trainer.jsx";

export default function NotFound() {
  return (
    <Shell>
      <div className="text-center py-10">
        <img src="/mascot/empty.png" alt="" className="w-32 h-32 object-contain mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Такой страницы нет</h1>
        <p className="text-slate-500 mt-2">Похоже, адрес битый или страница переехала.</p>
        <Link
          to="/tasks"
          className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-green-200 to-green-400 hover:from-green-300 hover:to-green-500 text-slate-900 font-semibold rounded-xl transition-[transform,box-shadow,background-color] duration-100 shadow-[0_4px_0_0_#15803d] active:shadow-[0_1px_0_0_#15803d] active:translate-y-[3px]"
        >
          К тренажёру
        </Link>
      </div>
    </Shell>
  );
}
