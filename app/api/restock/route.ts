import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Run the weekly restock for one unit: refill every below-reorder consumable to
// par, drawing down central and logging each transfer (handled atomically by
// the restock_unit RPC). Returns the number of items refilled.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const staff = String(body.staff_name ?? "").trim();
  const unitId = String(body.unit_id ?? "");

  if (!staff || !unitId) {
    return NextResponse.json(
      { error: "Staff name and unit are required." },
      { status: 400 },
    );
  }

  try {
    const sb = getSupabase();
    const { data, error } = await sb.rpc("restock_unit", {
      p_staff: staff,
      p_unit: unitId,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, restocked: data ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
