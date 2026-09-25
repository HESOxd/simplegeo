// Страницы сайта перечислены в трёх местах: маршруты в App.jsx, названия
// вкладок в pageTitles.js и карта сайта для поисковиков в public/sitemap.xml.
// Добавили страницу в одно место и забыли в другом — у неё не будет названия
// или Яндекс о ней не узнает. Ошибки в консоли при этом не будет.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PAGE_TITLES, NOT_FOUND_TITLE, pageTitle } from "../src/pageTitles.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf-8");
const sitemap = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf-8");
const robots = fs.readFileSync(path.join(root, "public/robots.txt"), "utf-8");

// Маршруты-страницы: всё, кроме «*» и редиректов (<Navigate>).
const routes = [...app.matchAll(/<Route path="([^"]+)" element=\{<(\w+)/g)]
  .filter(([, p, el]) => p !== "*" && el !== "Navigate")
  .map(([, p]) => p);
const inSitemap = [...sitemap.matchAll(/<loc>https:\/\/www\.simplegeo\.ru([^<]*)<\/loc>/g)].map((m) => m[1]);
// Личные результаты по ссылке ?r= в поиск не отдаём (закрыты в robots.txt).
const PRIVATE = ["/tasks/diagnostic/result"];

describe("страницы сайта: названия и карта сайта", () => {
  it("маршруты в App.jsx нашлись", () => {
    expect(routes.length).toBeGreaterThanOrEqual(8);
  });

  it("у каждой страницы своё название вкладки", () => {
    const missing = routes.filter((p) => !PAGE_TITLES[p]);
    expect(missing, `нет в pageTitles.js: ${missing.join(", ")}`).toEqual([]);
    expect(new Set(Object.values(PAGE_TITLES)).size).toBe(Object.keys(PAGE_TITLES).length);
  });

  it("в карте сайта — все публичные страницы и только они", () => {
    const expected = routes.filter((p) => !PRIVATE.includes(p)).sort();
    expect([...inSitemap].sort()).toEqual(expected);
  });

  it("личные результаты закрыты от поиска, карта сайта указана", () => {
    for (const p of PRIVATE) expect(robots).toContain(`Disallow: ${p}`);
    expect(robots).toContain("Sitemap: https://www.simplegeo.ru/sitemap.xml");
  });

  it("неизвестный адрес и слэш в конце", () => {
    expect(pageTitle("/nope")).toBe(NOT_FOUND_TITLE);
    expect(pageTitle("/tasks/")).toBe(PAGE_TITLES["/tasks"]);
  });
});
