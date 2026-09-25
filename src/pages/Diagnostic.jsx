import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { TASKS } from "../data.js";
import VariantRunner from "../VariantRunner.jsx";
import NotFound from "./NotFound.jsx";
import { Shell, PrimaryButton, SecondaryButton } from "./Trainer.jsx";
import { Icon } from "../brand/Icon.jsx";
import { MASCOT } from "../brand/mascot.js";
import {
  DIAGNOSTIC_BLOCKS,
  DIAGNOSTIC_TOTAL,
  buildDiagnosticSet,
  blockTrafficLight,
  summarizeBlocks,
  encodeResult,
  decodeResult,
  loadDiagHistory,
  pushDiagHistory,
  todayISO,
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

function rankedBlocks(blocks) {
  return DIAGNOSTIC_BLOCKS.map((b) => {
    const [ok, total] = blocks[b.key] || [0, b.count];
    return { ...b, ok, total, wrong: total - ok, light: blockTrafficLight(ok, total) };
  }).sort((a, b) => b.wrong - a.wrong || a.ok / a.total - b.ok / b.total);
}

function firstTrainPos(answers, blockKey) {
  const wrong = answers?.find((a) => a.task?.blockKey === blockKey && !a.right);
  if (wrong) return wrong.task.pos;
  const any = answers?.find((a) => a.task?.blockKey === blockKey);
  if (any) return any.task.pos;
  return DIAGNOSTIC_BLOCKS.find((b) => b.key === blockKey)?.positions[0];
}

function telegramText(result, code) {
  const weak = rankedBlocks(result.blocks).filter((b) => b.wrong > 0).slice(0, 2);
  const weakPretty = weak.length
    ? weak.map((b) => `${SHORT_NAME[b.key] || b.key} (${b.ok}/${b.total})`).join(", ")
    : "нет явных слабых блоков";
  return `Привет! Прошёл диагностику на simplegeo. Слабые блоки: ${weakPretty}. Результат: https://simplegeo.ru/tasks/diagnostic/result?r=${code}`;
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

/** Экран результата диагностики — после прохождения и по ссылке ?r= */
export function DiagnosticResult({ result, answers = null, previous = null, onRestart }) {
  const code = encodeResult(result);
  const tgHref = `https://t.me/${TELEGRAM_CONTACT}?text=${encodeURIComponent(telegramText(result, code))}`;

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
    return {
      ...b,
      ok,
      total,
      wrong: total - ok,
      light,
      posLabel,
      historyNote,
      trainPos: firstTrainPos(answers, b.key),
    };
  }).sort((a, b) => LIGHT_ORDER[a.light] - LIGHT_ORDER[b.light] || b.wrong - a.wrong);

  const worst = rankedBlocks(result.blocks).slice(0, 2);
  const riskPoints = worst.reduce((s, b) => s + b.examPoints, 0);
  const headline =
    worst.every((b) => b.wrong === 0)
      ? "Сильных просадок нет — все блоки закрыты."
      : `Слабее всего — ${worst.map((b) => b.title).join(" и ")}. На экзамене это до ${riskPoints} баллов`;

  const [copied, setCopied] = useState(false);
  function copyLink() {
    const url = `${window.location.origin}/tasks/diagnostic/result?r=${code}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <Shell>
      <div className="text-center mb-8">
        <img src={MASCOT.finish} alt="" className="w-24 h-24 object-contain mx-auto mb-1" />
        <p className="font-data text-label uppercase text-brand">Результат диагностики</p>
        <p className="mt-3 text-lg text-ink font-medium leading-snug">{headline}</p>
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

      <a
        href={tgHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center text-center bg-brand hover:bg-brand-800 text-white font-bold py-3.5 rounded-md shadow-step active:shadow-step-pressed active:translate-y-[2px] transition-[transform,box-shadow,background-color] duration-[120ms] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-300 focus-visible:outline-offset-[3px] mb-3"
      >
        Разобрать результат с Юрием
      </a>

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
  const result = useMemo(() => ({ date, blocks }), [date, blocks]);
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
      persistKey={`diag:${date}`}
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

          <div className="flex-1 flex flex-col items-center justify-center text-center gap-0">
            <img
              src={MASCOT.welcome}
              alt=""
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
              {DIAGNOSTIC_TOTAL} заданий · около 20 минут · отчёт по семи блокам экзамена.
              Без таймера и без прогноза оценки — только карта, где теряются баллы.
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
