import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

// Шрифты подключаются через src/brand/tokens.css → fonts.css (@font-face),
// файлы woff2 лежат в src/brand/fonts/ и собираются Vite с хэшем в имени.
// Самохостинг сохранён: ни одного запроса на чужой CDN при загрузке страницы.
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
