"use client";

import { useEffect, useState } from "react";

// Dark is the brand's home (default). Light mode is opt-in and persisted.
// A matching inline script in the layout applies the saved theme before
// paint so there's no flash.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved =
      (localStorage.getItem("mason_theme") as "dark" | "light" | null) ?? "dark";
    setTheme(saved);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("mason_theme", next);
    } catch {
      /* ignore */
    }
    const el = document.documentElement;
    if (next === "light") el.setAttribute("data-theme", "light");
    else el.removeAttribute("data-theme");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line-strong bg-surface-3 text-ink-secondary transition duration-150 ease-out hover:border-red hover:text-ink-primary"
    >
      {theme === "dark" ? (
        // Sun — tap for light.
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
        </svg>
      ) : (
        // Moon — tap for dark.
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
