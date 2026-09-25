import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "/" — абсолютные пути к ассетам, иначе при обновлении вложенных
// маршрутов (/tasks, /about, ...) относительные пути ("./assets/...")
// резолвятся от текущего URL, а не от корня, и JS не грузится.
export default defineConfig({
  plugins: [react()],
  base: "/",
  // Тесты — только из tests/. Без этого vitest находит и тесты вложенных копий
  // проекта (например, simplegeo/simplegeo/) и счёт удваивается.
  test: {
    include: ["tests/**/*.test.js"],
  },
});
