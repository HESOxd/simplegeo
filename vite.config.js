import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "/" — абсолютные пути к ассетам, иначе при обновлении вложенных
// маршрутов (/tasks, /about, ...) относительные пути ("./assets/...")
// резолвятся от текущего URL, а не от корня, и JS не грузится.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
