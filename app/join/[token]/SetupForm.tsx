"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Create-your-password screen, reached from a one-time invite link.
export default function SetupForm({ token, name }: { token: string; name: string }) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (pw !== pw2) {
      setError("Those passwords don't match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pw }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Could not set your password.");
      router.push(d.firstTime ? "/guide" : "/");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const field =
    "mt-2 w-full rounded-control border border-line-strong bg-surface-3 px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-red";

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-modal border border-line bg-surface-2 p-8 shadow-e2"
      >
        <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">
          Mason Homes
        </p>
        <h1 className="mt-1 font-punch text-5xl uppercase leading-none tracking-[0.02em] text-ink-primary">
          Par
        </h1>
        <p className="mt-3 text-sm text-ink-tertiary">
          Welcome{name ? `, ${name}` : ""} — create a password to finish setting
          up your account.
        </p>

        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="New password (8+ characters)"
          aria-label="New password"
          autoComplete="new-password"
          className={field}
        />
        <input
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          placeholder="Confirm password"
          aria-label="Confirm password"
          autoComplete="new-password"
          className={field}
        />
        {error && (
          <p className="mt-2 text-sm text-state-bad" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-control bg-red px-3 py-2.5 font-display text-sm font-bold text-bone transition duration-150 ease-out hover:bg-red-hover active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Setting up…" : "Create account"}
        </button>
        <p className="mt-6 text-center text-xs italic text-steel">
          Built loud. Built heavy. Built to last.
        </p>
      </form>
    </main>
  );
}
