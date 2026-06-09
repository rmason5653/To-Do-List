"use client";

import { useEffect, useState } from "react";

// Dark is the brand's home (default). The chosen theme is stored in a cookie
// the server reads (see layout) so it renders correctly on first paint and
// survives the app being closed/reopened — localStorage gets evicted in the
// iOS home-screen app, cookies don't.

function readThemeCookie(): "dark" | "light" | null {
  const m = document.cookie.match(/(?:^|;\s*)mason_theme=(dark|light)/);
  return m ? (m[1] as "dark" | "light") : null;
}

function applyTheme(theme: "dark" | "light") {
  // 1 year; refreshed each visit (re-set on mount) to outlast ITP caps.
  document.cookie = `mason_theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem("mason_theme", theme);
  } catch {
    /* ignore */
  }
  document.documentElement.setAttribute("data-theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved =
      readThemeCookie() ??
      (localStorage.getItem("mason_theme") as "dark" | "light" | null) ??
      "dark";
    setTheme(saved);
    applyTheme(saved); // re-write the cookie so it keeps persisting
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
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
