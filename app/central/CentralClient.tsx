"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { linenLabel } from "@/lib/constants";
import type { Category, CentralReserveItem } from "@/lib/types";
import { Pill } from "@/app/components/ui";

function displayName(item: CentralReserveItem): string {
  return item.category === "linen" ? linenLabel(item.item_name) : item.item_name;
}

export default function CentralClient({ items }: { items: CentralReserveItem[] }) {
  const groups: { key: Category; label: string }[] = [
    { key: "consumable", label: "Consumables" },
    { key: "linen", label: "Linens" },
  ];

  return (
    <div className="space-y-8">
      {groups.map((g) => {
        const rows = items.filter((i) => i.category === g.key);
        if (rows.length === 0) return null;
        return (
          <section key={g.key}>
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.06em] text-ink-secondary">
              {g.label}
            </h2>
            <div className="overflow-hidden rounded-card border border-line bg-surface-2 shadow-e1">
              {rows.map((item, idx) => (
                <Row key={item.id} item={item} first={idx === 0} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Row({ item, first }: { item: CentralReserveItem; first: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"none" | "receive" | "reorder">("none");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const low = item.quantity_on_hand <= item.reorder_point;

  async function save() {
    const n = parseInt(value, 10);
    if (!Number.isInteger(n) || (mode === "receive" && n < 1) || (mode === "reorder" && n < 0)) {
      setError("Enter a valid whole number.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = mode === "receive" ? { add: n } : { reorder_point: n };
      const res = await fetch(`/api/central/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not save.");
      }
      setMode("none");
      setValue("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function open(next: "receive" | "reorder") {
    setMode(next);
    setValue(next === "reorder" ? String(item.reorder_point) : "");
    setError("");
  }

  return (
    <div className={first ? "" : "border-t border-line"}>
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink-primary">
            {displayName(item)}
          </div>
          <div className="tnum text-[11px] text-ink-muted">
            reorder at {item.reorder_point}
          </div>
        </div>

        <div className="tnum w-16 text-right font-display text-2xl font-extrabold tracking-[-0.03em] text-bone">
          {item.quantity_on_hand}
        </div>

        <div className="w-20 text-right">
          {low ? <Pill tone="warn">Low</Pill> : <Pill tone="ok">OK</Pill>}
        </div>

        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => open("receive")}
            className="rounded-control border border-line-strong bg-surface-3 px-2.5 py-1 text-xs font-semibold text-ink-secondary transition hover:border-red hover:text-bone"
          >
            Receive
          </button>
          <button
            type="button"
            onClick={() => open("reorder")}
            className="rounded-control border border-line-strong bg-surface-3 px-2.5 py-1 text-xs font-semibold text-ink-tertiary transition hover:border-red hover:text-bone"
          >
            Edit
          </button>
        </div>
      </div>

      {mode !== "none" && (
        <div className="flex items-center gap-2 border-t border-line bg-surface-1 px-4 py-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
            {mode === "receive" ? "Add to stock" : "Reorder point"}
          </label>
          <input
            type="number"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setMode("none");
            }}
            className="tnum w-24 rounded-control border border-line-strong bg-surface-3 px-2.5 py-1.5 text-sm text-ink-primary outline-none focus:border-red"
          />
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-control bg-red px-3 py-1.5 font-display text-xs font-bold text-bone transition hover:bg-red-hover active:brightness-95 disabled:opacity-50"
          >
            {busy ? "…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setMode("none")}
            className="px-2 py-1.5 text-xs text-ink-tertiary hover:text-bone"
          >
            Cancel
          </button>
          {error && (
            <span className="text-xs text-[#FF6B68]" role="alert">
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
