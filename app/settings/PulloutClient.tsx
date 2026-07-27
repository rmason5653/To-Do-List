"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Unit } from "@/lib/types";

// Admin control for which units have a queen pullout couch. This is what drives
// the closet-bag reminder cleaners see during a clean, so it lives here rather
// than only on each unit's page — setting a building's worth in one pass.
export default function PulloutClient({ units }: { units: Unit[] }) {
  const router = useRouter();
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(units.map((u) => [u.unit_id, u.has_pullout])),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Keep the page's own grouping: properties in unit sort order, units within.
  const groups = useMemo(() => {
    const by = new Map<string, Unit[]>();
    for (const u of units) {
      const arr = by.get(u.property_name) ?? [];
      arr.push(u);
      by.set(u.property_name, arr);
    }
    return [...by.entries()];
  }, [units]);

  const total = Object.values(on).filter(Boolean).length;

  async function toggle(u: Unit) {
    const next = !on[u.unit_id];
    setBusyId(u.unit_id);
    setError("");
    try {
      const res = await fetch(`/api/units/${u.unit_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ has_pullout: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not save.");
      }
      setOn((p) => ({ ...p, [u.unit_id]: next }));
      router.refresh();
    } catch (e) {
      setError(`${u.name}: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-ink-tertiary">
        Mark every unit with a <b className="text-ink-secondary">queen pullout
        couch</b>. Those units show the cleaner a reminder that the pullout
        bedding is bagged in the closet — a set of queen sheets, 1 queen quilt,
        and 2 queen pillowcases. Changes save as you tap.
      </p>

      <div className="overflow-hidden rounded-card border border-line bg-surface-2 shadow-e1">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Queen pullout couch
          </span>
          <span className="tnum text-xs text-ink-tertiary">
            {total} of {units.length} units
          </span>
        </div>

        {groups.map(([property, list], idx) => (
          <div
            key={property}
            className={`px-4 py-3 ${idx > 0 ? "border-t border-line" : ""}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {property}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {list.map((u) => {
                const isOn = on[u.unit_id];
                const busy = busyId === u.unit_id;
                // Strip the redundant property prefix — "Highland 1209 H" reads
                // as "1209 H" under its own heading.
                const short = u.name.startsWith(`${property} `)
                  ? u.name.slice(property.length + 1)
                  : u.name;
                return (
                  <button
                    key={u.unit_id}
                    type="button"
                    onClick={() => toggle(u)}
                    disabled={busy}
                    aria-pressed={isOn}
                    className={`rounded-control border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                      isOn
                        ? "border-[rgba(31,138,76,.5)] bg-green-subtle text-state-ok"
                        : "border-line-strong bg-surface-3 text-ink-tertiary hover:border-red hover:text-ink-primary"
                    }`}
                  >
                    {busy ? "…" : short}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-state-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
