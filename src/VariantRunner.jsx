import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isTaskRight } from "./utils.js";
import { useTaskScreen } from "./brand/PageBackground.jsx";
import { MASCOT } from "./brand/mascot.js";
import { TaskCard, Shell, ProgressBar, PrimaryButton, DarkButton } from "./pages/Trainer.jsx";

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
// renderResult — необязательная подмена экрана разбора (для диагностики);
// по умолчанию — стандартный разбор варианта. Variant/Weekly не передают проп.
export default function VariantRunner({ deck, backTo, onRestart, persistKey, renderResult }) {
  const saved = persistKey ? loadProgress(persistKey) : null;
  const restoredAnswers = (saved?.answers || [])
    .map((a) => ({ ...a, task: deck.find((t) => t.id === a.taskId) }))
    .filter((a) => a.task);

  const [screen, setScreen] = useState(saved?.screen || "quiz");
  // Под текстом задания изолиний нет (брендбук). Задания видны при прохождении
  // и в разборе; у диагностики вместо разбора свой итог без заданий.
  useTaskScreen(!(screen === "review" && typeof renderResult === "function"));
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
    if (typeof renderResult === "function") {
      return renderResult({ answers, deck, onRestart, backTo });
    }
    const correctCount = answers.filter((a) => a.right).length;
    const pct = Math.round((correctCount / answers.length) * 100);
    return (
      <Shell>
        <div className="text-center mb-8">
          <img src={MASCOT.finish} alt="" className="w-24 h-24 object-contain mx-auto mb-1" />
          <p className="font-data text-label uppercase text-brand">Результат варианта</p>
          <p className="mt-3 text-6xl font-bold text-ink">{correctCount}<span className="text-2xl text-ink-muted">/{answers.length}</span></p>
          <p className="mt-1 text-lg text-ink-muted">{pct}% верных</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {answers.map((a, i) => (
            <div key={i} className={`rounded-lg border-2 p-3 ${a.right ? "border-brand-100 bg-brand-100/40" : "border-wrong bg-wrong-100/40"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ink">{i + 1}. {a.task.q}</p>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${a.right ? "bg-brand-100 text-brand-800" : "bg-wrong-100 text-wrong"}`}>
                  {a.right ? "верно" : "неверно"}
                </span>
              </div>
              {!a.right && a.task.type === "essay" && (
                <div className="mt-2 p-3 rounded-md bg-surface border border-line">
                  <p className="font-data text-label text-brand uppercase mb-1">Эталонный ответ</p>
                  <p className="text-sm text-ink leading-relaxed">{a.task.answer}</p>
                </div>
              )}
              {!a.right && a.task.type !== "essay" && (
                <p className="text-sm text-ink-muted mt-2">
                  Правильный ответ: <b className="text-brand">
                    {a.task.type === "short" ? (Array.isArray(a.task.answer) ? a.task.answer.join(" / ") : a.task.answer) :
                     a.task.type === "sequence" ? a.task.answer :
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
            <PrimaryButton onClick={onRestart} className="flex-1 py-3">Новый вариант</PrimaryButton>
          )}
          <Link to={backTo} className="flex-1 text-center bg-surface border border-line-strong hover:bg-sunk text-ink font-semibold py-3 rounded-md transition-colors">Назад</Link>
        </div>
      </Shell>
    );
  }

  if (!task) return null;

  const right = isTaskRight(task, currentAnswer);
  return (
    <Shell>
      <div className="mb-4">
        <div className="flex justify-between font-data font-semibold text-sm tabular-nums text-ink-muted mb-2">
          <span>Задание {pos + 1} из {deck.length}</span>
          <span>Верно: {answers.filter((a) => a.right).length}</span>
        </div>
        <ProgressBar current={pos} total={deck.length} />
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
          <DarkButton onClick={check} className="w-full py-3">Проверить</DarkButton>
        ) : canAdvance ? (
          <PrimaryButton onClick={next} className="w-full py-3">
            {pos + 1 < deck.length ? "Дальше" : "К разбору"}
          </PrimaryButton>
        ) : null}
      </div>
    </Shell>
  );
}
