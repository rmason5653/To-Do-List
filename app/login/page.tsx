"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect password.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-line bg-panel p-8 shadow-e2"
      >
        {/* Splash moment — display punch (American Captain). */}
        <h1 className="font-punch text-4xl uppercase leading-none tracking-[0.02em] text-ink">
          Punch <span className="text-mason-red">List</span>
        </h1>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">
          Mason Homes
        </p>
        <p className="mt-4 text-sm text-muted">
          Enter your access password to continue.
        </p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="field mt-4 w-full"
        />
        {error && (
          <p className="mt-2 text-sm text-mason-red" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-mason-red px-3 py-2 font-display text-sm font-bold text-bone transition hover:bg-mason-red-hover disabled:opacity-60"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
        {/* The one sanctioned italic. */}
        <p className="mt-6 text-center text-xs italic text-muted">
          Built loud. Built heavy. Built to last.
        </p>
      </form>
    </main>
  );
}
