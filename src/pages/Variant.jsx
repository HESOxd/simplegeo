import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TASKS, SECTIONS } from "../data.js";
import { shuffle, isTaskRight } from "../utils.js";
import { TaskCard, Shell } from "./Trainer.jsx";

// Пропорция типов заданий подобрана близко к структуре реального ОГЭ по географии
// (в реальном экзамене 30 заданий: 8 с ответом-цифрой, 5 словом, 14 числом/
// последовательностью, 3 развёрнутых. У нас пока нет типа "последовательность"
// и заданий с развёрнутым ответом, поэтому пропорция адаптирована под три
// доступных типа банка — но раздел и общее число заданий совпадают с настоящим.
const TARGET = { single: 9, multi: 6, short: 15 }; // сумма = 30

function buildVariant() {
  const bySingle = shuffle(TASKS.filter((t) => t.type === "single")).slice(0, TARGET.single);
  const byMulti = shuffle(TASKS.filter((t) => t.type === "multi")).slice(0, TARGET.multi);
  const byShort = shuffle(TASKS.filter((t) => t.type === "short")).slice(0, TARGET.short);
  return shuffle([...bySingle, ...byMulti, ...byShort]);
}

export default function Variant() {
  const [screen, setScreen] = useState("home"); // home | quiz | review
  const [deck, setDeck] = useState([]);
  const [pos, setPos] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState([]); // {taskId, single, multi, text, right}

  const [single, setSingle] = useState(null);
  const [multi, setMulti] = useState([]);
  const [text, setText] = useState("");

  function start() {
    setDeck(buildVariant());
    setPos(0);
    setAnswers([]);
    resetAnswer();
    setScreen("quiz");
  }
  function resetAnswer() {
    setAnswered(false);
    setSingle(null);
    setMulti([]);
    setText("");
  }

  const task = deck[pos];
  const currentAnswer = { single, multi, text };

  function check() {
    if (answered) return;
    if (task.type === "single" && single === null) return;
    if (task.type === "multi" && multi.length === 0) return;
    if (task.type === "short" && text.trim() === "") return;
    setAnswered(true);
  }
  function next() {
    const right = isTaskRight(task, currentAnswer);
    const record = { task, single, multi, text, right };
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

  // ── ГЛАВНЫЙ ЭКРАН ──
  if (screen === "home") {
    return (
      <Shell>
        <Link to="/tasks" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">← К тренажёру по разделам</Link>
        <div className="mb-8">
          <p className="text-lime-700 font-semibold tracking-wide text-sm uppercase">ОГЭ · География</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Полный вариант</h1>
          <p className="text-slate-500 mt-2">
            30 заданий, как в настоящем варианте ОГЭ. Без таймера — в конце подробный разбор
            каждого ответа: что верно, что нет, и как правильно.
          </p>
        </div>
        <button onClick={start} className="w-full bg-gradient-to-r from-lime-300 to-lime-500 hover:from-lime-400 hover:to-lime-600 text-slate-900 font-semibold py-3.5 rounded-xl transition-colors">
          Начать вариант
        </button>
      </Shell>
    );
  }

  // ── РАЗБОР В КОНЦЕ ──
  if (screen === "review") {
    const correctCount = answers.filter((a) => a.right).length;
    const pct = Math.round((correctCount / answers.length) * 100);
    return (
      <Shell>
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-lime-700">Результат варианта</p>
          <p className="mt-3 text-6xl font-bold text-slate-900">{correctCount}<span className="text-2xl text-slate-400">/{answers.length}</span></p>
          <p className="mt-1 text-lg text-slate-500">{pct}% верных</p>
        </div>

        <div className="space-y-3">
          {answers.map((a, i) => (
            <div key={i} className={`rounded-xl border-2 p-4 ${a.right ? "border-lime-200 bg-lime-50/40" : "border-rose-200 bg-rose-50/40"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-800">{i + 1}. {a.task.q}</p>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${a.right ? "bg-lime-400 text-slate-900" : "bg-rose-500 text-white"}`}>
                  {a.right ? "верно" : "неверно"}
                </span>
              </div>
              {!a.right && (
                <p className="text-sm text-slate-600 mt-2">
                  Правильный ответ: <b className="text-lime-700">
                    {a.task.type === "short" ? a.task.answer :
                     a.task.type === "single" ? a.task.options[a.task.correct] :
                     a.task.correct.map((ci) => a.task.options[ci]).join(", ")}
                  </b>
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={start} className="flex-1 bg-gradient-to-r from-lime-300 to-lime-500 hover:from-lime-400 hover:to-lime-600 text-slate-900 font-semibold py-3 rounded-xl transition-colors">Новый вариант</button>
          <Link to="/tasks" className="flex-1 text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold py-3 rounded-xl transition-colors">К тренажёру</Link>
        </div>
      </Shell>
    );
  }

  // ── ЭКРАН ВОПРОСА ──
  const right = isTaskRight(task, currentAnswer);
  return (
    <Shell>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>Задание {pos + 1} из {deck.length}</span>
          <span>Верно: {answers.filter((a) => a.right).length}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-lime-500 transition-all duration-300" style={{ width: `${(pos / deck.length) * 100}%` }} />
        </div>
      </div>

      <TaskCard
        task={task} answered={answered} right={right}
        single={single} setSingle={setSingle}
        multi={multi} toggleMulti={toggleMulti}
        text={text} setText={setText}
        onCheck={check}
      />

      <div className="mt-5">
        {!answered ? (
          <button onClick={check} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors">Проверить</button>
        ) : (
          <button onClick={next} className="w-full bg-gradient-to-r from-lime-300 to-lime-500 hover:from-lime-400 hover:to-lime-600 text-slate-900 font-semibold py-3 rounded-xl transition-colors">
            {pos + 1 < deck.length ? "Дальше" : "К разбору"}
          </button>
        )}
      </div>
    </Shell>
  );
}
