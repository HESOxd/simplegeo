// Маскот — хамелеон-проводник из бренд-кита (welcome ← mascot-hello,
// finish ← mascot-hint, empty ← mascot-search, см. docs/brand/BRAND_GUIDELINES.md).
//
// Файлы лежат в src, а не в public/: при сборке они получают имя с хэшем, и
// заменённая картинка доходит до вернувшихся посетителей. Файлы из public/
// деплой кэширует на год под тем же именем.
//
// Картинки уменьшены под самый крупный показ ×3 (экраны iPhone): welcome —
// 540 px (старт диагностики, до 180 px), остальные — 384 px (404, до 128 px).
// Браузер берёт WebP (20–40 КБ), старые iPhone без WebP (iOS 13 и ниже) — PNG.
import React from "react";
import welcomePng from "./mascot/welcome.png";
import welcomeWebp from "./mascot/welcome.webp";
import finishPng from "./mascot/finish.png";
import finishWebp from "./mascot/finish.webp";
import correctPng from "./mascot/correct.png";
import correctWebp from "./mascot/correct.webp";
import wrongPng from "./mascot/wrong.png";
import wrongWebp from "./mascot/wrong.webp";
import emptyPng from "./mascot/empty.png";
import emptyWebp from "./mascot/empty.webp";

const FILES = {
  welcome: [welcomeWebp, welcomePng],
  finish: [finishWebp, finishPng],
  correct: [correctWebp, correctPng],
  wrong: [wrongWebp, wrongPng],
  empty: [emptyWebp, emptyPng],
};

// Размер и отступы задаются className, как у обычного <img>. <picture> —
// display: contents, чтобы не ломать flex-раскладку вокруг картинки.
export function Mascot({ name, className }) {
  const [webp, png] = FILES[name];
  return (
    <picture className="contents">
      <source srcSet={webp} type="image/webp" />
      <img src={png} alt="" className={className} />
    </picture>
  );
}
