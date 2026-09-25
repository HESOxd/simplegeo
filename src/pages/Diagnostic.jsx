import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { TASKS } from "../data.js";
import VariantRunner from "../VariantRunner.jsx";
import NotFound from "./NotFound.jsx";
import { Shell, PrimaryButton, SecondaryButton } from "./Trainer.jsx";
import { Icon } from "../brand/Icon.jsx";
import { Mascot } from "../brand/Mascot.jsx";
import {
  DIAGNOSTIC_BLOCKS,
  DIAGNOSTIC_TOTAL,
  buildDiagnosticSet,
  blockTrafficLight,
  summarizeBlocks,
  rankDiagnosticBlocks,
  encodeResult,
  decodeResult,
  loadDiagHistory,
  pushDiagHistory,
  todayISO,
  blockExamPoints,
} from "../diagnosticBuilder.js";

// Личный аккаунт для ?text= (канал prostayageo не подходит). Заполнить перед продом.
const TELEGRAM_CONTACT = "hesoxd";

const SHORT_NAME = {
  topo: "топография",
  maps: "карты",
  climate: "климат",
  nature: "природа",
  people: "население",
  world: "мир",
  regions: "регионы",
};

// Светофор блока — три семантических состояния бренда (correct / warning /
// wrong) в раскладке sg-feedback: светлая подложка + полоса слева 4 px.
//
// Состояние продублировано словом и иконкой, а не только цветом: брендбук —
// «состояния всегда дублируются иконкой ✓/✕ и словом», ~8% мужчин плохо
// различают красный и зелёный. У бренда нет иконки-предупреждения, поэтому у
// жёлтого только слово — этого достаточно, чтобы не опираться на цвет.
const LIGHT_STYLES = {
  green: {
    card: "bg-brand-100 shadow-[inset_4px_0_0_var(--sg-correct)]",
    badge: "bg-brand text-white",
    label: "Уверенно",
    labelColor: "text-brand-800",
    icon: "check",
  },
  yellow: {
    card: "bg-warn-100 shadow-[inset_4px_0_0_var(--sg-warning-700)]",
    badge: "bg-warn text-white",
    label: "Есть ошибка",
    // не text-warn: #9A6200 на warn-100 даёт 4,47:1 — ниже AA для 13 px.
    // Жёлтый цвет несут полоса слева и бейдж, слово — чернилами.
    labelColor: "text-ink",
    icon: null,
  },
  red: {
    card: "bg-wrong-100 shadow-[inset_4px_0_0_var(--sg-wrong)]",
    badge: "bg-wrong text-white",
    label: "Слабое место",
    labelColor: "text-wrong",
    icon: "cross",
  },
};

const LIGHT_ORDER = { red: 0, yellow: 1, green: 2 };

function firstTrainPos(answers, blockKey) {
  const wrong = answers?.find((a) => a.task?.blockKey === blockKey && !a.right);
  if (wrong) return wrong.task.pos;
  const any = answers?.find((a) => a.task?.blockKey === blockKey);
  if (any) return any.task.pos;
  return DIAGNOSTIC_BLOCKS.find((b) => b.key === blockKey)?.positions[0];
}

function telegramText(result, code) {
  const weak = rankDiagnosticBlocks(result.blocks).filter((b) => b.wrong > 0).slice(0, 2);
  const weakPretty = weak.length
    ? weak.map((b) => `${SHORT_NAME[b.key] || b.key} (${b.ok}/${b.total})`).join(", ")
    : "нет явных слабых блоков";
  const planPos = weak[0]
    ? firstTrainPos(null, weak[0].key)
    : DIAGNOSTIC_BLOCKS[0].positions[0];
  return `Привет! Прошёл диагностику на simplegeo. Сейчас слабее: ${weakPretty}. План: начать с тренировки №${planPos}. Результат: https://simplegeo.ru/tasks/diagnostic/result?r=${code}`;
}

function findPrevious(result) {
  const hist = loadDiagHistory();
  if (!hist.length) return null;
  if (!result) return hist[0];
  const same =
    hist[0]?.date === result.date &&
    JSON.stringify(hist[0]?.blocks) === JSON.stringify(result.blocks);
  return same ? hist[1] || null : hist[0];
}

function correctAnswerLabel(task) {
  if (task.type === "short") return Array.isArray(task.answer) ? task.answer.join(" / ") : task.answer;
  if (task.type === "sequence") return task.answer;
  if (task.type === "single") {
    return task.options ? task.options[task.correct] : `вариант ${task.correct + 1}`;
  }
  if (task.type === "multi") return task.correct.map((ci) => task.options[ci]).join(", ");
  return task.answer;
}

function headlineFor(result, totalOk, totalAll) {
  const ranked = rankDiagnosticBlocks(result.blocks);
  const allGreen = ranked.every((b) => b.wrong === 0);
  if (allGreen) {
    return {
      title: "Сильных просадок нет — во всех блоках есть опора.",
      sub: "Имеет смысл пробовать полный вариант: так проверишь выносливость на 30 заданиях.",
    };
  }
  if (totalOk === 0) {
    return {
      title: "Сейчас много нулей — так бывает на первом срезе.",
      sub: "Диагностика не ставит оценку. Она показывает порядок учёбы. Начни с одного блока — остальное подождёт.",
    };
  }
  const worst = ranked.filter((b) => b.wrong > 0).slice(0, 2);
  const names = worst.map((b) => SHORT_NAME[b.key] || b.title).join(" и ");
  return {
    title: `Пока слабее всего — ${names}.`,
    sub: "Это не оценка за ОГЭ, а карта, с чего начать тренировку на этой неделе.",
  };
}

/** Разбор заданий после итога (только если есть answers с попытки). */
function DiagnosticReview({ answers, onBack }) {
  return (
    <Shell>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-ink-muted hover:text-ink mb-4"
      >
        ← К итогам
      </button>
      <h2 className="text-xl text-ink mb-4">
        Разбор заданий
      </h2>
      <div className="flex flex-col gap-2.5">
        {answers.map((a, i) => (
          <div
            key={i}
            className={`rounded-lg border-2 p-3.5 ${
              a.right ? "border-brand-100 bg-brand-100/40" : "border-wrong bg-wrong-100/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-ink">
                {i + 1}. №{a.task.pos} · {a.task.q}
              </p>
              <span
                className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  a.right ? "bg-brand-100 text-brand-800" : "bg-wrong-100 text-wrong"
                }`}
              >
                {a.right ? "верно" : "пока не сошлось"}
              </span>
            </div>
            {!a.right && (
              <p className="text-sm text-ink-muted mt-2">
                Верный ответ:{" "}
                <b className="text-brand">{correctAnswerLabel(a.task)}</b>
              </p>
            )}
            <Link
              to={`/tasks/by-number?pos=${a.task.pos}`}
              className="mt-2 inline-flex text-sm font-semibold text-brand hover:text-brand-800"
            >
              Тренировать №{a.task.pos} →
            </Link>
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Экран результата диагностики — после прохождения и по ссылке ?r= */
export function DiagnosticResult({ result, answers = null, previous = null, onRestart }) {
  const [showReview, setShowReview] = useState(false);
  const code = encodeResult(result);
  const tgHref = `https://t.me/${TELEGRAM_CONTACT}?text=${encodeURIComponent(telegramText(result, code))}`;

  const totalAll = DIAGNOSTIC_BLOCKS.reduce((s, b) => {
    const [, t] = result.blocks[b.key] || [0, b.count];
    return s + t;
  }, 0);
  const totalOk = DIAGNOSTIC_BLOCKS.reduce((s, b) => {
    const [ok] = result.blocks[b.key] || [0, 0];
    return s + ok;
  }, 0);

  const cards = DIAGNOSTIC_BLOCKS.map((b) => {
    const [ok, total] = result.blocks[b.key] || [0, b.count];
    const light = blockTrafficLight(ok, total);
    const posLabel = answers
      ? answers.filter((a) => a.task?.blockKey === b.key).map((a) => a.task.pos).sort((x, y) => x - y)
      : b.positions;
    let historyNote = null;
    if (previous?.blocks?.[b.key]) {
      const [pOk, pTotal] = previous.blocks[b.key];
      if (ok > pOk) historyNote = `В прошлый раз: ${pOk}/${pTotal} → стало лучше`;
      else if (ok < pOk) historyNote = `В прошлый раз: ${pOk}/${pTotal} → стало хуже`;
    }
    const examMax = blockExamPoints(b);
    return {
      ...b,
      ok,
      total,
      wrong: total - ok,
      light,
      posLabel,
      historyNote,
      trainPos: firstTrainPos(answers, b.key),
      examMax,
    };
  }).sort((a, b) => LIGHT_ORDER[a.light] - LIGHT_ORDER[b.light] || b.wrong - a.wrong || b.examMax - a.examMax);

  const { title: headline, sub: subline } = headlineFor(result, totalOk, totalAll);
  const primaryTrain = cards.find((c) => c.wrong > 0)?.trainPos
    || cards[0]?.trainPos
    || 10;

  const [copied, setCopied] = useState(false);
  function copyLink() {
    const url = `${window.location.origin}/tasks/diagnostic/result?r=${code}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  if (showReview && answers?.length) {
    return <DiagnosticReview answers={answers} onBack={() => setShowReview(false)} />;
  }

  return (
    <Shell>
      <div className="text-center mb-8">
        <Mascot name="finish" className="w-24 h-24 object-contain mx-auto mb-1" />
        <p className="font-data text-label uppercase text-brand">Результат диагностики</p>
        <p className="mt-3 text-lg text-ink font-medium leading-snug">{headline}</p>
        <p className="mt-2 text-sm text-ink-muted leading-snug max-w-lg mx-auto">{subline}</p>
        {totalOk === 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            {totalOk} из {totalAll} в этой попытке · можно пройти ещё раз после практики
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5 mb-8">
        {cards.map((c) => {
          const st = LIGHT_STYLES[c.light];
          return (
            <div key={c.key} className={`rounded-lg ${st.card} p-3.5 pl-5`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`inline-flex items-center gap-1 font-data font-semibold text-[13px] uppercase tracking-[.04em] ${st.labelColor}`}>
                    {st.icon && <Icon name={st.icon} className="w-3.5 h-3.5" />}
                    {st.label}
                  </p>
                  <p className="font-semibold text-ink mt-1">{c.title}</p>
                  <p className="text-sm text-ink-muted mt-0.5">
                    задания №{c.posLabel.join(", ")} · {c.ok}/{c.total}
                  </p>
                  <p className="text-xs text-ink-muted mt-1 leading-snug">
                    С темой связаны задания примерно на {c.examMax} из 31 первичных баллов на ОГЭ — ориентир тем, не прогноз.
                  </p>
                  {c.historyNote && (
                    <p className="text-xs text-ink-muted mt-1">{c.historyNote}</p>
                  )}
                </div>
                <span className={`shrink-0 font-data font-semibold text-[15px] tabular-nums px-2.5 py-1 rounded-sm ${st.badge}`}>
                  {c.ok}/{c.total}
                </span>
              </div>
              <Link
                to={`/tasks/by-number?pos=${c.trainPos}`}
                className="mt-3 inline-flex text-sm font-semibold text-brand hover:text-brand-800"
              >
                Тренировать №{c.trainPos} →
              </Link>
            </div>
          );
        })}
      </div>

      {totalOk === 0 ? (
        <Link
          to={`/tasks/by-number?pos=${primaryTrain}`}
          className="flex w-full items-center justify-center text-center bg-brand hover:bg-brand-800 text-white font-bold py-3.5 rounded-md shadow-step active:shadow-step-pressed active:translate-y-[2px] transition-[transform,box-shadow,background-color] duration-[120ms] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-300 focus-visible:outline-offset-[3px] mb-3"
        >
          Тренировать №{primaryTrain}
        </Link>
      ) : (
        <a
          href={tgHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center text-center bg-brand hover:bg-brand-800 text-white font-bold py-3.5 rounded-md shadow-step active:shadow-step-pressed active:translate-y-[2px] transition-[transform,box-shadow,background-color] duration-[120ms] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-300 focus-visible:outline-offset-[3px] mb-3"
        >
          Разобрать результат с Юрием
        </a>
      )}

      {totalOk === 0 && (
        <a
          href={tgHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-sm font-medium text-ink-muted hover:text-ink py-2 mb-1"
        >
          Разобрать с Юрием — спокойно, без стыда
        </a>
      )}

      {answers?.length ? (
        <SecondaryButton onClick={() => setShowReview(true)} className="w-full py-3 mb-3">
          Разобрать задания
        </SecondaryButton>
      ) : (
        <p className="text-center text-sm text-ink-muted mb-3">
          Чтобы увидеть эталоны по заданиям,{" "}
          <Link to="/tasks/diagnostic" className="font-semibold text-brand hover:text-brand-800">
            пройди диагностику
          </Link>
          .
        </p>
      )}

      {onRestart && (
        <SecondaryButton onClick={onRestart} className="w-full py-3 mb-3">
          Пройти ещё раз
        </SecondaryButton>
      )}

      <button
        type="button"
        onClick={copyLink}
        className="w-full text-center text-sm font-medium text-ink-muted hover:text-ink py-2"
      >
        {copied ? "Ссылка скопирована" : "Скопировать ссылку на результат"}
      </button>

      <Link to="/tasks" className="mt-4 block text-center text-sm text-ink-muted hover:text-ink">
        ← К тренажёру
      </Link>
    </Shell>
  );
}

/** Мост: один раз пишет историю и подменяет URL на ?r= */
function ResultBridge({ answers, onRestart, date }) {
  const blocks = useMemo(() => summarizeBlocks(answers), [answers]);
  const result = useMemo(() => ({ date, blocks, version: 2 }), [date, blocks]);
  const saved = useRef(false);
  const [previous, setPrevious] = useState(null);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    const prev = pushDiagHistory(result);
    setPrevious(prev);
    const code = encodeResult(result);
    try {
      window.history.replaceState(null, "", `/tasks/diagnostic/result?r=${code}`);
    } catch {
      /* ignore */
    }
  }, [result]);

  return (
    <DiagnosticResult
      result={result}
      answers={answers}
      previous={previous}
      onRestart={onRestart}
    />
  );
}

function DiagnosticQuiz() {
  const date = useMemo(() => todayISO(), []);
  const [deck, setDeck] = useState(() => buildDiagnosticSet(TASKS));
  const [runKey, setRunKey] = useState(0);

  function restart() {
    setDeck(buildDiagnosticSet(TASKS));
    setRunKey((k) => k + 1);
    try {
      window.history.replaceState(null, "", "/tasks/diagnostic");
    } catch {
      /* ignore */
    }
  }

  return (
    <VariantRunner
      key={runKey}
      deck={deck}
      backTo="/tasks"
      onRestart={restart}
      persistKey={`diag:v2:${date}`}
      revealMode="deferred"
      renderResult={({ answers, onRestart: restartFromRunner }) => (
        <ResultBridge answers={answers} onRestart={restartFromRunner} date={date} />
      )}
    />
  );
}

export default function Diagnostic() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="flex justify-center px-4 min-h-[calc(100dvh-3.75rem)]">
        <div className="w-full max-w-4xl flex flex-col py-3">
          <Link
            to="/tasks"
            className="text-sm text-ink-muted hover:text-ink self-start"
          >
            ← К тренажёру по разделам
          </Link>

          {/* Белая карточка под текстом: на фоне страницы изолинии, а брендбук
              запрещает их под текстом без подложки (линия шла через заголовок). */}
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className="w-full max-w-2xl flex flex-col items-center text-center bg-surface border border-line rounded-lg shadow-card px-5 py-8 sm:px-10 sm:py-10">
              <Mascot
                name="welcome"
                className="w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] md:w-[180px] md:h-[180px] object-contain mb-4"
              />
              <p className="font-data text-label text-brand uppercase">
                ОГЭ · География
              </p>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl text-ink mt-2 leading-tight max-w-2xl"
              >
                Узнай свои слабые места
              </h1>
              <p className="text-ink-muted mt-3 text-base sm:text-lg leading-snug max-w-xl">
                {DIAGNOSTIC_TOTAL} заданий · около 10–12 минут · отчёт по семи блокам.
                Правильные ответы покажем после прохождения. Без таймера и без прогноза оценки.
              </p>
              <PrimaryButton
                onClick={() => setStarted(true)}
                className="w-full max-w-md mt-6 min-h-[3.25rem] px-6 py-3.5 text-lg sm:text-xl font-semibold"
              >
                Начать диагностику
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <DiagnosticQuiz />;
}

/** /tasks/diagnostic/result?r=… — результат по ссылке без прохождения. */
export function DiagnosticResultPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const code = params.get("r");
  const result = useMemo(() => decodeResult(code || ""), [code]);
  const previous = useMemo(() => findPrevious(result), [result]);

  if (!result) return <NotFound />;

  return (
    <DiagnosticResult
      result={result}
      previous={previous}
      onRestart={() => navigate("/tasks/diagnostic")}
    />
  );
}
