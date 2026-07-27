"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QUEEN_BEDDING, linenLabel } from "@/lib/constants";
import StaffSelect from "@/app/components/StaffSelect";
import type { ConsumablePar, LinenPar, Unit } from "@/lib/types";

const STAFF_KEY = "mason_inv_staff";

export default function CleanFlow({
  unit,
  consumables,
  linens,
  staffNames,
  viewerName,
}: {
  unit: Unit;
  consumables: ConsumablePar[];
  linens: LinenPar[];
  staffNames: string[];
  viewerName: string;
}) {
  const router = useRouter();

  const [parking, setParking] = useState<"ok" | "missing" | null>(
    unit.has_parking_pass ? (unit.parking_status === "missing" ? "missing" : "ok") : null,
  );

  const [low, setLow] = useState<Set<string>>(
    () => new Set(consumables.filter((c) => c.current_actual <= c.reorder_point).map((c) => c.id)),
  );

  const anyShort = useMemo(
    () => linens.some((l) => l.current_actual < l.par_count),
    [linens],
  );
  const hasQueenBedding = useMemo(
    () => linens.some((l) => QUEEN_BEDDING.has(l.linen_type)),
    [linens],
  );
  const [linensOk, setLinensOk] = useState<boolean>(!anyShort);
  const [linenActual, setLinenActual] = useState<Record<string, number>>(() =>
    Object.fromEntries(linens.map((l) => [l.linen_type, l.current_actual])),
  );

  const [staff, setStaff] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Default to the remembered pick if it's still on the roster, otherwise the
  // logged-in user. Runs once on mount (client-only localStorage read).
  useEffect(() => {
    // The logged-in user is who's doing the work — default to them. The
    // last-picked name is only a fallback (e.g. an off-roster admin session).
    const remembered = localStorage.getItem(STAFF_KEY) ?? "";
    setStaff(
      viewerName && staffNames.includes(viewerName)
        ? viewerName
        : staffNames.includes(remembered)
          ? remembered
          : viewerName || "",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleLow(id: string) {
    setLow((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setLinen(type: string, value: number, par: number) {
    setLinenActual((prev) => ({
      ...prev,
      [type]: Math.max(0, Math.min(par, value)),
    }));
  }

  async function complete() {
    setBusy(true);
    setError("");
    try {
      if (staff.trim()) localStorage.setItem(STAFF_KEY, staff.trim());
      const res = await fetch(`/api/units/${unit.unit_id}/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_name: staff.trim() || undefined,
          parking,
          consumables: consumables.map((c) => ({ id: c.id, low: low.has(c.id) })),
          linens_ok: linensOk,
          linen_flags: linensOk
            ? []
            : linens.map((l) => ({
                linen_type: l.linen_type,
                actual: linenActual[l.linen_type] ?? l.par_count,
              })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not save the clean.");
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const section = "rounded-card border border-line bg-surface-2 p-5 shadow-e1";
  const stepBtn =
    "h-11 w-11 shrink-0 rounded-control border border-line-strong bg-surface-3 text-lg font-bold text-ink-secondary transition hover:border-red hover:text-ink-primary active:brightness-95 disabled:opacity-40";

  return (
    <div className="space-y-4 pb-28">
      {/* 1 — Parking */}
      <section className={section}>
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.06em] text-ink-secondary">
          <span className="tnum flex h-5 w-5 items-center justify-center rounded-full border border-line-strong bg-surface-3 text-[11px] text-ink-tertiary">
            1
          </span>
          Parking pass
        </h2>
        {unit.has_parking_pass ? (
          <>
            <p className="mt-1 text-xs text-ink-muted">
              {unit.parking_pass_label} — confirm it&apos;s present.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setParking("ok")}
                aria-pressed={parking === "ok"}
                className={`rounded-control border px-4 py-3 font-display text-sm font-bold transition ${
                  parking === "ok"
                    ? "border-[rgba(31,138,76,.5)] bg-green-subtle text-state-ok"
                    : "border-line-strong bg-surface-3 text-ink-tertiary hover:text-ink-primary"
                }`}
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => setParking("missing")}
                aria-pressed={parking === "missing"}
                className={`rounded-control border px-4 py-3 font-display text-sm font-bold transition ${
                  parking === "missing"
                    ? "border-[rgba(226,6,2,.5)] bg-red-subtle text-state-bad"
                    : "border-line-strong bg-surface-3 text-ink-tertiary hover:text-ink-primary"
                }`}
              >
                Missing
              </button>
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-tertiary">
            This unit has no parking pass. Nothing to confirm.
          </p>
        )}
      </section>

      {/* 2 — Consumables */}
      <section className={section}>
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.06em] text-ink-secondary">
          <span className="tnum flex h-5 w-5 items-center justify-center rounded-full border border-line-strong bg-surface-3 text-[11px] text-ink-tertiary">
            2
          </span>
          Consumables
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Put out the listed amount in the unit. Then tap{" "}
          <b className="text-ink-secondary">Needs restock</b> on anything the
          closet is down to its flag number or fewer.
        </p>
        <ul className="mt-3 divide-y divide-[rgba(112,113,118,.14)]">
          {consumables.map((c) => {
            const flagged = low.has(c.id);
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <div className="text-sm font-medium text-ink-primary">
                    {c.item_name}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    {c.fixed_par ? (
                      // Bulk supply (e.g. a gallon of soap) — lives in the
                      // closet; flag when it's about to run out.
                      <>
                        Keep <b className="text-ink-secondary">{c.closet_par}</b>{" "}
                        in the closet · flag when it&apos;s running low
                      </>
                    ) : (
                      <>
                        Put out <b className="text-ink-secondary">{c.leave_behind}</b>{" "}
                        · flag if {c.reorder_point} or fewer left
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleLow(c.id)}
                  aria-pressed={flagged}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] transition ${
                    flagged
                      ? "border-[rgba(245,184,0,.4)] bg-gold-subtle text-state-warn"
                      : "border-line-strong bg-surface-3 text-ink-tertiary hover:text-ink-primary"
                  }`}
                >
                  {flagged ? "Needs restock" : "OK"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3 — Linens */}
      <section className={section}>
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.06em] text-ink-secondary">
          <span className="tnum flex h-5 w-5 items-center justify-center rounded-full border border-line-strong bg-surface-3 text-[11px] text-ink-tertiary">
            3
          </span>
          Linens
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Counts should match par. Flag anything damaged, stained, or missing.
        </p>
        {hasQueenBedding && (
          <p className="mt-2 rounded-control border border-[rgba(245,184,0,.3)] bg-gold-subtle px-3 py-2 text-xs text-state-warn">
            If this unit has a queen pullout, its bedding is in the{" "}
            <b>linen bag in the closet</b>, not on the sofa bed. Open the bag: a
            full set is queen sheets, 1 queen quilt, and 2 queen pillowcases.
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLinensOk(true)}
            aria-pressed={linensOk}
            className={`rounded-control border px-4 py-3 font-display text-sm font-bold transition ${
              linensOk
                ? "border-[rgba(31,138,76,.5)] bg-green-subtle text-state-ok"
                : "border-line-strong bg-surface-3 text-ink-tertiary hover:text-ink-primary"
            }`}
          >
            All match par
          </button>
          <button
            type="button"
            onClick={() => setLinensOk(false)}
            aria-pressed={!linensOk}
            className={`rounded-control border px-4 py-3 font-display text-sm font-bold transition ${
              !linensOk
                ? "border-[rgba(226,6,2,.5)] bg-red-subtle text-state-bad"
                : "border-line-strong bg-surface-3 text-ink-tertiary hover:text-ink-primary"
            }`}
          >
            Flag an issue
          </button>
        </div>

        {!linensOk && (
          <ul className="mt-4 space-y-2">
            {linens.map((l) => {
              const actual = linenActual[l.linen_type] ?? l.par_count;
              const short = actual < l.par_count;
              return (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-control bg-surface-1 px-3 py-2"
                >
                  <div className="text-sm text-ink-primary">
                    {linenLabel(l.linen_type)}
                    <span className="tnum ml-2 text-[11px] text-ink-muted">
                      par {l.par_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={stepBtn}
                      onClick={() => setLinen(l.linen_type, actual - 1, l.par_count)}
                      disabled={actual <= 0}
                      aria-label={`Decrease ${linenLabel(l.linen_type)}`}
                    >
                      −
                    </button>
                    <span
                      className={`tnum w-7 text-center text-sm font-bold ${
                        short ? "text-state-bad" : "text-ink-primary"
                      }`}
                    >
                      {actual}
                    </span>
                    <button
                      type="button"
                      className={stepBtn}
                      onClick={() => setLinen(l.linen_type, actual + 1, l.par_count)}
                      disabled={actual >= l.par_count}
                      aria-label={`Increase ${linenLabel(l.linen_type)}`}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
            <p className="text-[11px] text-ink-muted">
              A short count flags this unit for loss. Replace from the Stockroom
              with a logged pull.
            </p>
          </ul>
        )}
      </section>

      {/* Sticky complete bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-4/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-[8px]">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <StaffSelect
            value={staff}
            onChange={setStaff}
            names={staffNames}
            className="w-32 shrink-0 rounded-control border border-line-strong bg-surface-3 px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-red sm:w-40"
          />
          {error && (
            <p className="flex-1 truncate text-xs text-state-bad" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={complete}
            disabled={busy}
            className="ml-auto rounded-control bg-red px-5 py-2.5 font-display text-sm font-bold text-bone transition duration-150 ease-out hover:bg-red-hover active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "Mark clean complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
