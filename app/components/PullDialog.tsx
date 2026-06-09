"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  REASONS_BY_CATEGORY,
  REASON_LABELS,
  linenLabel,
} from "@/lib/constants";
import type {
  Category,
  CentralReserveItem,
  PullReason,
  Unit,
} from "@/lib/types";

interface Options {
  units: Pick<Unit, "unit_id" | "name">[];
  items: Pick<CentralReserveItem, "item_name" | "category" | "quantity_on_hand">[];
}

export interface PullPrefill {
  item_name?: string;
  category?: Category;
  unit_id?: string;
  reason?: PullReason;
  quantity?: number;
}

const STAFF_KEY = "mason_inv_staff";

/**
 * Logs a pull from central. Self-contained: renders its own trigger button and
 * modal. Reused on the nav (blank) and on the linen view (prefilled to replace
 * a specific short linen).
 */
export default function PullDialog({
  label = "Log pull",
  variant = "primary",
  prefill,
}: {
  label?: string;
  variant?: "primary" | "ghost" | "small";
  prefill?: PullPrefill;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<Options | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [staff, setStaff] = useState("");
  const [itemKey, setItemKey] = useState(""); // "category::item_name"
  const [qty, setQty] = useState("1");
  const [unitId, setUnitId] = useState("");
  const [reason, setReason] = useState<PullReason>("weekly_restock");

  const dialogRef = useRef<HTMLDivElement>(null);

  async function load() {
    setError("");
    try {
      const res = await fetch("/api/pull");
      if (!res.ok) throw new Error("Could not load central items.");
      const data: Options = await res.json();
      setOpts(data);
      // Seed defaults from prefill / first available option.
      const seedItem =
        prefill?.item_name && prefill.category
          ? `${prefill.category}::${prefill.item_name}`
          : data.items[0]
            ? `${data.items[0].category}::${data.items[0].item_name}`
            : "";
      setItemKey(seedItem);
      setUnitId(prefill?.unit_id ?? data.units[0]?.unit_id ?? "");
      if (prefill?.quantity) setQty(String(prefill.quantity));
      const cat = (seedItem.split("::")[0] as Category) || "consumable";
      setReason(prefill?.reason ?? REASONS_BY_CATEGORY[cat][0]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openDialog() {
    setStaff(localStorage.getItem(STAFF_KEY) ?? "");
    setOpen(true);
    void load();
  }

  // Keep the reason valid for the selected item's category.
  const category = (itemKey.split("::")[0] as Category) || "consumable";
  useEffect(() => {
    if (!itemKey) return;
    const allowed = REASONS_BY_CATEGORY[category];
    if (!allowed.includes(reason)) setReason(allowed[0]);
  }, [itemKey, category, reason]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const [cat, item] = itemKey.split("::");
    const quantity = parseInt(qty, 10);
    if (!staff.trim() || !item || !unitId || !quantity || quantity < 1) {
      setError("Fill in staff, item, quantity, and destination.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      localStorage.setItem(STAFF_KEY, staff.trim());
      const res = await fetch("/api/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_name: staff.trim(),
          item_name: item,
          category: cat,
          quantity,
          destination_unit_id: unitId,
          reason,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not log the pull.");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const trigger =
    variant === "primary"
      ? "rounded-control bg-red px-4 py-2 font-display text-sm font-bold text-bone transition duration-150 ease-out hover:bg-red-hover active:brightness-95"
      : variant === "small"
        ? "rounded-control border border-line-strong bg-surface-3 px-2.5 py-1 text-xs font-semibold text-ink-secondary transition duration-150 ease-out hover:border-red hover:text-bone"
        : "rounded-control border border-line-strong bg-surface-3 px-4 py-2 font-display text-sm font-bold text-ink-primary transition duration-150 ease-out hover:border-red hover:text-bone";

  const field =
    "mt-1 w-full rounded-control border border-line-strong bg-surface-3 px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-red";
  const labelCls =
    "text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary";

  return (
    <>
      <button type="button" onClick={openDialog} className={trigger}>
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Log a pull from central"
            className="w-full max-w-md rounded-modal border border-line-strong bg-surface-2 p-6 shadow-e3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-bone">
                Log a pull from central
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-control px-2 py-1 text-ink-tertiary hover:text-bone"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Draws down central and resets the unit&apos;s item to par.
            </p>

            {!opts ? (
              <p className="mt-6 text-sm text-ink-tertiary">Loading…</p>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-4">
                <div>
                  <label className={labelCls}>Your name</label>
                  <input
                    value={staff}
                    onChange={(e) => setStaff(e.target.value)}
                    placeholder="Who's pulling"
                    className={field}
                    autoFocus={!staff}
                  />
                </div>

                <div>
                  <label className={labelCls}>Item</label>
                  <select
                    value={itemKey}
                    onChange={(e) => setItemKey(e.target.value)}
                    className={field}
                  >
                    <optgroup label="Consumables">
                      {opts.items
                        .filter((i) => i.category === "consumable")
                        .map((i) => (
                          <option
                            key={`consumable::${i.item_name}`}
                            value={`consumable::${i.item_name}`}
                          >
                            {i.item_name} ({i.quantity_on_hand} left)
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Linens">
                      {opts.items
                        .filter((i) => i.category === "linen")
                        .map((i) => (
                          <option
                            key={`linen::${i.item_name}`}
                            value={`linen::${i.item_name}`}
                          >
                            {linenLabel(i.item_name)} ({i.quantity_on_hand} left)
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <div className="flex gap-3">
                  <div className="w-24">
                    <label className={labelCls}>Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className={`${field} tnum`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={labelCls}>Destination</label>
                    <select
                      value={unitId}
                      onChange={(e) => setUnitId(e.target.value)}
                      className={field}
                    >
                      {opts.units.map((u) => (
                        <option key={u.unit_id} value={u.unit_id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as PullReason)}
                    className={field}
                  >
                    {REASONS_BY_CATEGORY[category].map((r) => (
                      <option key={r} value={r}>
                        {REASON_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-sm text-[#FF6B68]" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-control bg-red px-3 py-2.5 font-display text-sm font-bold text-bone transition duration-150 ease-out hover:bg-red-hover active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Logging…" : "Log pull"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
