import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" — чтобы сайт работал из любой папки на хостинге (важно для S3).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
