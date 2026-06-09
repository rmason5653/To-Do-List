import Link from "next/link";
import {
  buildCounts,
  listConsumables,
  listCentralReserve,
  listLinens,
  listRecentCleans,
  listUnits,
  type RecentClean,
} from "@/lib/inventory";
import type { ConsumablePar, LinenPar, Unit } from "@/lib/types";
import {
  Container,
  Pill,
  SetupNotice,
  StatCard,
  formatWhen,
} from "@/app/components/ui";

export const dynamic = "force-dynamic";

interface UnitRollup {
  consLow: number;
  linenShort: number;
}

function rollup(
  units: Unit[],
  cons: ConsumablePar[],
  linens: LinenPar[],
): Map<string, UnitRollup> {
  const map = new Map<string, UnitRollup>();
  for (const u of units) map.set(u.unit_id, { consLow: 0, linenShort: 0 });
  for (const c of cons) {
    if (c.current_actual <= c.reorder_point) {
      const r = map.get(c.unit_id);
      if (r) r.consLow += 1;
    }
  }
  for (const l of linens) {
    if (l.current_actual < l.par_count) {
      const r = map.get(l.unit_id);
      if (r) r.linenShort += 1;
    }
  }
  return map;
}

export default async function HomePage() {
  let units: Unit[] = [];
  let cons: ConsumablePar[] = [];
  let linens: LinenPar[] = [];
  let counts = {
    unitsBelowReorder: 0,
    centralLow: 0,
    linenShortUnits: 0,
    parkingMissing: 0,
  };
  let loadError: string | null = null;
  let recentCleans: RecentClean[] = [];

  try {
    [units, cons, linens] = await Promise.all([
      listUnits(),
      listConsumables(),
      listLinens(),
    ]);
    const reserve = await listCentralReserve();
    counts = buildCounts(units, cons, linens, reserve);
  } catch (err) {
    loadError = (err as Error).message;
  }

  try {
    recentCleans = await listRecentCleans();
  } catch {
    // Non-critical — the dashboard still renders without the clean feed.
  }

  const roll = rollup(units, cons, linens);

  return (
    <Container>
      {/* Hero — one of the few sanctioned American Captain moments. */}
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
          Mason Homes
        </p>
        <h1 className="mt-1 font-punch text-6xl uppercase leading-none tracking-[0.02em] text-bone sm:text-7xl">
          Par
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ink-tertiary">
          Par vs actual across every unit and central. Consumables draw down,
          linens stay flat, every central pull is logged.
        </p>
      </div>

      <Link
        href="/guide"
        className="mb-8 flex items-center justify-between gap-3 rounded-card border border-line bg-surface-2 px-4 py-3 shadow-e1 transition duration-150 ease-out hover:border-line-strong hover:bg-surface-3"
      >
        <span className="text-sm text-ink-secondary">
          <b className="text-bone">New to Par?</b> A 2-minute walkthrough for cleaners.
        </span>
        <span className="shrink-0 font-display text-sm font-bold text-gold">
          How to use →
        </span>
      </Link>

      {loadError && (
        <div className="mb-8">
          <SetupNotice message={loadError} />
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Units to restock"
          value={counts.unitsBelowReorder}
          tone={counts.unitsBelowReorder > 0 ? "warn" : "ok"}
          hint="Below reorder point"
          href="/restock"
        />
        <StatCard
          label="Central items low"
          value={counts.centralLow}
          tone={counts.centralLow > 0 ? "warn" : "ok"}
          hint="Time to buy bulk"
          href="/central"
        />
        <StatCard
          label="Linen issues"
          value={counts.linenShortUnits}
          tone={counts.linenShortUnits > 0 ? "bad" : "ok"}
          hint="Units below par"
          href="/linens"
        />
        <StatCard
          label="Parking missing"
          value={counts.parkingMissing}
          tone={counts.parkingMissing > 0 ? "bad" : "ok"}
          hint="Passes unaccounted"
          href="/parking"
        />
      </div>

      {/* Units */}
      <h2 className="mb-4 mt-10 font-display text-lg font-bold text-bone">
        Units
        <span className="ml-2 text-sm font-medium text-ink-muted">
          {units.length}
        </span>
      </h2>

      {units.length === 0 && !loadError ? (
        <p className="text-sm text-ink-tertiary">
          No units yet. Run <code>supabase/schema.sql</code> to seed the portfolio.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((u) => {
            const r = roll.get(u.unit_id) ?? { consLow: 0, linenShort: 0 };
            const allGood =
              r.consLow === 0 &&
              r.linenShort === 0 &&
              u.parking_status !== "missing";
            return (
              <Link
                key={u.unit_id}
                href={`/unit/${u.unit_id}`}
                className="group rounded-card border border-line bg-surface-2 p-4 shadow-e1 transition duration-150 ease-out hover:-translate-y-px hover:border-line-strong hover:bg-surface-3 hover:shadow-e2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-base font-bold text-bone">
                      {u.name}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {u.parking_pass_label === "None"
                        ? "No parking pass"
                        : `Parking: ${u.parking_pass_label}`}
                    </div>
                  </div>
                  <span className="text-ink-faint transition group-hover:text-ink-tertiary">
                    →
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {allGood && <Pill tone="ok">All good</Pill>}
                  {r.consLow > 0 && (
                    <Pill tone="warn">{r.consLow} to restock</Pill>
                  )}
                  {r.linenShort > 0 && (
                    <Pill tone="bad">{r.linenShort} linen short</Pill>
                  )}
                  {u.parking_status === "missing" && (
                    <Pill tone="bad">Pass missing</Pill>
                  )}
                </div>

                <div className="mt-3 text-[11px] text-ink-faint">
                  Last cleaned {formatWhen(u.last_cleaned_at)}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {recentCleans.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-lg font-bold text-bone">
            Recent cleans
          </h2>
          <div className="overflow-hidden rounded-card border border-line bg-surface-2 shadow-e1">
            {recentCleans.map((c, idx) => (
              <div
                key={`${c.unit_name}-${c.completed_at}-${idx}`}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
                  idx > 0 ? "border-t border-line" : ""
                }`}
              >
                <span className="font-medium text-ink-primary">
                  {c.unit_name ?? "—"}
                </span>
                <span className="flex items-center gap-3 text-xs text-ink-muted">
                  {c.staff_name && <span>{c.staff_name}</span>}
                  <span className="tnum">{formatWhen(c.completed_at)}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
