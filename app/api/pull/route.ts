import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { listCentralReserve, listUnits } from "@/lib/inventory";
import { REASONS_BY_CATEGORY } from "@/lib/constants";
import type { Category, PullReason } from "@/lib/types";

export const dynamic = "force-dynamic";

// Options for the pull dialog: destination units + central items with stock.
export async function GET() {
  try {
    const [units, reserve] = await Promise.all([
      listUnits(),
      listCentralReserve(),
    ]);
    return NextResponse.json({
      units: units.map((u) => ({ unit_id: u.unit_id, name: u.name })),
      items: reserve.map((r) => ({
        item_name: r.item_name,
        category: r.category,
        quantity_on_hand: r.quantity_on_hand,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const staff = String(body.staff_name ?? "").trim();
  const item = String(body.item_name ?? "").trim();
  const category = String(body.category ?? "") as Category;
  const quantity = Number(body.quantity);
  const unitId = String(body.destination_unit_id ?? "");
  const reason = String(body.reason ?? "") as PullReason;

  if (!staff || !item || !unitId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (category !== "consumable" && category !== "linen") {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Quantity must be a positive whole number." }, { status: 400 });
  }
  if (!REASONS_BY_CATEGORY[category].includes(reason)) {
    return NextResponse.json({ error: "Invalid reason for this item." }, { status: 400 });
  }

  try {
    const sb = getSupabase();
    const { error } = await sb.rpc("log_pull", {
      p_staff: staff,
      p_item: item,
      p_category: category,
      p_qty: quantity,
      p_unit: unitId,
      p_reason: reason,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
