import React from "react";
import { Link } from "react-router-dom";
import { Shell } from "./Trainer.jsx";
import { MASCOT } from "../brand/mascot.js";

export default function NotFound() {
  return (
    <Shell>
      <div className="text-center py-10">
        <img src={MASCOT.empty} alt="" className="w-32 h-32 object-contain mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-ink">Такой страницы нет</h1>
        <p className="text-ink-muted mt-2">Похоже, адрес битый или страница переехала.</p>
        <Link
          to="/tasks"
          className="inline-flex mt-6 px-6 py-3 bg-brand hover:bg-brand-800 text-white font-bold rounded-md shadow-step active:shadow-step-pressed active:translate-y-[2px] transition-[transform,box-shadow,background-color] duration-[120ms] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-300 focus-visible:outline-offset-[3px]"
        >
          К тренажёру
        </Link>
      </div>
    </Shell>
  );
}
