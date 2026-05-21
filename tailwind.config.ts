import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        mason: {
          red: "#E20602",
          yellow: "#FFD60A",
        },
        canvas: "var(--canvas)",
        panel: "var(--panel)",
        panel2: "var(--panel-2)",
        line: "var(--line)",
        ink: "var(--ink)",
        muted: "var(--muted)",
      },
    },
  },
  plugins: [],
};

export default config;
