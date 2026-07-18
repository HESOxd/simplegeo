import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isTaskRight } from "./utils.js";
import { TaskCard, Shell } from "./pages/Trainer.jsx";

function loadProgress(key) {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveProgress(key, data) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* localStorage недоступен (приватный режим и т.п.) — просто не сохраняем */
  }
}

// Экран прохождения + разбора варианта. Не занимается сборкой deck — это
// делает вызывающая страница (случайный вариант или вариант недели).
// persistKey — если задан, прогресс (текущая позиция + ответы) сохраняется
// в localStorage и восстанавливается при повторном заходе на то же устройство.
export default function VariantRunner({ deck, backTo, onRestart, persistKey }) {
  const saved = persistKey ? loadProgress(persistKey) : null;
  const restoredAnswers = (saved?.answers || [])
    .map((a) => ({ ...a, task: deck.find((t) => t.id === a.taskId) }))
    .filter((a) => a.task);

  const [screen, setScreen] = useState(saved?.screen || "quiz");
  const [pos, setPos] = useState(saved?.pos || 0);
  const [answers, setAnswers] = useState(restoredAnswers);

  const [answered, setAnswered] = useState(false);
  const [single, setSingle] = useState(null);
  const [multi, setMulti] = useState([]);
  const [text, setText] = useState("");
  const [selfRight, setSelfRight] = useState(null);

  useEffect(() => {
    if (!persistKey) return;
    const compactAnswers = answers.map(({ task, single, multi, text, selfRight, right }) => ({
      taskId: task.id, single, multi, text, selfRight, right,
    }));
    saveProgress(persistKey, { screen, pos, answers: compactAnswers });
  }, [persistKey, screen, pos, answers]);

  function resetAnswer() {
    setAnswered(false);
    setSingle(null);
    setMulti([]);
    setText("");
    setSelfRight(null);
  }

  const task = deck[pos];
  const currentAnswer = { single, multi, text, selfRight };
  const canAdvance = answered && (task?.type !== "essay" || selfRight !== null);

  function check() {
    if (answered) return;
    if (task.type === "single" && single === null) return;
    if (task.type === "multi" && multi.length === 0) return;
    if (task.type === "short" && text.trim() === "") return;
    if (task.type === "sequence" && text.trim() === "") return;
    setAnswered(true);
  }
  function markSelf(isRight) {
    if (selfRight !== null) return;
    setSelfRight(isRight);
  }
  function next() {
    const right = isTaskRight(task, { single, multi, text, selfRight });
    const record = { task, single, multi, text, selfRight, right };
    const nextAnswers = [...answers, record];
    setAnswers(nextAnswers);
    if (pos + 1 < deck.length) {
      setPos((p) => p + 1);
      resetAnswer();
    } else {
      setScreen("review");
    }
  }
  function toggleMulti(i) {
    if (answered) return;
    setMulti((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
  }

  if (screen === "review") {
    const correctCount = answers.filter((a) => a.right).length;
    const pct = Math.round((correctCount / answers.length) * 100);
    return (
      <Shell>
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Результат варианта</p>
          <p className="mt-3 text-6xl font-bold text-slate-900">{correctCount}<span className="text-2xl text-slate-400">/{answers.length}</span></p>
          <p className="mt-1 text-lg text-slate-500">{pct}% верных</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {answers.map((a, i) => (
            <div key={i} className={`rounded-xl border-2 p-3 ${a.right ? "border-green-200 bg-green-50/40" : "border-rose-200 bg-rose-50/40"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-800">{i + 1}. {a.task.q}</p>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${a.right ? "bg-green-400 text-slate-900" : "bg-rose-500 text-white"}`}>
                  {a.right ? "верно" : "неверно"}
                </span>
              </div>
              {!a.right && a.task.type === "essay" && (
                <div className="mt-2 p-3 rounded-lg bg-white border border-slate-200">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Эталонный ответ</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{a.task.answer}</p>
                </div>
              )}
              {!a.right && a.task.type !== "essay" && (
                <p className="text-sm text-slate-600 mt-2">
                  Правильный ответ: <b className="text-green-700">
                    {a.task.type === "short" || a.task.type === "sequence" ? a.task.answer :
                     a.task.type === "single" ? (a.task.options ? a.task.options[a.task.correct] : `вариант ${a.task.correct + 1}`) :
                     a.task.correct.map((ci) => a.task.options[ci]).join(", ")}
                  </b>
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          {onRestart && (
            <button onClick={onRestart} className="flex-1 bg-gradient-to-r from-green-200 to-green-400 hover:from-green-300 hover:to-green-500 text-slate-900 font-semibold py-3 rounded-xl transition-colors">Новый вариант</button>
          )}
          <Link to={backTo} className="flex-1 text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold py-3 rounded-xl transition-colors">Назад</Link>
        </div>
      </Shell>
    );
  }

  if (!task) return null;

  const right = isTaskRight(task, currentAnswer);
  return (
    <Shell>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>Задание {pos + 1} из {deck.length}</span>
          <span>Верно: {answers.filter((a) => a.right).length}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${(pos / deck.length) * 100}%` }} />
        </div>
      </div>

      <TaskCard
        task={task} answered={answered} right={right}
        single={single} setSingle={setSingle}
        multi={multi} toggleMulti={toggleMulti}
        text={text} setText={setText}
        selfRight={selfRight} onMarkSelf={markSelf}
        onCheck={check}
      />

      <div className="mt-5">
        {!answered ? (
          <button onClick={check} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors">Проверить</button>
        ) : canAdvance ? (
          <button onClick={next} className="w-full bg-gradient-to-r from-green-200 to-green-400 hover:from-green-300 hover:to-green-500 text-slate-900 font-semibold py-3 rounded-xl transition-colors">
            {pos + 1 < deck.length ? "Дальше" : "К разбору"}
          </button>
        ) : null}
      </div>
    </Shell>
  );
}
