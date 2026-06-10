"use client";

import { useState } from "react";

// Admin-only: send the inventory summary email on demand (also tests alerts).
export default function DigestButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function send() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/digest", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Could not send.");
      setMsg(`Sent to ${d.sent} admin${d.sent === 1 ? "" : "s"}.`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="rounded-control border border-line-strong bg-surface-3 px-3 py-1.5 text-xs font-semibold text-ink-secondary transition hover:border-red hover:text-ink-primary disabled:opacity-50"
      >
        {busy ? "Sending…" : "Email me the summary"}
      </button>
      {msg && <span className="text-[11px] text-ink-muted">{msg}</span>}
    </div>
  );
}
