// Убираем ё/е, лишние пробелы и регистр — чтобы короткий ответ засчитывался по смыслу.
export function norm(s) {
  return String(s).toLowerCase().replace(/ё/g, "е").replace(/[.,;]/g, "").replace(/\s+/g, " ").trim();
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Проверка правильности ответа на одно задание (используется и в тренажёре, и в варианте).
export function isTaskRight(task, answer) {
  if (!task) return false;
  if (task.type === "single") return answer.single === task.correct;
  if (task.type === "multi") {
    const a = [...(answer.multi || [])].sort().join(",");
    const b = [...task.correct].sort().join(",");
    return a === b && (answer.multi || []).length > 0;
  }
  if (task.type === "short") return norm(answer.text || "") === norm(task.answer);
  return false;
}
