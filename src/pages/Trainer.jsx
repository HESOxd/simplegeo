import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { TASKS, SECTIONS } from "../data.js";
import { norm, shuffle, isTaskRight } from "../utils.js";

export const GRADIENT_TEXT = {
  backgroundImage: "linear-gradient(90deg, #4ade80, #15803d)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const SECTION_ICONS = {
  "1": "🧭",
  "2": "🗺️",
  "3": "🪐",
  "4": "⛰️",
  "5": "🌎",
  "6": "🌪️",
  "7": "🏭",
};

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
  const [selfRight, setSelfRight] = useState(null);

  const sectionList = useMemo(() => {
    const present = [...new Set(TASKS.map((t) => t.sec))].sort();
    return present.map((s) => ({ id: s, name: SECTIONS[s] || "Раздел " + s, n: TASKS.filter((t) => t.sec === s).length }));
  }, []);
  const maxSectionCount = useMemo(() => Math.max(...sectionList.map((s) => s.n)), [sectionList]);

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
    if (task.type !== "essay" && isTaskRight(task, currentAnswer)) setCorrectCount((c) => c + 1);
  }
  function markSelf(isRight) {
    if (selfRight !== null) return;
    setSelfRight(isRight);
    if (isRight) setCorrectCount((c) => c + 1);
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
      <div className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto p-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Link
            to="/tasks/weekly"
            className="group flex items-center justify-between mb-4 bg-white border border-slate-200 hover:border-green-400 hover:bg-green-50/40 rounded-xl p-4 transition-colors"
          >
            <p className="font-semibold text-slate-900">Варианты недели</p>
            <OpenBadge />
          </Link>

          <Link
            to="/tasks/by-number"
            className="group flex items-center justify-between mb-8 bg-white border border-slate-200 hover:border-green-400 hover:bg-green-50/40 rounded-xl p-4 transition-colors"
          >
            <p className="font-semibold text-slate-900">По номеру задания</p>
            <OpenBadge />
          </Link>

          <p className="text-sm font-medium text-slate-700 mb-2">Раздел</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <SectionCard
              active={section === "all"}
              onClick={() => setSection("all")}
              icon="🌍"
              name="Все разделы"
              n={TASKS.length}
              max={TASKS.length}
            />
            {sectionList.map((s) => (
              <SectionCard
                key={s.id}
                active={section === s.id}
                onClick={() => setSection(s.id)}
                icon={SECTION_ICONS[s.id] || "📍"}
                name={s.name}
                n={s.n}
                max={maxSectionCount}
              />
            ))}
          </div>

          <p className="text-sm font-medium text-slate-700 mb-2">Сколько вопросов</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {[5, 10, 20, "all"].map((n) => (
              <Chip key={n} active={count === n} onClick={() => setCount(n)}>{n === "all" ? "Все" : n}</Chip>
            ))}
          </div>

          <button onClick={start} className="w-full bg-gradient-to-r from-green-200 to-green-400 hover:from-green-300 hover:to-green-500 text-slate-900 font-semibold py-3.5 rounded-xl transition-colors">
            Начать
          </button>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Link to="/about" className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-green-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <img src="/photo.jpg" alt="Юрий" className="w-12 h-12 rounded-full object-cover border-2 border-green-100" />
              <div>
                <p className="font-semibold text-slate-900">Юрий</p>
                <p className="text-xs text-slate-500">Репетитор по географии</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">3 года преподаю, 100+ учеников, средний балл на ОГЭ — 4,7.</p>
            <p className="text-sm font-medium mt-3" style={GRADIENT_TEXT}>Узнать больше →</p>
          </Link>

          <Link to="/course" className="block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-300 transition-colors">
            <img src="/course-preview.jpg" alt="Полный гайд по решению заданий ОГЭ" className="w-full aspect-video object-contain bg-slate-50 border-b border-slate-100" />
            <div className="p-5">
              <p className="font-semibold text-slate-900 mb-1">Полный гайд по решению заданий ОГЭ</p>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">Mind map по всем заданиям, примеры решений и лайфхаки.</p>
              <div className="flex items-center justify-between">
                <p className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-green-600">1499 ₽</span>
                  <span className="text-sm text-slate-400 line-through">3000 ₽</span>
                </p>
                <p className="text-sm font-medium" style={GRADIENT_TEXT}>Подробнее →</p>
              </div>
            </div>
          </Link>
        </div>
        </div>
      </div>
    );
  }

  // ── РЕЗУЛЬТАТ ──
  if (screen === "result") {
    const pct = Math.round((correctCount / deck.length) * 100);
    const verdict = pct >= 80 ? "Сильно." : pct >= 50 ? "Норм, есть куда расти." : "Надо подтянуть.";
    return (
      <Shell>
        <div className="text-center py-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Результат</p>
          <p className="mt-3 text-6xl font-bold text-slate-900">{correctCount}<span className="text-2xl text-slate-400">/{deck.length}</span></p>
          <p className="mt-1 text-lg text-slate-500">{pct}% верных · {verdict}</p>
          <div className="mt-8 flex gap-3">
            <button onClick={start} className="flex-1 bg-gradient-to-r from-green-200 to-green-400 hover:from-green-300 hover:to-green-500 text-slate-900 font-semibold py-3 rounded-xl transition-colors">Ещё раз</button>
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
            {pos + 1 < deck.length ? "Дальше" : "Итог"}
          </button>
        ) : null}
      </div>
    </Shell>
  );
}

// ── переиспользуемая карточка задания (используется и в Trainer, и в Variant) ──
export function TaskCard({ task, answered, right, single, setSingle, multi, toggleMulti, text, setText, selfRight, onMarkSelf, onCheck }) {
  const awaitingSelfCheck = task.type === "essay" && answered && selfRight === null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <span className="inline-block text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2.5 py-1 mb-3">
        {SECTIONS[task.sec] || "Раздел " + task.sec}
        {task.type === "multi" && " · выбор нескольких"}
        {task.type === "short" && " · впиши ответ"}
        {task.type === "sequence" && " · впиши последовательность"}
        {task.type === "essay" && " · развёрнутый ответ"}
      </span>

      {task.passage && (
        <p className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line">{task.passage}</p>
      )}

      <h2 className="text-lg font-semibold text-slate-900 leading-snug">{task.q}</h2>

      {task.image && (
        <img src={task.image} alt="иллюстрация к заданию" className="mt-4 rounded-lg border border-slate-200 max-h-64 object-contain" />
      )}

      {task.table && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm text-slate-700">
            <tbody>
              {task.table.split("\n").filter(Boolean).map((line, i) => (
                <tr key={i} className={i % 2 ? "bg-slate-50" : ""}>
                  {line.split("|").map((cell, j) => (
                    <td key={j} className="px-3 py-1.5 border-t border-slate-100 first:font-medium">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {task.type === "single" && task.optionImages && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {task.optionImages.map((img, i) => {
            let s = "border-slate-200 hover:border-green-400 hover:bg-green-50";
            if (answered) {
              if (i === task.correct) s = "border-green-500 bg-green-50";
              else if (i === single) s = "border-rose-400 bg-rose-50";
              else s = "border-slate-200 opacity-60";
            } else if (i === single) s = "border-green-500 bg-green-50";
            return (
              <button key={i} disabled={answered} onClick={() => setSingle(i)}
                className={`text-left p-3 rounded-xl border-2 transition-colors flex flex-col items-center gap-2 ${s}`}>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                <img src={img} alt={`вариант ${i + 1}`} className="max-h-40 object-contain" />
              </button>
            );
          })}
        </div>
      )}

      {task.type === "single" && task.options && (
        <div className="mt-5 space-y-3">
          {task.options.map((opt, i) => {
            let s = "border-slate-200 hover:border-green-400 hover:bg-green-50";
            if (answered) {
              if (i === task.correct) s = "border-green-500 bg-green-50";
              else if (i === single) s = "border-rose-400 bg-rose-50";
              else s = "border-slate-200 opacity-60";
            } else if (i === single) s = "border-green-500 bg-green-50";
            return (
              <button key={i} disabled={answered} onClick={() => setSingle(i)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors text-slate-800 flex items-start gap-3 ${s}`}>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      )}

      {task.type === "multi" && (
        <div className="mt-5 space-y-3">
          {task.options.map((opt, i) => {
            const picked = multi.includes(i);
            let s = picked ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-green-400";
            if (answered) {
              if (task.correct.includes(i)) s = "border-green-500 bg-green-50";
              else if (picked) s = "border-rose-400 bg-rose-50";
              else s = "border-slate-200 opacity-60";
            }
            return (
              <button key={i} disabled={answered} onClick={() => toggleMulti(i)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors text-slate-800 flex items-center gap-3 ${s}`}>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                <span className={`w-5 h-5 rounded border flex-shrink-0 ${picked ? "bg-green-500 border-green-500" : "border-slate-400"}`} />
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
            className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-slate-800 ${answered ? (right ? "border-green-500 bg-green-50" : "border-rose-400 bg-rose-50") : "border-slate-300 focus:border-green-500"}`}
          />
          {answered && !right && (
            <p className="mt-2 text-sm text-slate-600">Верный ответ: <b className="text-green-700">{task.answer}</b></p>
          )}
        </div>
      )}

      {task.type === "sequence" && (
        <div className="mt-5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && onCheck()}
            disabled={answered}
            inputMode="numeric"
            placeholder="Впиши цифры без пробелов, например 213"
            className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-slate-800 tracking-widest ${answered ? (right ? "border-green-500 bg-green-50" : "border-rose-400 bg-rose-50") : "border-slate-300 focus:border-green-500"}`}
          />
          {answered && !right && (
            <p className="mt-2 text-sm text-slate-600">Верный ответ: <b className="text-green-700">{task.answer}</b></p>
          )}
        </div>
      )}

      {task.type === "essay" && (
        <div className="mt-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={answered}
            rows={4}
            placeholder="Напиши свой ответ (можно кратко, своими словами)"
            className="w-full px-4 py-3 rounded-xl border-2 outline-none text-slate-800 border-slate-300 focus:border-green-500 resize-none"
          />
          {answered && (
            <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Эталонный ответ</p>
              <p className="text-sm text-slate-800 leading-relaxed">{task.answer}</p>
              {task.criteria && (
                <>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mt-3 mb-1">Критерии</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{task.criteria}</p>
                </>
              )}
            </div>
          )}
          {awaitingSelfCheck && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 mb-2">Сравни со своим ответом — похоже?</p>
              <div className="flex gap-3">
                <button onClick={() => onMarkSelf(true)} className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-2.5 rounded-xl transition-colors">Да, похоже</button>
                <button onClick={() => onMarkSelf(false)} className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold py-2.5 rounded-xl transition-colors">Не совсем</button>
              </div>
            </div>
          )}
        </div>
      )}

      {answered && !awaitingSelfCheck && (
        <div className={`mt-4 text-sm font-medium ${right ? "text-green-700" : "text-rose-600"}`}>
          {right ? "Верно" : "Неверно"}
        </div>
      )}
    </div>
  );
}

export function GreenBlob({ className = "" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
    >
      <path d="M100 0 C88 5 78 20 88 37 C100 57 78 65 82 82 C88 100 70 100 70 100 L100 100 Z" fill="#8fe0a3" />
    </svg>
  );
}

function OpenBadge() {
  return (
    <svg viewBox="0 0 10 10" className="w-3 h-3 text-slate-400 group-hover:text-green-600 transition-colors shrink-0" fill="none">
      <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
        active ? "bg-gradient-to-br from-green-200 to-green-400 text-slate-900 border-transparent" : "bg-white text-slate-700 border-slate-300 hover:border-green-400"
      }`}>{children}</button>
  );
}

function SectionCard({ active, onClick, icon, name, n, max }) {
  return (
    <button
      onClick={onClick}
      className={`h-full text-left p-3.5 rounded-xl border transition-colors ${
        active ? "bg-gradient-to-br from-green-200 to-green-400 border-transparent" : "bg-white border-slate-200 hover:border-green-400"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl leading-none">{icon}</span>
        <span className={`text-xs font-semibold ${active ? "text-slate-700" : "text-slate-400"}`}>{n}</span>
      </div>
      <p
        className={`text-sm leading-snug ${active ? "text-slate-900" : "text-slate-800"}`}
        style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700 }}
      >
        {name}
      </p>
    </button>
  );
}
