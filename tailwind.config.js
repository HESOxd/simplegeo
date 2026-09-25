// Тема Tailwind = бренд-токены SimpleGeo (эталон — docs/brand/reference/tokens.json).
// Источник истины по визуальному языку — docs/brand/BRAND_GUIDELINES.md.
// Новые цвета/шрифты/радиусы сюда не дописываются «на глаз»: сначала правится
// бренд-система, потом этот файл.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F4EE",
        surface: "#FFFFFF",
        sunk: "#ECEBE3",
        ink: { DEFAULT: "#1C211D", muted: "#5B605A" },
        line: { DEFAULT: "#E1DFD6", strong: "#CFCCC1" },
        brand: {
          100: "#E2F0E7",
          300: "#9FE0BA",
          400: "#5CC48A",
          DEFAULT: "#17784A",
          700: "#17784A",
          800: "#0F5A36",
          900: "#0B3D25",
        },
        mascot: "#2E9A5C",
        water: { 100: "#E1ECF6", DEFAULT: "#2B6CA3" },
        wrong: { 100: "#FBE7E3", DEFAULT: "#C0352B" },
        warn: { 100: "#FBEFD6", DEFAULT: "#9A6200" },
      },
      fontFamily: {
        display: ['"Science Gothic"', "Onest", "system-ui", "sans-serif"],
        sans: ["Onest", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        data: ["Tektur", "Onest", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["56px", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "800" }],
        h1: ["40px", { lineHeight: "1.05", letterSpacing: "-0.015em", fontWeight: "800" }],
        h2: ["30px", { lineHeight: "1.1", letterSpacing: "-0.01em", fontWeight: "800" }],
        h3: ["22px", { lineHeight: "1.2", fontWeight: "700" }],
        lead: ["19px", { lineHeight: "1.5" }],
        body: ["16px", { lineHeight: "1.6" }],
        small: ["14px", { lineHeight: "1.5" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        label: ["13px", { lineHeight: "1", letterSpacing: "0.04em", fontWeight: "600" }],
        data: ["17px", { lineHeight: "1.2", fontWeight: "600" }],
        "data-xl": ["28px", { lineHeight: "1.1", fontWeight: "600" }],
      },
      borderRadius: { xs: "4px", sm: "6px", md: "10px", lg: "12px", xl: "16px" },
      // Все значения — из docs/brand/reference/components.css.
      // «Ступенька» под кнопкой при нажатии уменьшается с 4 до 2 px:
      // кнопка проседает на высоту тени.
      boxShadow: {
        step: "0 4px 0 #0B3D25",
        "step-pressed": "0 2px 0 #0B3D25",
        "step-ink": "0 4px 0 #1C211D",
        secondary: "inset 0 0 0 2px #1C211D, 0 4px 0 #1C211D",
        "secondary-pressed": "inset 0 0 0 2px #1C211D, 0 2px 0 #1C211D",
        card: "0 1px 2px rgba(28,33,29,.05)",
        pop: "0 8px 24px rgba(28,33,29,.08)",
      },
      maxWidth: { container: "1120px", content: "720px" },
    },
  },
  plugins: [],
};
