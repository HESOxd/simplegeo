// Название вкладки браузера для каждой страницы. Его же видят поисковики, по
// нему страницы различаются в закладках и (позже) в отчётах Метрики.
// Новая страница в App.jsx — добавь строку сюда и адрес в public/sitemap.xml;
// tests/sitemap.test.js проверяет, что ни то ни другое не забыто.
export const PAGE_TITLES = {
  "/tasks": "SimpleGeo — тренажёр ОГЭ по географии",
  "/tasks/variant": "Полный вариант ОГЭ по географии — SimpleGeo",
  "/tasks/by-number": "Задания ОГЭ по географии по номеру — SimpleGeo",
  "/tasks/weekly": "Варианты недели ОГЭ по географии — SimpleGeo",
  "/tasks/demo-2027": "Демо-версия ОГЭ 2027 по географии — SimpleGeo",
  "/tasks/diagnostic": "Мини-диагностика ОГЭ по географии — SimpleGeo",
  "/tasks/diagnostic/result": "Результат диагностики — SimpleGeo",
  "/about": "Юрий, репетитор по географии — SimpleGeo",
  "/course": "Курсы по подготовке к ОГЭ по географии — SimpleGeo",
};

export const NOT_FOUND_TITLE = "Страница не найдена — SimpleGeo";

export function pageTitle(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PAGE_TITLES[path] ?? NOT_FOUND_TITLE;
}
