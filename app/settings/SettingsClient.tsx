"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ConsumableItem, Settings } from "@/lib/types";

export default function SettingsClient({
  settings,
  items,
}: {
  settings: Settings;
  items: ConsumableItem[];
}) {
  const router = useRouter();
  const [freq, setFreq] = useState(String(settings.default_turnover_frequency));
  const [buffer, setBuffer] = useState(String(settings.buffer_turnovers));
  const [central, setCentral] = useState(String(settings.central_buffer));
  const [lb, setLb] = useState<Record<string, string>>(
    () => Object.fromEntries(items.map((i) => [i.item_name, String(i.leave_behind)])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Live preview of the calculated par at the current inputs.
  const f = Number(freq) || 0;
  const b = Number(buffer) || 0;
  const preview = useMemo(
    () =>
      items.map((i) => {
        const leave = Number(lb[i.item_name]) || 0;
        return {
          item_name: i.item_name,
          leave,
          par: leave * (f + b),
          reorder: leave * b,
        };
      }),
    [items, lb, f, b],
  );

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_turnover_frequency: Number(freq),
          buffer_turnovers: Number(buffer),
          central_buffer: Number(central),
          leave_behind: items.map((i) => ({
            item_name: i.item_name,
            value: Number(lb[i.item_name]),
          })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not save settings.");
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const numField =
    "tnum w-20 rounded-control border border-line-strong bg-surface-3 px-2.5 py-1.5 text-sm text-ink-primary outline-none focus:border-red";

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-ink-tertiary">
        Par is <b className="text-ink-secondary">calculated</b>, never typed.
        Change an input here and every closet par, reorder point, and central
        target recalculates across all 63 units. Linen par is set per unit on
        the unit manager.
      </p>

      {/* Global knobs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Knob
          label="Turnovers / week"
          hint="Default per unit"
          value={freq}
          onChange={setFreq}
          field={numField}
        />
        <Knob
          label="Buffer turnovers"
          hint="Safety cushion"
          value={buffer}
          onChange={setBuffer}
          field={numField}
        />
        <Knob
          label="Central buffer"
          hint="Weeks held at central"
          value={central}
          onChange={setCentral}
          field={numField}
          step="0.5"
        />
      </div>

      {/* Leave-behind + live calculated par */}
      <div className="overflow-hidden rounded-card border border-line bg-surface-2 shadow-e1">
        <div className="grid grid-cols-[1fr_6rem_5rem_5rem] gap-3 border-b border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
          <span>Consumable</span>
          <span className="text-right">Leave-behind</span>
          <span className="text-right">Par</span>
          <span className="text-right">Reorder</span>
        </div>
        {preview.map((p, idx) => (
          <div
            key={p.item_name}
            className={`grid grid-cols-[1fr_6rem_5rem_5rem] items-center gap-3 px-4 py-2.5 text-sm ${
              idx > 0 ? "border-t border-line" : ""
            }`}
          >
            <span className="text-ink-primary">{p.item_name}</span>
            <span className="flex justify-end">
              <input
                type="number"
                min={0}
                value={lb[p.item_name] ?? ""}
                onChange={(e) =>
                  setLb((prev) => ({ ...prev, [p.item_name]: e.target.value }))
                }
                className={numField}
              />
            </span>
            <span className="tnum text-right font-display font-bold text-ink-primary">
              {p.par}
            </span>
            <span className="tnum text-right text-ink-tertiary">{p.reorder}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-control bg-red px-5 py-2.5 font-display text-sm font-bold text-bone transition duration-150 ease-out hover:bg-red-hover active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Recalculating…" : "Save & recalculate"}
        </button>
        {saved && !error && (
          <span className="text-sm text-state-ok">Saved — par recalculated across all units.</span>
        )}
        {error && (
          <span className="text-sm text-state-bad" role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

function Knob({
  label,
  hint,
  value,
  onChange,
  field,
  step,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  field: string;
  step?: string;
}) {
  return (
    <div className="rounded-card border border-line bg-surface-2 p-4 shadow-e1">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
        {label}
      </div>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${field} mt-2 w-24`}
      />
      <div className="mt-1 text-xs text-ink-muted">{hint}</div>
    </div>
  );
}
