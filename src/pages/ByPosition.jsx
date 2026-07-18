import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { TASKS } from "../data.js";
import { buildPositionPools, POSITION_TOPIC } from "../positionClassifier.js";
import { shuffle, isTaskRight } from "../utils.js";
import { Shell, Chip, TaskCard } from "./Trainer.jsx";

// Тренировка по конкретному номеру задания (1-30), как на sdamgia —
// в отличие от "полного варианта" тут выбираешь ОДНУ позицию и решаешь
// подряд несколько заданий именно этого типа. Пул кандидатов на каждую
// позицию — из src/positionClassifier.js (тот же классификатор, что
// использует сборка полного варианта).

export default function ByPosition() {
  const pools = useMemo(() => buildPositionPools(TASKS), []);

  const [screen, setScreen] = useState("grid"); // grid | setup | quiz | result
  const [pos, setPos] = useState(null);
  const [count, setCount] = useState(10);

  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const [single, setSingle] = useState(null);
  const [multi, setMulti] = useState([]);
  const [text, setText] = useState("");
  const [selfRight, setSelfRight] = useState(null);

  function openPos(p) {
    setPos(p);
    setCount(10);
    setScreen("setup");
  }

  function resetAnswer() {
    setAnswered(false);
    setSingle(null);
    setMulti([]);
    setText("");
    setSelfRight(null);
  }

  function start() {
    const pool = pools[pos] || [];
    const picked = shuffle(pool).slice(0, count === "all" ? pool.length : count);
    setDeck(picked);
    setIdx(0);
    setCorrectCount(0);
    resetAnswer();
    setScreen("quiz");
  }

  const task = deck[idx];
  const currentAnswer = { single, multi, text, selfRight };
  const canAdvance = answered && (task?.type !== "essay" || selfRight !== null);

  function check() {
    if (answered) return;
    if (task.type === "single" && single === null) return;
    if (task.type === "multi" && multi.length === 0) return;
    if (task.type === "short" && text.trim() === "") return;
    if (task.type === "sequence" && text.trim() === "") return;
    setAnswered(true);
    if (task.type !== "essay" && isTaskRight(task, currentAnswer)) setCorrectCount((c) => c + 1);
  }
  function markSelf(isRight) {
    if (selfRight !== null) return;
    setSelfRight(isRight);
    if (isRight) setCorrectCount((c) => c + 1);
  }
  function next() {
    if (idx + 1 < deck.length) {
      setIdx((p) => p + 1);
      resetAnswer();
    } else {
      setScreen("result");
    }
  }
  function toggleMulti(i) {
    if (answered) return;
    setMulti((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
  }

  if (screen === "grid") {
    return (
      <Shell>
        <Link to="/tasks" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">← К тренажёру по разделам</Link>
        <div className="mb-6">
          <p className="text-green-700 font-semibold tracking-wide text-sm uppercase">ОГЭ · География</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">По номеру задания</h1>
          <p className="text-slate-500 mt-2">
            Выбери номер — потренируешься только на заданиях именно этого типа, как на настоящем экзамене под этим номером.
          </p>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((p) => {
            const n = (pools[p] || []).length;
            return (
              <button
                key={p}
                onClick={() => n > 0 && openPos(p)}
                disabled={n === 0}
                title={POSITION_TOPIC[p]}
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-colors ${
                  n === 0
                    ? "border-slate-100 text-slate-300 cursor-not-allowed"
                    : "border-slate-200 bg-white hover:border-green-400 hover:bg-green-50"
                }`}
              >
                <span className="text-lg font-bold text-slate-900">{p}</span>
                <span className="text-[10px] text-slate-400">{n}</span>
              </button>
            );
          })}
        </div>
      </Shell>
    );
  }

  if (screen === "setup") {
    const pool = pools[pos] || [];
    const options = [5, 10, 20, "all"].filter((n) => n === "all" || n < pool.length);
    return (
      <Shell>
        <button onClick={() => setScreen("grid")} className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">← Все номера</button>
        <div className="mb-8">
          <p className="text-green-700 font-semibold tracking-wide text-sm uppercase">Задание {pos}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{POSITION_TOPIC[pos]}</h1>
          <p className="text-slate-500 mt-2">В базе {pool.length} заданий этого типа.</p>
        </div>
        <p className="text-sm font-medium text-slate-700 mb-2">Сколько вопросов</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {options.map((n) => (
            <Chip key={n} active={count === n} onClick={() => setCount(n)}>{n === "all" ? "Все" : n}</Chip>
          ))}
        </div>
        <button onClick={start} className="w-full bg-gradient-to-r from-green-200 to-green-400 hover:from-green-300 hover:to-green-500 text-slate-900 font-semibold py-3.5 rounded-xl transition-colors">
          Начать
        </button>
      </Shell>
    );
  }

  if (screen === "result") {
    return (
      <Shell>
        <div className="text-center py-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Задание {pos} · Результат</p>
          <p className="mt-3 text-6xl font-bold text-slate-900">{correctCount}<span className="text-2xl text-slate-400">/{deck.length}</span></p>
          <p className="mt-1 text-lg text-slate-500">{Math.round((correctCount / deck.length) * 100)}% верных</p>
          <div className="mt-8 flex gap-3">
            <button onClick={start} className="flex-1 bg-gradient-to-r from-green-200 to-green-400 hover:from-green-300 hover:to-green-500 text-slate-900 font-semibold py-3 rounded-xl transition-colors">Ещё раз</button>
            <button onClick={() => setScreen("grid")} className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold py-3 rounded-xl transition-colors">Все номера</button>
          </div>
        </div>
      </Shell>
    );
  }

  // quiz
  const right = isTaskRight(task, currentAnswer);
  return (
    <Shell>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>Задание {pos} · {idx + 1} из {deck.length}</span>
          <span>Верно: {correctCount}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${(idx / deck.length) * 100}%` }} />
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
            {idx + 1 < deck.length ? "Дальше" : "Итог"}
          </button>
        ) : null}
      </div>
    </Shell>
  );
}
