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
        className="w-full max-w-sm rounded-modal border border-line bg-surface-2 p-8 shadow-e2"
      >
        {/* Splash moment — display punch (American Captain). */}
        <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">
          Mason Homes
        </p>
        <h1 className="mt-1 font-punch text-5xl uppercase leading-none tracking-[0.02em] text-bone">
          Inventory
        </h1>
        <p className="mt-3 text-sm text-ink-tertiary">
          Enter your access password to continue.
        </p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Access password"
          className="mt-6 w-full rounded-control border border-line-strong bg-surface-3 px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-red"
        />
        {error && (
          <p className="mt-2 text-sm text-red" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-control bg-red px-3 py-2.5 font-display text-sm font-bold text-bone transition duration-150 ease-out hover:bg-red-hover active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
        {/* The one sanctioned italic. */}
        <p className="mt-6 text-center text-xs italic text-steel">
          Built loud. Built heavy. Built to last.
        </p>
      </form>
    </main>
  );
}
