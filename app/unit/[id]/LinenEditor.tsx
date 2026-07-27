"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LINEN_TYPES, linenLabel } from "@/lib/constants";
import type { LinenPar } from "@/lib/types";

// Manager-only. Sets this unit's linen par and which sized bedding it carries.
// Each size is its own catalog type (e.g. "Fitted sheets (King)"), so adding a
// type is how a unit gets a King vs Queen item. Cleaners never see this.
export default function LinenEditor({
  unitId,
  linens,
  hasPullout,
}: {
  unitId: string;
  linens: LinenPar[];
  hasPullout: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pullout, setPullout] = useState(hasPullout);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(linens.map((l) => [l.linen_type, String(l.par_count)])),
  );
  const [newType, setNewType] = useState("");
  const [newPar, setNewPar] = useState("");

  const present = new Set(linens.map((l) => l.linen_type));
  const addable = LINEN_TYPES.filter((t) => !present.has(t.key));

  async function post(linenType: string, par: number) {
    const res = await fetch("/api/linens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unit_id: unitId, linen_type: linenType, par_count: par }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "Could not save.");
    }
  }

  async function savePar(l: LinenPar) {
    const par = parseInt(draft[l.linen_type] ?? String(l.par_count), 10);
    if (!Number.isInteger(par) || par < 0) {
      setError("Par must be a whole number.");
      return;
    }
    setBusyKey(l.linen_type);
    setError("");
    try {
      await post(l.linen_type, par);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  }

  async function remove(l: LinenPar) {
    setBusyKey(l.linen_type);
    setError("");
    try {
      const res = await fetch("/api/linens", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_id: unitId, linen_type: l.linen_type }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not remove.");
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  }

  async function togglePullout() {
    const next = !pullout;
    setBusyKey("__pullout__");
    setError("");
    try {
      const res = await fetch(`/api/units/${unitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ has_pullout: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not save.");
      }
      setPullout(next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  }

  async function add() {
    if (!newType) {
      setError("Pick a linen type to add.");
      return;
    }
    const par = parseInt(newPar, 10);
    if (!Number.isInteger(par) || par < 0) {
      setError("Par must be a whole number.");
      return;
    }
    setBusyKey("__add__");
    setError("");
    try {
      await post(newType, par);
      setNewType("");
      setNewPar("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  }

  const field =
    "tnum w-16 rounded-control border border-line-strong bg-surface-3 px-2.5 py-1.5 text-sm text-ink-primary outline-none focus:border-red";

  return (
    <section className="rounded-card border border-line bg-surface-2 shadow-e1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span>
          <span className="font-display text-sm font-bold uppercase tracking-[0.06em] text-ink-secondary">
            Manage linen par
          </span>
          <span className="ml-2 text-[11px] text-ink-muted">
            Manager only · {linens.length} {linens.length === 1 ? "type" : "types"}
          </span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-ink-tertiary transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7.5l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-line px-5 py-4">
          <p className="mb-3 text-xs text-ink-muted">
            Set how many of each linen this unit keeps at par. Add the sized
            bedding (King or Queen) this unit actually uses.
          </p>

          {/* Drives the closet-bag reminder cleaners see during a clean. Queen
              linen alone can't stand in for this — a queen main bed uses the
              same sizes. */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-control bg-surface-1 px-3 py-2.5">
            <span className="min-w-0 text-sm text-ink-secondary">
              Has a <b className="text-ink-primary">queen pullout couch</b>
              <span className="block text-[11px] text-ink-muted">
                Reminds cleaners its bedding is bagged in the closet.
              </span>
            </span>
            <button
              type="button"
              onClick={togglePullout}
              disabled={busyKey === "__pullout__"}
              aria-pressed={pullout}
              className={`rounded-control border px-3 py-1.5 font-display text-xs font-bold transition disabled:opacity-50 ${
                pullout
                  ? "border-[rgba(31,138,76,.5)] bg-green-subtle text-state-ok"
                  : "border-line-strong bg-surface-3 text-ink-tertiary hover:text-ink-primary"
              }`}
            >
              {busyKey === "__pullout__" ? "…" : pullout ? "Yes" : "No"}
            </button>
          </div>

          {linens.length > 0 ? (
            <ul className="divide-y divide-[rgba(112,113,118,.14)]">
              {linens.map((l) => {
                const busy = busyKey === l.linen_type;
                return (
                  <li
                    key={l.id}
                    className="flex flex-wrap items-center gap-2 py-2.5"
                  >
                    <span className="min-w-0 flex-1 text-sm font-medium text-ink-primary">
                      {linenLabel(l.linen_type)}
                    </span>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
                      par
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={draft[l.linen_type] ?? String(l.par_count)}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, [l.linen_type]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") savePar(l);
                      }}
                      className={field}
                    />
                    <button
                      type="button"
                      onClick={() => savePar(l)}
                      disabled={busy}
                      className="rounded-control bg-red px-3 py-1.5 font-display text-xs font-bold text-bone transition hover:bg-red-hover active:brightness-95 disabled:opacity-50"
                    >
                      {busy ? "…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(l)}
                      disabled={busy}
                      className="rounded-control border border-line-strong bg-surface-3 px-2.5 py-1.5 text-xs font-semibold text-ink-tertiary transition hover:border-red hover:text-state-bad disabled:opacity-50"
                      aria-label={`Remove ${linenLabel(l.linen_type)}`}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-ink-tertiary">
              No linens set for this unit yet. Add the first type below.
            </p>
          )}

          {/* Add a type the unit doesn't carry yet. */}
          {addable.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                aria-label="Linen type to add"
                className="min-w-0 flex-1 rounded-control border border-line-strong bg-surface-3 px-3 py-2 text-sm text-ink-primary outline-none focus:border-red"
              >
                <option value="" disabled>
                  Add a linen type…
                </option>
                {addable.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              <label className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
                par
              </label>
              <input
                type="number"
                min={0}
                value={newPar}
                onChange={(e) => setNewPar(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") add();
                }}
                placeholder="0"
                className={field}
              />
              <button
                type="button"
                onClick={add}
                disabled={busyKey === "__add__"}
                className="rounded-control bg-red px-3.5 py-2 font-display text-xs font-bold text-bone transition hover:bg-red-hover active:brightness-95 disabled:opacity-50"
              >
                {busyKey === "__add__" ? "Adding…" : "Add"}
              </button>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-state-bad" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
