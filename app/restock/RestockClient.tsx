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

export interface PickItem {
  item_name: string;
  needed: number;
  on_hand: number;
  short: boolean;
}

const STAFF_KEY = "mason_inv_staff";

export default function RestockClient({
  runs,
  pickList,
}: {
  runs: RestockRun[];
  pickList: PickItem[];
}) {
  const router = useRouter();
  const [staff, setStaff] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [allBusy, setAllBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setStaff(localStorage.getItem(STAFF_KEY) ?? "");
  }, []);

  function requireStaff(): boolean {
    if (!staff.trim()) {
      setError("Enter your name first so the pulls are logged to you.");
      return false;
    }
    localStorage.setItem(STAFF_KEY, staff.trim());
    return true;
  }

  async function restockUnit(unitId: string): Promise<void> {
    const res = await fetch("/api/restock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_name: staff.trim(), unit_id: unitId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "Could not complete the restock.");
    }
  }

  async function complete(run: RestockRun) {
    if (!requireStaff()) return;
    setBusyId(run.unit_id);
    setError("");
    try {
      await restockUnit(run.unit_id);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function restockAll() {
    if (!requireStaff()) return;
    setAllBusy(true);
    setError("");
    let done = 0;
    try {
      for (const run of runs) {
        setProgress({ done, total: runs.length });
        await restockUnit(run.unit_id);
        done += 1;
      }
      setProgress({ done, total: runs.length });
      router.refresh();
    } catch (e) {
      setError(`${(e as Error).message} (${done}/${runs.length} done)`);
    } finally {
      setAllBusy(false);
      setProgress(null);
    }
  }

  const busy = allBusy || busyId !== null;
  const grandTotal = pickList.reduce((s, p) => s + p.needed, 0);

  return (
    <div>
      {/* Control bar — who's running it + restock everything at once. */}
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
        <button
          type="button"
          onClick={restockAll}
          disabled={busy}
          className="ml-auto rounded-control bg-red px-4 py-2 font-display text-sm font-bold text-bone transition duration-150 ease-out hover:bg-red-hover active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {allBusy
            ? `Restocking ${progress?.done ?? 0}/${progress?.total ?? runs.length}…`
            : `Refill all ${runs.length} to par`}
        </button>
        {error && (
          <p className="w-full text-xs text-state-bad" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Central pick list — load the van once. */}
      {pickList.length > 0 && (
        <div className="mb-5 rounded-card border border-line bg-surface-1 p-5 shadow-e1">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.06em] text-ink-secondary">
              Pull from central
            </h2>
            <span className="tnum text-[11px] text-ink-muted">
              {grandTotal} units total
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Everything this run needs, totalled across all units.
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
            {pickList.map((p) => (
              <li
                key={p.item_name}
                className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-0"
              >
                <span className="text-ink-secondary">{p.item_name}</span>
                <span className="tnum flex items-center gap-2">
                  <span className="font-display text-base font-bold text-ink-primary">
                    {p.needed}
                  </span>
                  {p.short ? (
                    <span className="rounded-full border border-[rgba(226,6,2,.35)] bg-red-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-state-bad">
                      central short {p.needed - p.on_hand}
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-muted">
                      {p.on_hand} on hand
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {pickList.some((p) => p.short) && (
            <p className="mt-3 text-xs text-state-bad">
              Central can&apos;t fully cover the bold items — buy more bulk before the run.
            </p>
          )}
        </div>
      )}

      {/* Per-unit cards. */}
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
                  <div className="font-display text-base font-bold text-ink-primary">
                    {run.unit_name}
                  </div>
                  <div className="tnum text-[11px] text-ink-muted">
                    {run.items.length} items · {total} units to pull
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => complete(run)}
                  disabled={busy}
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
                      <span className="font-bold text-state-warn">+{i.needed}</span>
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
