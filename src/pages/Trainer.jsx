import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { TASKS, SECTIONS } from "../data.js";
import { norm, shuffle, isTaskRight } from "../utils.js";
import { Icon } from "../brand/Icon.jsx";
import { useTaskScreen } from "../brand/PageBackground.jsx";
import { MASCOT } from "../brand/mascot.js";

const PASSAGE_INTRO_RE = /^Прочитайте текст и выполните задания\.?\s*/;

// Бланковые ярлыки ФИПИ после «?» (строка ответа на бланке, не часть вопроса).
// Whitelist: только географические/админ. типы; answer в банке их не содержит.
const BLANK_TAIL_LABELS =
  "океан|море|край|область|Республика|горы|залив|низменность|возвышенность|магистраль|автономный\\s+округ";
const BLANK_TAIL_RE = new RegExp(`\\?\\s+(?:${BLANK_TAIL_LABELS})\\s*$`, "i");

// Некоторые задания хранят перечисление "1) А 2) Б 3) В" одной строкой без
// переносов (так исходно отдано FIPI) — разносим по строкам для читаемости.
// Декоративная нумерация без содержимого (варианты-картинки уже отрисованы
// отдельно, см. optionImages) вида "1) 2) 3) 4)" — просто убираем.
// Бланковые хвосты («? океан», «. %») срезаем только при показе — data.js не трогаем.
export function formatQuestionText(q) {
  if (!q) return q;
  let out = q.replace(/\s*(?:\d\)\s*){2,}$/, (m) => (/[^\d)\s]/.test(m) ? m : ""));
  out = out.replace(/\s(\d\))/g, "\n$1");
  // «…в тексте? океан» → «…в тексте?»
  out = out.replace(BLANK_TAIL_RE, "?");
  // Единица измерения на бланке после инструкции («…до целого числа. %»).
  // Только «. %» — голый « %» после цифр таблицы (%-столбец) не трогаем.
  out = out.replace(/\.\s*%\s*$/, ".");
  return out.trim();
}

// Короткие задания-подводки вида "Определите страну по её краткому описанию.
// <длинное описание>" — визуально отделяем первую фразу как заголовок от
// самого описания (иначе всё сливается в один сплошной абзац).
function renderQuestion(q) {
  const text = formatQuestionText(q);
  const m = text.match(/^([^\n]{1,70}?[.:])\s+([\s\S]{40,})$/);
  if (!m) return text;
  return (
    <>
      {m[1]}
      <br />
      <span className="font-normal text-ink-muted">{m[2]}</span>
    </>
  );
}

// Акцентный текст («Узнать больше →», цена). Раньше был градиентом — брендбук
// запрещает градиенты и «другие зелёные»: зелёный один, #17784A. Имя оставлено,
// чтобы не трогать места использования.
export const GRADIENT_TEXT = { color: "var(--sg-brand)" };

// Иконки разделов — таблица «Раздел сайта → Иконка» из брендбука.
// Раньше здесь были эмодзи: они по-разному выглядят на Mac и Windows и не
// перекрашиваются под активное состояние карточки.
const SECTION_ICONS = {
  all: "globe",
  "1": "ship",
  "2": "graticule",
  "3": "sun",
  "4": "mountain",
  "5": "map",
  "6": "lightning",
  "7": "factory",
};

export default function Trainer() {
  const [screen, setScreen] = useState("home"); // home | quiz | result
  // Брендбук: изолиний нет под текстом задания — на экране решения фон бумажный.
  useTaskScreen(screen === "quiz");
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
            to="/tasks/diagnostic"
            className="group flex items-center gap-3 mb-4 bg-surface border border-line hover:border-line-strong rounded-lg p-4 transition-colors"
          >
            <img src={MASCOT.welcome} alt="" className="w-12 h-12 object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink">Узнай свои слабые места</p>
              <p className="text-sm text-ink-muted mt-0.5">13 заданий · ~10–12 минут · ответы после</p>
            </div>
            <OpenBadge />
          </Link>

          <Link
            to="/tasks/weekly"
            className="group flex items-center justify-between mb-4 bg-surface border border-line hover:border-line-strong rounded-lg p-4 transition-colors"
          >
            <p className="font-semibold text-ink">Варианты недели</p>
            <OpenBadge />
          </Link>

          <Link
            to="/tasks/by-number"
            className="group flex items-center justify-between mb-4 bg-surface border border-line hover:border-line-strong rounded-lg p-4 transition-colors"
          >
            <p className="font-semibold text-ink">По номеру задания</p>
            <OpenBadge />
          </Link>

          <Link
            to="/tasks/demo-2027"
            className="group flex items-center justify-between mb-8 bg-surface border border-line hover:border-line-strong rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink">Демо-версия ОГЭ 2027</p>
              <span className="text-[11px] font-semibold text-brand bg-brand-100 rounded-full px-2 py-0.5">официально, ФИПИ</span>
            </div>
            <OpenBadge />
          </Link>

          <p className="text-sm font-medium text-ink mb-2">Раздел</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <SectionCard
              active={section === "all"}
              onClick={() => setSection("all")}
              icon={SECTION_ICONS.all}
              name="Все разделы"
              n={TASKS.length}
            />
            {sectionList.map((s) => (
              <SectionCard
                key={s.id}
                active={section === s.id}
                onClick={() => setSection(s.id)}
                icon={SECTION_ICONS[s.id] || "pin"}
                name={s.name}
                n={s.n}
              />
            ))}
          </div>

          <p className="text-sm font-medium text-ink mb-2">Сколько вопросов</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {[5, 10, 20, "all"].map((n) => (
              <Chip key={n} active={count === n} onClick={() => setCount(n)}>{n === "all" ? "Все" : n}</Chip>
            ))}
          </div>

          <PrimaryButton onClick={start} className="w-full py-3.5">
            Начать
          </PrimaryButton>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center gap-3 bg-surface rounded-lg border border-line p-4">
            <img src={MASCOT.welcome} alt="" className="w-14 h-14 object-contain flex-shrink-0" />
            <p className="text-sm text-ink-muted leading-snug">Привет! Выбери раздел слева и начинай — разберём вместе, если что-то пойдёт не так.</p>
          </div>

          <Link to="/about" className="block bg-surface rounded-lg border border-line p-5 hover:border-line-strong transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <img src="/photo.jpg" alt="Юрий" className="w-12 h-12 rounded-full object-cover border-2 border-brand-100" />
              <div>
                <p className="font-semibold text-ink">Юрий</p>
                <p className="text-xs text-ink-muted">Репетитор по географии</p>
              </div>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">3 года преподаю, 100+ учеников, средний балл на ОГЭ — 4,7.</p>
            <p className="text-sm font-medium mt-3" style={GRADIENT_TEXT}>Узнать больше →</p>
          </Link>

          <Link to="/course" className="block bg-surface rounded-lg border border-line overflow-hidden hover:border-line-strong transition-colors">
            <img src="/course-preview.jpg" alt="Полный гайд по решению заданий ОГЭ" className="w-full aspect-video object-contain bg-sunk border-b border-line" />
            <div className="p-5">
              <p className="font-semibold text-ink mb-1">Полный гайд по решению заданий ОГЭ</p>
              <p className="text-sm text-ink-muted leading-relaxed mb-3">Mind map по всем заданиям, примеры решений и лайфхаки.</p>
              <div className="flex items-center justify-between">
                <p className="flex items-baseline gap-2">
                  <span className="font-data font-semibold text-lg tabular-nums text-brand">1499 ₽</span>
                  <span className="font-data text-sm tabular-nums text-ink-muted line-through">3000 ₽</span>
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
          <img src={MASCOT.finish} alt="" className="w-24 h-24 object-contain mx-auto mb-1" />
          <p className="font-data text-label uppercase text-brand">Результат</p>
          <p className="mt-3 text-6xl font-bold text-ink">{correctCount}<span className="text-2xl text-ink-muted">/{deck.length}</span></p>
          <p className="mt-1 text-lg text-ink-muted">{pct}% верных · {verdict}</p>
          <div className="mt-8 flex gap-3">
            <PrimaryButton onClick={start} className="flex-1 py-3">Ещё раз</PrimaryButton>
            <button onClick={() => setScreen("home")} className="flex-1 bg-surface border border-line-strong hover:bg-sunk text-ink font-semibold py-3 rounded-md transition-colors">В меню</button>
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
        <div className="flex justify-between font-data font-semibold text-sm tabular-nums text-ink-muted mb-2">
          <span>Вопрос {pos + 1} из {deck.length}</span>
          <span>Верно: {correctCount}</span>
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
            {pos + 1 < deck.length ? "Дальше" : "Итог"}
          </PrimaryButton>
        ) : null}
      </div>
    </Shell>
  );
}

// ── переиспользуемая карточка задания (используется и в Trainer, и в Variant) ──
// Состояния варианта ответа — sg-answer из бренд-компонентов:
//   по умолчанию — тонкая рамка, при наведении темнеет;
//   выбран (до проверки) — чернильная рамка. НЕ зелёная: зелёный = «верно»,
//     раньше выбранный вариант выглядел точь-в-точь как правильный;
//   после проверки — верный зелёный, ошибочный красный, остальные приглушены.
// Рамка 2 px во всех состояниях, чтобы вариант не «прыгал» при выборе.
const ANSWER = {
  idle: "border-line hover:border-line-strong",
  selected: "border-ink",
  correct: "border-brand bg-brand-100 text-brand",
  wrong: "border-wrong bg-wrong-100 text-wrong",
  dim: "border-line opacity-[.55]",
};

// revealAnswers — показывать эталон и вердикт (false в диагностике deferred).
// locked — запретить менять ответ; по умолчанию = answered.
export function TaskCard({
  task, answered, right, single, setSingle, multi, toggleMulti, text, setText,
  selfRight, onMarkSelf, onCheck, kicker, revealAnswers, locked,
}) {
  const showReveal = revealAnswers ?? answered;
  const isLocked = locked ?? answered;
  const awaitingSelfCheck = task.type === "essay" && showReveal && selfRight === null;
  const [zoomedSrc, setZoomedSrc] = useState(null);
  return (
    <div className="bg-surface rounded-lg border border-line p-5 sm:p-6">
      <span className="inline-block text-xs font-semibold text-brand bg-brand-100 rounded-full px-2.5 py-1 mb-3">
        {kicker || SECTIONS[task.sec] || "Раздел " + task.sec}
        {task.type === "multi" && " · выбор нескольких"}
        {task.type === "short" && " · впиши ответ"}
        {task.type === "sequence" && " · впиши последовательность"}
        {task.type === "essay" && " · развёрнутый ответ"}
      </span>

      {task.passage && (
        <p className="mb-3 p-4 rounded-md bg-sunk border border-line text-[15px] text-ink leading-relaxed whitespace-pre-line">
          {task.passage.replace(PASSAGE_INTRO_RE, "")}
        </p>
      )}

      {/* Вопрос задания — это текст, который читают: Onest, а не Science Gothic.
          Глобальное правило для h1–h3 в index.css рассчитано на крупные заголовки
          страниц; брендбук разрешает Science Gothic только от 20 px. */}
      <h2 className="font-sans text-lg font-semibold text-ink leading-snug whitespace-pre-line">{renderQuestion(task.q)}</h2>

      {task.image && !task.image2 && (
        <img
          src={task.image} alt="иллюстрация к заданию — нажми, чтобы увеличить"
          onClick={() => setZoomedSrc(task.image)}
          className="mt-4 rounded-md border border-line max-h-64 object-contain cursor-zoom-in"
        />
      )}

      {task.image && task.image2 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <img
            src={task.image} alt="климатограмма — нажми, чтобы увеличить"
            onClick={() => setZoomedSrc(task.image)}
            className="rounded-md border border-line max-h-64 object-contain bg-surface cursor-zoom-in"
          />
          <img
            src={task.image2} alt="карта с пунктами — нажми, чтобы увеличить"
            onClick={() => setZoomedSrc(task.image2)}
            className="rounded-md border border-line max-h-64 object-contain bg-surface cursor-zoom-in"
          />
        </div>
      )}

      {zoomedSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
          onClick={() => setZoomedSrc(null)}
        >
          <img src={zoomedSrc} alt="" className="max-w-full max-h-full object-contain" />
          <button
            onClick={() => setZoomedSrc(null)}
            aria-label="Закрыть"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface/10 hover:bg-surface/20 text-white text-2xl leading-none flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      {task.table && (
        <div className="mt-4 overflow-x-auto rounded-md border border-line">
          <table className="w-full text-sm text-ink">
            <tbody>
              {task.table.split("\n").filter(Boolean).map((line, i) => (
                <tr key={i} className={i % 2 ? "bg-sunk" : ""}>
                  {line.split("|").map((cell, j) => (
                    <td key={j} className="px-3 py-1.5 border-t border-line first:font-medium">{cell.trim()}</td>
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
            let s = ANSWER.idle;
            if (showReveal) {
              if (i === task.correct) s = ANSWER.correct;
              else if (i === single) s = ANSWER.wrong;
              else s = ANSWER.dim;
            } else if (i === single) s = ANSWER.selected;
            return (
              <button key={i} disabled={isLocked} onClick={() => setSingle(i)}
                className={`text-left p-3 rounded-md border-2 transition-colors flex flex-col items-center gap-2 ${s}`}>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sunk text-ink-muted text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                <img src={img} alt={`вариант ${i + 1}`} className="max-h-40 object-contain" />
              </button>
            );
          })}
        </div>
      )}

      {task.type === "single" && task.options && (
        <div className="mt-5 space-y-3">
          {task.options.map((opt, i) => {
            let s = ANSWER.idle;
            if (showReveal) {
              if (i === task.correct) s = ANSWER.correct;
              else if (i === single) s = ANSWER.wrong;
              else s = ANSWER.dim;
            } else if (i === single) s = ANSWER.selected;
            return (
              <button key={i} disabled={isLocked} onClick={() => setSingle(i)}
                className={`w-full text-left px-4 py-3 rounded-md border-2 transition-colors text-ink flex items-start gap-3 ${s}`}>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sunk text-ink-muted text-sm font-semibold flex items-center justify-center">{i + 1}</span>
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
            let s = picked ? ANSWER.selected : ANSWER.idle;
            if (showReveal) {
              if (task.correct.includes(i)) s = ANSWER.correct;
              else if (picked) s = ANSWER.wrong;
              else s = ANSWER.dim;
            }
            return (
              <button key={i} disabled={isLocked} onClick={() => toggleMulti(i)}
                className={`w-full text-left px-4 py-3 rounded-md border-2 transition-colors text-ink flex items-center gap-3 ${s}`}>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sunk text-ink-muted text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                <span className={`w-5 h-5 rounded-xs border-[1.5px] flex-shrink-0 ${picked ? "bg-ink border-ink" : "border-line-strong"}`} />
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
            disabled={isLocked}
            placeholder=""
            className={`w-full px-4 py-3 rounded-md border-2 outline-none text-ink ${showReveal ? (right ? "border-brand bg-brand-100" : "border-wrong bg-wrong-100") : "border-line-strong focus:border-brand"}`}
          />
          {showReveal && !right && (
            <p className="mt-2 text-sm text-ink-muted">Верный ответ: <b className="text-brand">{Array.isArray(task.answer) ? task.answer.join(" / ") : task.answer}</b></p>
          )}
        </div>
      )}

      {task.type === "sequence" && (
        <div className="mt-5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && onCheck()}
            disabled={isLocked}
            inputMode="numeric"
            placeholder="Впиши цифры без пробелов, например 213"
            className={`w-full px-4 py-3 rounded-md border-2 outline-none text-ink tracking-widest ${showReveal ? (right ? "border-brand bg-brand-100" : "border-wrong bg-wrong-100") : "border-line-strong focus:border-brand"}`}
          />
          {showReveal && !right && (
            <p className="mt-2 text-sm text-ink-muted">Верный ответ: <b className="text-brand">{task.answer}</b></p>
          )}
        </div>
      )}

      {task.type === "essay" && (
        <div className="mt-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLocked}
            rows={4}
            placeholder="Напиши свой ответ (можно кратко, своими словами)"
            className="w-full px-4 py-3 rounded-md border-2 outline-none text-ink border-line-strong focus:border-brand resize-none"
          />
          {showReveal && (
            <div className="mt-4 p-4 rounded-lg bg-brand-100 border border-brand-100">
              <p className="font-data text-label text-brand uppercase mb-1">Эталонный ответ</p>
              <p className="text-sm text-ink leading-relaxed">{task.answer}</p>
              {task.criteria && (
                <>
                  <p className="font-data text-label text-brand uppercase mt-3 mb-1">Критерии</p>
                  <p className="text-sm text-ink leading-relaxed">{task.criteria}</p>
                </>
              )}
            </div>
          )}
          {awaitingSelfCheck && (
            <div className="mt-4">
              <p className="text-sm text-ink-muted mb-2">Сравни со своим ответом — похоже?</p>
              <div className="flex gap-3">
                <button onClick={() => onMarkSelf(true)} className="flex-1 bg-brand-100 hover:brightness-95 text-brand-800 font-semibold py-2.5 rounded-md transition-[filter] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-300 focus-visible:outline-offset-2">Да, похоже</button>
                <button onClick={() => onMarkSelf(false)} className="flex-1 bg-wrong-100 hover:brightness-95 text-wrong font-semibold py-2.5 rounded-md transition-[filter] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-300 focus-visible:outline-offset-2">Не совсем</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showReveal && !awaitingSelfCheck && (
        <div className={`mt-4 flex items-center gap-2 text-sm font-medium ${right ? "text-brand" : "text-wrong"}`}>
          <img src={right ? MASCOT.correct : MASCOT.wrong} alt="" className="w-10 h-10 object-contain flex-shrink-0" />
          {right ? "Верно" : "Неверно"}
        </div>
      )}
    </div>
  );
}

function OpenBadge() {
  return (
    <svg viewBox="0 0 10 10" className="w-3 h-3 text-ink-muted group-hover:text-brand transition-colors shrink-0" fill="none">
      <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Shell({ children }) {
  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-3xl py-6">{children}</div>
    </div>
  );
}
// Переключатель-«таблетка» (sg-pill): выбранный — залит чернилами, остальные —
// белые с тонкой рамкой. Цифры в таблетках (5 / 10 / 20) набираются Tektur.
export function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`min-w-[48px] px-3.5 py-2 rounded-full text-[15px] font-data font-semibold border-[1.5px] transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-300 focus-visible:outline-offset-2 ${
        active ? "bg-ink border-ink text-paper" : "bg-surface text-ink border-line hover:border-line-strong"
      }`}>{children}</button>
  );
}

// Кнопки бренда (эталон — docs/brand/reference/components.css):
//   PrimaryButton  = sg-btn            — сплошной #17784A со «ступенькой» снизу;
//   SecondaryButton = sg-btn--secondary — белая, чернильная обводка и ступенька.
// При нажатии кнопка проседает на 2 px, ступенька уменьшается до 2 px.
//
// Главная кнопка — одна на экран: «Начать», «Проверить», «Дальше». Там, где
// одинаковые кнопки повторяются списком (демо-2027, режим «проверять сразу»),
// берётся SecondaryButton — иначе страница заливается зелёным, а брендбук
// держит зелёный на ~8% площади: «зелёного мало — поэтому он заметен».
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 font-sans font-bold text-base leading-none rounded-md " +
  "transition-[transform,box-shadow,background-color] duration-[120ms] ease-[cubic-bezier(.2,.7,.3,1)] " +
  "active:translate-y-[2px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-300 focus-visible:outline-offset-[3px] " +
  "disabled:opacity-[.45] disabled:cursor-not-allowed disabled:active:translate-y-0";

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`${BTN_BASE} bg-brand text-white shadow-step hover:bg-brand-800 active:shadow-step-pressed disabled:shadow-step ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`${BTN_BASE} bg-surface text-ink shadow-secondary hover:bg-sunk active:shadow-secondary-pressed disabled:shadow-secondary ${className}`}
    >
      {children}
    </button>
  );
}

// Раньше — отдельная чёрная кнопка «Проверить». Брендбук: «Чёрная Проверить →
// sg-btn». «Проверить» и «Дальше» сменяют друг друга в одном месте и вместе не
// показываются, так что обе — главная кнопка. Имя оставлено ради мест вызова.
export const DarkButton = PrimaryButton;

// Сегментированная полоса (как в Duolingo) — по делению видно, сколько вопросов
// осталось, а не только процент. При большом наборе (например "все" в тренировке
// по номеру задания) деления становятся неразличимо тонкими, так что выше 20
// заданий откатываемся на обычную гладкую полосу.
export function ProgressBar({ current, total }) {
  if (total > 20) {
    return (
      <div className="h-2 bg-sunk rounded-full overflow-hidden">
        <div className="h-full bg-brand transition-all duration-300" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    );
  }
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors duration-300 ${i < current ? "bg-brand" : "bg-sunk"}`}
        />
      ))}
    </div>
  );
}

// Карточка раздела. Выбрано 24.09.2026: широкая полоса в 2 колонки × 4 ряда
// (на телефоне — одна колонка), как карточки «Варианты недели»: иконка слева,
// название, счётчик справа. Название — Onest 700: брендбук разрешает Science
// Gothic только от 20 px, а в 16 px он рвал длинные слова («Природопользова-ние»).
// Цвета и плашка иконки — по спеке sg-section; выбранная заливается брендом.
// Счётчик выбранной — green-100, а не green-300 из спеки: 4,67:1 против 3,62:1.
function SectionCard({ active, onClick, icon, name, n }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-full w-full flex items-center gap-3 text-left p-3.5 rounded-lg border transition-[border-color,transform] duration-[120ms] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-300 focus-visible:outline-offset-2 ${
        active ? "bg-brand border-brand text-white" : "bg-surface border-line text-ink hover:border-ink"
      }`}
    >
      <span
        className={`w-9 h-9 shrink-0 rounded-sm grid place-items-center ${
          active ? "bg-white/[.16] text-white" : "bg-brand-100 text-brand-800"
        }`}
      >
        <Icon name={icon} className="w-5 h-5" />
      </span>
      <p className="flex-1 min-w-0 font-sans font-bold text-base leading-snug">{name}</p>
      <span className={`font-data font-semibold text-sm tabular-nums ${active ? "text-brand-100" : "text-ink-muted"}`}>{n}</span>
    </button>
  );
}
