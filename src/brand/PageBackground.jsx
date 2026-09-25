// Фон страницы — изолинии бренда (seed 17, тонкие 12%, мажорные 50% — как hero
// в эталонной вёрстке кита). Слой закреплён на весь экран, поэтому толщина
// линий одинаковая при любой длине страницы.
//
// Брендбук: изолиний нет «под текстом задания, под учебными картами (спорит с
// горизонталями)». Поэтому экран, где решают задания, сообщает об этом через
// useTaskScreen(true) — и фон на нём становится чистой бумагой.
//
// Картинка импортируется из src, а не лежит в public: так у файла будет хэш в
// имени. Всё из public деплой отдаёт с кешем на год без хэша — перерисованный
// фон с тем же именем вернувшиеся посетители не увидели бы.
import React, { createContext, useContext, useEffect, useState } from "react";
import pageIsolines from "./iso/page.svg";

const Ctx = createContext(() => {});

export function PageBackgroundProvider({ children }) {
  const [taskScreens, setTaskScreens] = useState(0);
  return (
    <Ctx.Provider value={setTaskScreens}>
      {taskScreens === 0 && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: `url(${pageIsolines})` }}
        />
      )}
      {children}
    </Ctx.Provider>
  );
}

// Вызывать на экране с текстом задания: useTaskScreen(screen === "quiz").
export function useTaskScreen(active) {
  const setTaskScreens = useContext(Ctx);
  useEffect(() => {
    if (!active) return;
    setTaskScreens((n) => n + 1);
    return () => setTaskScreens((n) => n - 1);
  }, [active, setTaskScreens]);
}
