import { getSupabase } from "./supabase";
import type {
  CentralReserveItem,
  ConsumablePar,
  LinenPar,
  PullLogEntry,
  Unit,
} from "./types";

// ---------------------------------------------------------------------------
// Raw reads
// ---------------------------------------------------------------------------

export async function listUnits(): Promise<Unit[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("units")
    .select("*")
    .order("sort", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Unit[];
}

export async function getUnit(id: string): Promise<Unit | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("units")
    .select("*")
    .eq("unit_id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Unit) ?? null;
}

export async function listConsumables(unitId?: string): Promise<ConsumablePar[]> {
  const sb = getSupabase();
  let q = sb.from("consumable_par").select("*").order("sort", { ascending: true });
  if (unitId) q = q.eq("unit_id", unitId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as ConsumablePar[];
}

export async function listLinens(unitId?: string): Promise<LinenPar[]> {
  const sb = getSupabase();
  let q = sb.from("linen_par").select("*").order("sort", { ascending: true });
  if (unitId) q = q.eq("unit_id", unitId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as LinenPar[];
}

export async function listCentralReserve(): Promise<CentralReserveItem[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("central_reserve")
    .select("*")
    .order("sort", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CentralReserveItem[];
}

export async function listPullLog(limit = 200): Promise<PullLogEntry[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("central_pull_log")
    .select("*")
    .order("pulled_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as PullLogEntry[];
}

// ---------------------------------------------------------------------------
// Derived views (computed from the raw reads)
// ---------------------------------------------------------------------------

export interface UnitRestock {
  unit: Unit;
  items: { par: ConsumablePar; needed: number }[];
}

/** View 1 — every unit with at least one consumable at/below reorder. */
export function buildRestockRun(
  units: Unit[],
  consumables: ConsumablePar[],
): UnitRestock[] {
  const byUnit = new Map<string, UnitRestock>();
  for (const u of units) byUnit.set(u.unit_id, { unit: u, items: [] });
  for (const c of consumables) {
    if (c.current_actual <= c.reorder_point) {
      const needed = c.closet_par - c.current_actual;
      if (needed > 0) byUnit.get(c.unit_id)?.items.push({ par: c, needed });
    }
  }
  return units
    .map((u) => byUnit.get(u.unit_id)!)
    .filter((r) => r.items.length > 0);
}

export interface UnitLinens {
  unit: Unit;
  linens: LinenPar[];
  short: LinenPar[];
}

/** View 3 — par vs actual linens per unit, flagging any unit below par. */
export function buildLinenIntegrity(
  units: Unit[],
  linens: LinenPar[],
): UnitLinens[] {
  const byUnit = new Map<string, LinenPar[]>();
  for (const l of linens) {
    const arr = byUnit.get(l.unit_id) ?? [];
    arr.push(l);
    byUnit.set(l.unit_id, arr);
  }
  return units.map((u) => {
    const ls = byUnit.get(u.unit_id) ?? [];
    return {
      unit: u,
      linens: ls,
      short: ls.filter((l) => l.current_actual < l.par_count),
    };
  });
}

export interface DashboardCounts {
  unitsBelowReorder: number;
  centralLow: number;
  linenShortUnits: number;
  parkingMissing: number;
}

export function buildCounts(
  units: Unit[],
  consumables: ConsumablePar[],
  linens: LinenPar[],
  reserve: CentralReserveItem[],
): DashboardCounts {
  const restock = buildRestockRun(units, consumables);
  const integrity = buildLinenIntegrity(units, linens);
  return {
    unitsBelowReorder: restock.length,
    centralLow: reserve.filter((r) => r.quantity_on_hand <= r.reorder_point).length,
    linenShortUnits: integrity.filter((u) => u.short.length > 0).length,
    parkingMissing: units.filter((u) => u.parking_status === "missing").length,
  };
}
