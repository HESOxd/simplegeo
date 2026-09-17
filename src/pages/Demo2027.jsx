import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DEMO_2027 } from "../data/demo2027.js";
import { isTaskRight } from "../utils.js";
import { Shell, TaskCard, PrimaryButton, DarkButton, Chip } from "./Trainer.jsx";

// Официальный демо-вариант ОГЭ 2027 (ФИПИ, проект) — один длинный список,
// который просто пролистывают (как настоящий бланк / как на magellan.education),
// без пошаговых экранов "Задание X из N" и без плиток. Два режима проверки:
// "сразу" — под каждым заданием своя кнопка "Проверить"; "в конце" — все поля
// открыты для заполнения, а итог по всем заданиям раскрывается одной кнопкой внизу.

const STORAGE_KEY = "demo2027-progress-v3";
const EMPTY_ANSWER = { single: null, multi: [], text: "", selfRight: null };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isFilled(a) {
  return a.single !== null || a.multi.length > 0 || a.text.trim() !== "" || a.selfRight !== null;
}

export default function Demo2027() {
  const saved = loadState();
  const [mode, setMode] = useState(saved?.mode || "instant"); // "instant" | "end"
  const [answers, setAnswers] = useState(saved?.answers || {});
  const [checkedIds, setCheckedIds] = useState(() => new Set(saved?.checkedIds || []));
  const [allRevealed, setAllRevealed] = useState(saved?.allRevealed || false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode, answers, checkedIds: [...checkedIds], allRevealed,
      }));
    } catch {
      /* localStorage недоступен — просто не сохраняем */
    }
  }, [mode, answers, checkedIds, allRevealed]);

  function getAnswer(taskId) {
    return answers[taskId] || EMPTY_ANSWER;
  }
  function updateAnswer(taskId, patch) {
    setAnswers((prev) => ({ ...prev, [taskId]: { ...EMPTY_ANSWER, ...prev[taskId], ...patch } }));
  }
  function checkOne(taskId) {
    setCheckedIds((prev) => new Set(prev).add(taskId));
  }
  function markSelf(taskId, v) {
    updateAnswer(taskId, { selfRight: v });
    checkOne(taskId);
  }
  function finishAll() {
    setAllRevealed(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function resetAll() {
    if (!window.confirm("Сбросить все ответы и начать заново?")) return;
    setAnswers({});
    setCheckedIds(new Set());
    setAllRevealed(false);
  }

  const answeredCount = DEMO_2027.filter((t) => isFilled(getAnswer(t.id))).length;
  const revealedTasks = mode === "instant" ? DEMO_2027.filter((t) => checkedIds.has(t.id)) : (allRevealed ? DEMO_2027 : []);
  const correctCount = revealedTasks.filter((t) => isTaskRight(t, getAnswer(t.id))).length;
  const showScore = mode === "instant" ? revealedTasks.length > 0 : allRevealed;

  return (
    <Shell>
      <Link to="/tasks" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">← К тренажёру по разделам</Link>

      <div className="mb-6">
        <p className="text-green-700 font-semibold tracking-wide text-sm uppercase">Официальный документ ФИПИ</p>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">Демо-версия ОГЭ 2027</h1>
        <p className="text-slate-500 mt-2 leading-relaxed">
          Все 30 заданий демонстрационного варианта ФИПИ на 2027 год — плюс оба примера там,
          где демоверсия показывает по два варианта задания (4, 20, 21, 22, 27). Всего 35 заданий.
          Пролистай и решай в любом порядке.
        </p>
        <p className="text-xs text-slate-400 mt-3">
          Источник: демонстрационный вариант КИМ ОГЭ 2027 г. по географии, ФИПИ (документ помечен как «проект»,
          итоговый банк заданий может отличаться).
        </p>
      </div>

      <div className="mb-4 bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-700 mb-2">Как проверять ответы</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={mode === "instant"} onClick={() => setMode("instant")}>Сразу по каждому заданию</Chip>
          <Chip active={mode === "end"} onClick={() => setMode("end")}>Только в конце, как на экзамене</Chip>
        </div>
      </div>

      <div className="sticky top-2 z-10 flex items-center justify-between mb-5 bg-white/95 backdrop-blur rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
        <p className="text-sm text-slate-600">Отвечено: <b className="text-slate-900">{answeredCount}</b>/{DEMO_2027.length}</p>
        {showScore && (
          <p className="text-sm text-slate-600">Верно: <b className="text-green-700">{correctCount}</b>/{revealedTasks.length}</p>
        )}
      </div>

      <div className="space-y-5">
        {DEMO_2027.map((task) => {
          const a = getAnswer(task.id);
          const answered = mode === "instant" ? checkedIds.has(task.id) : allRevealed;
          const right = isTaskRight(task, a);
          const canCheck =
            (task.type === "single" && a.single !== null) ||
            (task.type === "multi" && a.multi.length > 0) ||
            ((task.type === "short" || task.type === "sequence") && a.text.trim() !== "") ||
            task.type === "essay";

          return (
            <div key={task.id}>
              <TaskCard
                task={task} answered={answered} right={right}
                single={a.single} setSingle={(v) => updateAnswer(task.id, { single: v })}
                multi={a.multi}
                toggleMulti={(i) => {
                  if (answered) return;
                  const has = a.multi.includes(i);
                  updateAnswer(task.id, { multi: has ? a.multi.filter((x) => x !== i) : [...a.multi, i] });
                }}
                text={a.text} setText={(v) => updateAnswer(task.id, { text: v })}
                selfRight={a.selfRight} onMarkSelf={(v) => markSelf(task.id, v)}
                onCheck={() => canCheck && checkOne(task.id)}
                kicker={task.kes}
              />
              {mode === "instant" && !answered && (
                <DarkButton
                  onClick={() => canCheck && checkOne(task.id)}
                  className={`mt-3 w-full py-2.5 ${!canCheck ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {task.type === "essay" ? "Показать ответ" : "Проверить"}
                </DarkButton>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        {mode === "end" && !allRevealed && (
          <PrimaryButton onClick={finishAll} className="flex-1 py-3.5">Завершить вариант и проверить ответы</PrimaryButton>
        )}
        <button
          onClick={resetAll}
          className={`${mode === "end" && !allRevealed ? "" : "flex-1"} px-5 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-xl transition-colors`}
        >
          Сбросить и начать заново
        </button>
      </div>
    </Shell>
  );
}
