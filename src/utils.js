// Приводим ответ к виду, в котором его можно сравнивать по смыслу, а не
// посимвольно: ученик пишет «египет», в банке «Египет.» — это один ответ.
//
// Отдельная история — числа. Тут нельзя просто выкинуть знаки препинания:
//   • В банке минус иногда записан длинным тире («–10294»), а на клавиатуре
//     ученика есть только дефис. Без приведения верный ответ считался ошибкой.
//   • Запятая в «1,4» — это разделитель дробной части, а не пунктуация.
//     Старая версия стирала её вместе с точками, превращая «1,4» в «14»,
//     и тогда ответ «14» засчитывался как верный — ошибка ровно в 10 раз.
// Поэтому запятая между цифрами становится точкой (чтобы «1,4» и «1.4» были
// одним числом), а удаляется только та пунктуация, за которой не идёт цифра.
export function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[‒–—−]/g, "-") // – — − → обычный минус
    .replace(/ /g, " ") // неразрывный пробел
    .replace(/(\d) (?=\d{3}(?!\d))/g, "$1") // разряды: «12 102» → «12102»
    .replace(/(\d),(\d)/g, "$1.$2") // десятичная запятая → точка
    .replace(/[.,;](?!\d)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Детерминированный ГПСЧ (mulberry32) — для "вариантов недели": один и тот же
// seed (например, номер ISO-недели) должен давать один и тот же вариант
// у всех посетителей сайта всю неделю, а на следующей неделе — другой.
export function seededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
  if (task.type === "short") {
    const accepted = Array.isArray(task.answer) ? task.answer : [task.answer];
    return accepted.some((a) => norm(answer.text || "") === norm(a));
  }
  if (task.type === "sequence") return String(answer.text || "").replace(/\s+/g, "") === String(task.answer);
  if (task.type === "essay") return answer.selfRight === true;
  return false;
}
