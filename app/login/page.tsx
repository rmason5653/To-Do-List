"use client";

import { useEffect, useState } from "react";

// Login is invite-link only. This screen no longer takes a password — it just
// points people at the personal link their manager sent them.
export default function LoginPage() {
  const [badLink, setBadLink] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBadLink(params.get("e") === "invite");
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-modal border border-line bg-surface-2 p-8 shadow-e2">
        {/* Splash moment — display punch (American Captain). */}
        <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">
          Mason Homes
        </p>
        <h1 className="mt-1 font-punch text-5xl uppercase leading-none tracking-[0.02em] text-ink-primary">
          Par
        </h1>

        {badLink ? (
          <p className="mt-3 text-sm text-state-bad" role="alert">
            That login link isn&apos;t valid anymore. Ask your manager to resend
            your personal link.
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-tertiary">
            Par is private to the Mason Homes team.
          </p>
        )}

        <div className="mt-6 rounded-control border border-line-strong bg-surface-3 px-4 py-3 text-sm text-ink-secondary">
          Open the <b className="text-ink-primary">personal login link</b> your
          manager texted or emailed you — it signs you in on your phone. No
          password needed.
        </div>

        <p className="mt-4 text-xs text-ink-muted">
          Lost your link? Ask your manager to resend it from the Team screen.
        </p>

        {/* The one sanctioned italic. */}
        <p className="mt-6 text-center text-xs italic text-steel">
          Built loud. Built heavy. Built to last.
        </p>
      </div>
    </main>
  );
}
