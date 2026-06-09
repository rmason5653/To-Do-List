import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Purchasing actions on a central reserve item: receive bulk stock (add) and/or
// adjust the reorder point or par (target) level.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const add = body.add === undefined ? null : Number(body.add);
  const reorder = body.reorder_point === undefined ? null : Number(body.reorder_point);
  const par = body.par_level === undefined ? null : Number(body.par_level);

  if (add !== null && (!Number.isInteger(add) || add < 1)) {
    return NextResponse.json({ error: "Amount to receive must be a positive whole number." }, { status: 400 });
  }
  if (reorder !== null && (!Number.isInteger(reorder) || reorder < 0)) {
    return NextResponse.json({ error: "Reorder point must be zero or a positive whole number." }, { status: 400 });
  }
  if (par !== null && (!Number.isInteger(par) || par < 0)) {
    return NextResponse.json({ error: "Par level must be zero or a positive whole number." }, { status: 400 });
  }

  try {
    const sb = getSupabase();
    const { data: row, error: rErr } = await sb
      .from("central_reserve")
      .select("quantity_on_hand")
      .eq("id", id)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!row) return NextResponse.json({ error: "Item not found." }, { status: 404 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (add !== null) patch.quantity_on_hand = row.quantity_on_hand + add;
    if (reorder !== null) patch.reorder_point = reorder;
    if (par !== null) patch.par_level = par;

    const { error } = await sb.from("central_reserve").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
