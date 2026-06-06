import type { Config } from "tailwindcss";

// Mason Design System v4.0 — execution rule book.
// Identity locked (five anchors, three font lanes), execution freed
// (surface ramp, midnight-tinted elevation, accent ramps, radius scale).
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
        // Surface ramp — derived from midnight only.
        surface: {
          0: "#0B0B0D", // page
          1: "#121215", // section wells
          2: "#16161A", // cards
          3: "#1C1C21", // raised cards, inputs, hover rows
          4: "#232329", // popovers, sticky headers
        },
        // Hard-locked anchors.
        midnight: "#0B0B0D",
        bone: "#F5F2EC",
        steel: "#707176",
        // Text ramp (bone-derived).
        ink: {
          primary: "#F5F2EC",
          secondary: "#C9C6BF",
          tertiary: "#9B9C9F",
          muted: "#707176",
          faint: "#4D4D52",
        },
        // Red anchor + ramp (conviction / correction / destructive / down).
        red: {
          DEFAULT: "#E20602",
          hover: "#F71813",
          pressed: "#C90502",
        },
        // Gold anchor + ramp (earned / insight / due-soon / holding).
        gold: {
          DEFAULT: "#F5B800",
          bright: "#FFC81E",
          deep: "#C79500",
        },
        // Mason Green — product-UI directional data ONLY (up / growing / done).
        // The single sanctioned green; never neon, never on brand surfaces.
        green: {
          DEFAULT: "#1F8A4C",
        },
      },
      borderColor: {
        // Steel-derived hairlines. Named to avoid clashing with the
        // border-width utilities (border-2 / border-4).
        line: "rgba(112,113,118,.14)",
        "line-strong": "rgba(112,113,118,.28)",
      },
      backgroundColor: {
        // Accent subtle fills.
        "red-subtle": "rgba(226,6,2,.10)",
        "gold-subtle": "rgba(245,184,0,.10)",
        "green-subtle": "rgba(31,138,76,.12)",
      },
      borderRadius: {
        control: "6px", // buttons, inputs, chips-as-controls
        card: "10px",
        modal: "14px",
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
