import React, { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TASKS } from "../data.js";
import { buildPositionPools, POSITION_TOPIC } from "../positionClassifier.js";
import { shuffle, isTaskRight } from "../utils.js";
import { useTaskScreen } from "../brand/PageBackground.jsx";
import { MASCOT } from "../brand/mascot.js";
import { Shell, Chip, TaskCard, ProgressBar, PrimaryButton, DarkButton } from "./Trainer.jsx";

// Тренировка по конкретному номеру задания (1-30), как на sdamgia —
// в отличие от "полного варианта" тут выбираешь ОДНУ позицию и решаешь
// подряд несколько заданий именно этого типа. Пул кандидатов на каждую
// позицию — из src/positionClassifier.js (тот же классификатор, что
// использует сборка полного варианта).
// Query ?pos=N сразу открывает экран setup для этой позиции (из диагностики).

function initialFromQuery(searchParams) {
  const raw = searchParams.get("pos");
  if (raw == null) return { screen: "grid", pos: null };
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 30) return { screen: "grid", pos: null };
  return { screen: "setup", pos: n };
}

export default function ByPosition() {
  const pools = useMemo(() => buildPositionPools(TASKS), []);
  const [searchParams] = useSearchParams();
  const [screen, setScreen] = useState(() => initialFromQuery(searchParams).screen); // grid | setup | quiz | result
  useTaskScreen(screen === "quiz"); // под текстом задания изолиний нет
  const [pos, setPos] = useState(() => initialFromQuery(searchParams).pos);
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
        <Link to="/tasks" className="text-sm text-ink-muted hover:text-ink mb-4 inline-block">← К тренажёру по разделам</Link>
        <div className="mb-6">
          <p className="font-data text-label text-brand uppercase">ОГЭ · География</p>
          <h1 className="text-3xl font-bold text-ink mt-1">По номеру задания</h1>
          <p className="text-ink-muted mt-2">
            Выбери номер — потренируешься только на заданиях именно этого типа, как на настоящем экзамене под этим номером.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((p) => {
            const n = (pools[p] || []).length;
            return (
              <button
                key={p}
                onClick={() => n > 0 && openPos(p)}
                disabled={n === 0}
                className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors ${
                  n === 0
                    ? "border-line text-ink-muted cursor-not-allowed"
                    : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <span
                  className={`shrink-0 w-8 h-8 rounded-sm flex items-center justify-center text-sm font-bold ${
                    n === 0 ? "bg-sunk text-ink-muted" : "bg-sunk text-ink"
                  }`}
                >
                  {p}
                </span>
                <span className="flex-1 text-sm font-medium text-ink leading-snug">{POSITION_TOPIC[p]}</span>
                <span className="shrink-0 text-xs text-ink-muted">{n}</span>
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
        <button onClick={() => setScreen("grid")} className="text-sm text-ink-muted hover:text-ink mb-4 inline-block">← Все номера</button>
        <div className="mb-8">
          <p className="font-data text-label text-brand uppercase">Задание {pos}</p>
          <h1 className="text-2xl font-bold text-ink mt-1">{POSITION_TOPIC[pos]}</h1>
          <p className="text-ink-muted mt-2">В базе {pool.length} заданий этого типа.</p>
        </div>
        <p className="text-sm font-medium text-ink mb-2">Сколько вопросов</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {options.map((n) => (
            <Chip key={n} active={count === n} onClick={() => setCount(n)}>{n === "all" ? "Все" : n}</Chip>
          ))}
        </div>
        <PrimaryButton onClick={start} className="w-full py-3.5">
          Начать
        </PrimaryButton>
      </Shell>
    );
  }

  if (screen === "result") {
    return (
      <Shell>
        <div className="text-center py-6">
          <img src={MASCOT.finish} alt="" className="w-24 h-24 object-contain mx-auto mb-1" />
          <p className="font-data text-label uppercase text-brand">Задание {pos} · Результат</p>
          <p className="mt-3 text-6xl font-bold text-ink">{correctCount}<span className="text-2xl text-ink-muted">/{deck.length}</span></p>
          <p className="mt-1 text-lg text-ink-muted">{Math.round((correctCount / deck.length) * 100)}% верных</p>
          <div className="mt-8 flex gap-3">
            <PrimaryButton onClick={start} className="flex-1 py-3">Ещё раз</PrimaryButton>
            <button onClick={() => setScreen("grid")} className="flex-1 bg-surface border border-line-strong hover:bg-sunk text-ink font-semibold py-3 rounded-md transition-colors">Все номера</button>
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
        <div className="flex justify-between font-data font-semibold text-sm tabular-nums text-ink-muted mb-2">
          <span>Задание {pos} · {idx + 1} из {deck.length}</span>
          <span>Верно: {correctCount}</span>
        </div>
        <ProgressBar current={idx} total={deck.length} />
      </div>

      <TaskCard
        task={task} answered={answered} right={right} kicker={POSITION_TOPIC[pos]}
        single={single} setSingle={setSingle}
        multi={multi} toggleMulti={toggleMulti}
        text={text} setText={setText}
        selfRight={selfRight} onMarkSelf={markSelf}
        onCheck={check}
      />

      <div className="mt-5">
        {!answered ? (
          <DarkButton onClick={check} className="w-full py-3">Проверить</DarkButton>
        ) : canAdvance ? (
          <PrimaryButton onClick={next} className="w-full py-3">
            {idx + 1 < deck.length ? "Дальше" : "Итог"}
          </PrimaryButton>
        ) : null}
      </div>
    </Shell>
  );
}
