"use client";

import { useState } from "react";
import { linenLabel, reasonLabel } from "@/lib/constants";
import type { PullLogEntry } from "@/lib/types";
import { Pill, formatWhen } from "@/app/components/ui";

type Filter = "all" | "weekly_restock" | "exceptions";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "weekly_restock", label: "Restock" },
  { key: "exceptions", label: "Linen exceptions" },
];

export default function LogClient({ entries }: { entries: PullLogEntry[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = entries.filter((e) => {
    if (filter === "all") return true;
    if (filter === "weekly_restock") return e.reason === "weekly_restock";
    return e.reason !== "weekly_restock";
  });

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-control bg-surface-1 p-0.5 text-xs font-medium">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-[4px] px-3 py-1.5 transition duration-150 ease-out ${
              filter === f.key
                ? "bg-surface-3 text-ink-primary shadow-e1"
                : "text-ink-tertiary hover:text-ink-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-card border border-line bg-surface-2 p-8 text-center text-sm text-ink-tertiary">
          No pulls logged yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface-2 shadow-e1">
          {/* Header (desktop) */}
          <div className="hidden grid-cols-[8rem_1fr_4rem_1fr_9rem] gap-3 border-b border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted sm:grid">
            <span>When</span>
            <span>Item</span>
            <span className="text-right">Qty</span>
            <span>Destination</span>
            <span>Reason</span>
          </div>
          {rows.map((e, idx) => {
            const item =
              e.category === "linen" ? linenLabel(e.item_name) : e.item_name;
            const exception = e.reason !== "weekly_restock";
            return (
              <div
                key={e.id}
                className={`px-4 py-3 text-sm sm:grid sm:grid-cols-[8rem_1fr_4rem_1fr_9rem] sm:items-center sm:gap-3 ${
                  idx > 0 ? "border-t border-line" : ""
                }`}
              >
                <div className="tnum text-xs text-ink-muted">
                  {formatWhen(e.pulled_at)}
                </div>
                <div className="mt-1 font-medium text-ink-primary sm:mt-0">
                  {item}
                  <span className="ml-2 text-xs text-ink-muted">
                    by {e.staff_name}
                  </span>
                </div>
                <div className="tnum mt-1 font-bold text-ink-secondary sm:mt-0 sm:text-right">
                  {e.quantity}
                </div>
                <div className="mt-1 text-ink-secondary sm:mt-0">
                  {e.destination_name ?? "—"}
                </div>
                <div className="mt-2 sm:mt-0">
                  <Pill tone={exception ? "bad" : "neutral"}>
                    {reasonLabel(e.reason)}
                  </Pill>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
