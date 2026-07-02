import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { TASKS, SECTIONS } from "../data.js";
import { norm, shuffle, isTaskRight } from "../utils.js";

export default function Trainer() {
  const [screen, setScreen] = useState("home"); // home | quiz | result
  const [section, setSection] = useState("all");
  const [count, setCount] = useState(10);

  const [deck, setDeck] = useState([]);
  const [pos, setPos] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const [single, setSingle] = useState(null);
  const [multi, setMulti] = useState([]);
  const [text, setText] = useState("");

  const sectionList = useMemo(() => {
    const present = [...new Set(TASKS.map((t) => t.sec))].sort();
    return present.map((s) => ({ id: s, name: SECTIONS[s] || "Раздел " + s, n: TASKS.filter((t) => t.sec === s).length }));
  }, []);

  function start() {
    let pool = section === "all" ? TASKS : TASKS.filter((t) => t.sec === section);
    pool = shuffle(pool).slice(0, count === "all" ? pool.length : count);
    setDeck(pool);
    setPos(0);
    setCorrectCount(0);
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
    if (isTaskRight(task, currentAnswer)) setCorrectCount((c) => c + 1);
  }
  function next() {
    if (pos + 1 < deck.length) {
      setPos((p) => p + 1);
      resetAnswer();
    } else {
      setScreen("result");
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
        <div className="mb-8">
          <p className="text-emerald-700 font-semibold tracking-wide text-sm uppercase">ОГЭ · География</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Тренажёр по разделам</h1>
          <p className="text-slate-500 mt-2">Банк ФИПИ, {TASKS.length} заданий. Выбери раздел и число вопросов.</p>
        </div>

        <Link
          to="/tasks/variant"
          className="block mb-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl p-4 transition-colors"
        >
          <p className="font-semibold">Собрать полный вариант — 30 заданий</p>
          <p className="text-sm text-slate-300 mt-0.5">Как на настоящем экзамене, без таймера, с разбором ошибок</p>
        </Link>

        <p className="text-sm font-medium text-slate-700 mb-2">Раздел</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <Chip active={section === "all"} onClick={() => setSection("all")}>Все разделы</Chip>
          {sectionList.map((s) => (
            <Chip key={s.id} active={section === s.id} onClick={() => setSection(s.id)}>
              {s.name} <span className="opacity-50">· {s.n}</span>
            </Chip>
          ))}
        </div>

        <p className="text-sm font-medium text-slate-700 mb-2">Сколько вопросов</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {[5, 10, 20, "all"].map((n) => (
            <Chip key={n} active={count === n} onClick={() => setCount(n)}>{n === "all" ? "Все" : n}</Chip>
          ))}
        </div>

        <button onClick={start} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-colors">
          Начать
        </button>
      </Shell>
    );
  }

  // ── РЕЗУЛЬТАТ ──
  if (screen === "result") {
    const pct = Math.round((correctCount / deck.length) * 100);
    const verdict = pct >= 80 ? "Сильно." : pct >= 50 ? "Норм, есть куда расти." : "Надо подтянуть.";
    return (
      <Shell>
        <div className="text-center py-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Результат</p>
          <p className="mt-3 text-6xl font-bold text-slate-900">{correctCount}<span className="text-2xl text-slate-400">/{deck.length}</span></p>
          <p className="mt-1 text-lg text-slate-500">{pct}% верных · {verdict}</p>
          <div className="mt-8 flex gap-3">
            <button onClick={start} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors">Ещё раз</button>
            <button onClick={() => setScreen("home")} className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold py-3 rounded-xl transition-colors">В меню</button>
          </div>
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
          <span>Вопрос {pos + 1} из {deck.length}</span>
          <span>Верно: {correctCount}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${(pos / deck.length) * 100}%` }} />
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
          <button onClick={next} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors">
            {pos + 1 < deck.length ? "Дальше" : "Итог"}
          </button>
        )}
      </div>
    </Shell>
  );
}

// ── переиспользуемая карточка задания (используется и в Trainer, и в Variant) ──
export function TaskCard({ task, answered, right, single, setSingle, multi, toggleMulti, text, setText, onCheck }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1 mb-3">
        {SECTIONS[task.sec] || "Раздел " + task.sec}
        {task.type === "multi" && " · выбор нескольких"}
        {task.type === "short" && " · впиши ответ"}
      </span>

      <h2 className="text-lg font-semibold text-slate-900 leading-snug">{task.q}</h2>

      {task.image && (
        <img src={task.image} alt="иллюстрация к заданию" className="mt-4 rounded-lg border border-slate-200 max-h-64 object-contain" />
      )}

      {task.type === "single" && (
        <div className="mt-5 space-y-3">
          {task.options.map((opt, i) => {
            let s = "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50";
            if (answered) {
              if (i === task.correct) s = "border-emerald-500 bg-emerald-50";
              else if (i === single) s = "border-rose-400 bg-rose-50";
              else s = "border-slate-200 opacity-60";
            } else if (i === single) s = "border-emerald-500 bg-emerald-50";
            return (
              <button key={i} disabled={answered} onClick={() => setSingle(i)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors text-slate-800 ${s}`}>{opt}</button>
            );
          })}
        </div>
      )}

      {task.type === "multi" && (
        <div className="mt-5 space-y-3">
          {task.options.map((opt, i) => {
            const picked = multi.includes(i);
            let s = picked ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-400";
            if (answered) {
              if (task.correct.includes(i)) s = "border-emerald-500 bg-emerald-50";
              else if (picked) s = "border-rose-400 bg-rose-50";
              else s = "border-slate-200 opacity-60";
            }
            return (
              <button key={i} disabled={answered} onClick={() => toggleMulti(i)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors text-slate-800 flex items-center gap-3 ${s}`}>
                <span className={`w-5 h-5 rounded border flex-shrink-0 ${picked ? "bg-emerald-600 border-emerald-600" : "border-slate-400"}`} />
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {task.type === "short" && (
        <div className="mt-5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCheck()}
            disabled={answered}
            placeholder="Впиши ответ и нажми Проверить"
            className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-slate-800 ${answered ? (right ? "border-emerald-500 bg-emerald-50" : "border-rose-400 bg-rose-50") : "border-slate-300 focus:border-emerald-500"}`}
          />
          {answered && !right && (
            <p className="mt-2 text-sm text-slate-600">Верный ответ: <b className="text-emerald-700">{task.answer}</b></p>
          )}
        </div>
      )}

      {answered && (
        <div className={`mt-4 text-sm font-medium ${right ? "text-emerald-700" : "text-rose-600"}`}>
          {right ? "Верно" : "Неверно"}
        </div>
      )}
    </div>
  );
}

export function Shell({ children }) {
  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-lg py-6">{children}</div>
    </div>
  );
}
export function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
        active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-300 hover:border-emerald-400"
      }`}>{children}</button>
  );
}
