import type { Config } from "tailwindcss";

// Mason Design System v4.0 — applied over the Punch List app.
// Identity locked (anchors + font lanes); execution per DESIGN_SYSTEM_v4.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Inter — all body, UI text, data. Loaded via next/font in layout.tsx.
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Montserrat — headings, nav, buttons, card titles, big numbers.
        display: ["var(--font-montserrat)", "ui-sans-serif", "system-ui", "sans-serif"],
        // American Captain — display punch only (splash / empty / milestone).
        punch: ["var(--font-american-captain)", "Arial Black", "Impact", "sans-serif"],
      },
      colors: {
        // Hard-locked anchors. Gold replaces the retired #FFD60A; Mason Green
        // is the one sanctioned green, for directional/success data only.
        mason: {
          red: "#E20602",
          "red-hover": "#F71813",
          gold: "#F5B800",
          green: "#1F8A4C",
        },
        // Constant bone — text on red/green fills, in both themes (never #fff).
        bone: "#F5F2EC",
        // Semantic surface/text tokens (midnight ramp in dark, bone in light).
        canvas: "var(--canvas)",
        panel: "var(--panel)",
        panel2: "var(--panel-2)",
        line: "var(--line)",
        ink: "var(--ink)",
        muted: "var(--muted)",
      },
      boxShadow: {
        // Midnight-tinted elevation — depth cue, never glow.
        e1: "0 1px 2px rgba(0,0,0,.5)",
        e2: "0 4px 12px rgba(0,0,0,.45)",
        e3: "0 12px 32px rgba(0,0,0,.5), 0 2px 8px rgba(0,0,0,.4)",
      },
    },
  },
  plugins: [],
};

export default config;
