"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface RestockRun {
  unit_id: string;
  unit_name: string;
  property_name: string;
  items: {
    item_name: string;
    needed: number;
    closet_par: number;
    current_actual: number;
  }[];
}

const STAFF_KEY = "mason_inv_staff";

export default function RestockClient({ runs }: { runs: RestockRun[] }) {
  const router = useRouter();
  const [staff, setStaff] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setStaff(localStorage.getItem(STAFF_KEY) ?? "");
  }, []);

  async function complete(run: RestockRun) {
    if (!staff.trim()) {
      setError("Enter your name first so the pulls are logged to you.");
      return;
    }
    setBusyId(run.unit_id);
    setError("");
    try {
      localStorage.setItem(STAFF_KEY, staff.trim());
      const res = await fetch("/api/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_name: staff.trim(), unit_id: run.unit_id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not complete the restock.");
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface-2 p-3">
        <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
          Restocking as
        </label>
        <input
          value={staff}
          onChange={(e) => setStaff(e.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          className="w-40 rounded-control border border-line-strong bg-surface-3 px-3 py-2 text-sm text-ink-primary outline-none focus:border-red"
        />
        {error && (
          <p className="text-xs text-[#FF6B68]" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {runs.map((run) => {
          const total = run.items.reduce((s, i) => s + i.needed, 0);
          return (
            <div
              key={run.unit_id}
              className="rounded-card border border-line bg-surface-2 p-5 shadow-e1"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-base font-bold text-bone">
                    {run.unit_name}
                  </div>
                  <div className="tnum text-[11px] text-ink-muted">
                    {run.items.length} items · {total} units to pull
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => complete(run)}
                  disabled={busyId === run.unit_id}
                  className="shrink-0 rounded-control bg-red px-3.5 py-2 font-display text-xs font-bold text-bone transition duration-150 ease-out hover:bg-red-hover active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyId === run.unit_id ? "Restocking…" : "Refill to par"}
                </button>
              </div>

              <ul className="mt-3 divide-y divide-[rgba(112,113,118,.14)]">
                {run.items.map((i) => (
                  <li
                    key={i.item_name}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="text-ink-secondary">{i.item_name}</span>
                    <span className="tnum text-ink-tertiary">
                      <span className="font-bold text-gold">+{i.needed}</span>
                      <span className="ml-2 text-ink-muted">
                        {i.current_actual} → {i.closet_par}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
