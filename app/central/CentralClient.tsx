"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [mode, setMode] = useState<"none" | "receive" | "targets">("none");
  const [receiveVal, setReceiveVal] = useState("");
  const [parVal, setParVal] = useState(String(item.par_level));
  const [reorderVal, setReorderVal] = useState(String(item.reorder_point));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const low = item.quantity_on_hand <= item.reorder_point;
  const toPar = Math.max(0, item.par_level - item.quantity_on_hand);

  async function send(body: Record<string, number>) {
    setBusy(true);
    setError("");
    try {
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
      setReceiveVal("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function saveReceive() {
    const n = parseInt(receiveVal, 10);
    if (!Number.isInteger(n) || n < 1) {
      setError("Enter a positive whole number.");
      return;
    }
    void send({ add: n });
  }

  function saveTargets() {
    const p = parseInt(parVal, 10);
    const r = parseInt(reorderVal, 10);
    if (!Number.isInteger(p) || p < 0 || !Number.isInteger(r) || r < 0) {
      setError("Par and reorder must be whole numbers.");
      return;
    }
    void send({ par_level: p, reorder_point: r });
  }

  const fieldCls =
    "tnum w-20 rounded-control border border-line-strong bg-surface-3 px-2.5 py-1.5 text-sm text-ink-primary outline-none focus:border-red";

  return (
    <div className={first ? "" : "border-t border-line"}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink-primary">
            {displayName(item)}
          </div>
          <div className="tnum text-[11px] text-ink-muted">
            par {item.par_level} · reorder {item.reorder_point}
            {item.category === "consumable" && (
              <>
                {" · "}
                <Link
                  href="/settings"
                  title="This target is calculated from leave-behind × turnovers. Change it in Settings."
                  className="text-ink-faint underline decoration-dotted underline-offset-2 transition hover:text-ink-tertiary"
                >
                  calculated
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="w-20 text-right">
          <div className="tnum font-display text-2xl font-extrabold tracking-[-0.03em] text-ink-primary">
            {item.quantity_on_hand}
          </div>
          {toPar > 0 && (
            <div className="tnum text-[11px] font-semibold text-state-warn">buy {toPar}</div>
          )}
        </div>

        <div className="w-14 text-right">
          {low ? <Pill tone="warn">Low</Pill> : <Pill tone="ok">OK</Pill>}
        </div>

        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode("receive");
              setReceiveVal("");
              setError("");
            }}
            className="rounded-control border border-line-strong bg-surface-3 px-2.5 py-1 text-xs font-semibold text-ink-secondary transition hover:border-red hover:text-ink-primary"
          >
            Receive
          </button>
          {item.category === "linen" && (
            <button
              type="button"
              onClick={() => {
                setMode("targets");
                setParVal(String(item.par_level));
                setReorderVal(String(item.reorder_point));
                setError("");
              }}
              className="rounded-control border border-line-strong bg-surface-3 px-2.5 py-1 text-xs font-semibold text-ink-tertiary transition hover:border-red hover:text-ink-primary"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {mode === "receive" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-1 px-4 py-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
            Add to stock
          </label>
          <input
            type="number"
            autoFocus
            value={receiveVal}
            onChange={(e) => setReceiveVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveReceive();
              if (e.key === "Escape") setMode("none");
            }}
            className={fieldCls}
          />
          <button
            type="button"
            onClick={saveReceive}
            disabled={busy}
            className="rounded-control bg-red px-3 py-1.5 font-display text-xs font-bold text-bone transition hover:bg-red-hover active:brightness-95 disabled:opacity-50"
          >
            {busy ? "…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setMode("none")}
            className="px-2 py-1.5 text-xs text-ink-tertiary hover:text-ink-primary"
          >
            Cancel
          </button>
          {error && (
            <span className="text-xs text-state-bad" role="alert">
              {error}
            </span>
          )}
        </div>
      )}

      {mode === "targets" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-1 px-4 py-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
            Par
          </label>
          <input
            type="number"
            autoFocus
            value={parVal}
            onChange={(e) => setParVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTargets();
              if (e.key === "Escape") setMode("none");
            }}
            className={fieldCls}
          />
          <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
            Reorder
          </label>
          <input
            type="number"
            value={reorderVal}
            onChange={(e) => setReorderVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTargets();
              if (e.key === "Escape") setMode("none");
            }}
            className={fieldCls}
          />
          <button
            type="button"
            onClick={saveTargets}
            disabled={busy}
            className="rounded-control bg-red px-3 py-1.5 font-display text-xs font-bold text-bone transition hover:bg-red-hover active:brightness-95 disabled:opacity-50"
          >
            {busy ? "…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setMode("none")}
            className="px-2 py-1.5 text-xs text-ink-tertiary hover:text-ink-primary"
          >
            Cancel
          </button>
          {error && (
            <span className="text-xs text-state-bad" role="alert">
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
