import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Quick parking-pass confirmation toggle from the Parking view.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.parking_status ?? "");

  if (status !== "ok" && status !== "missing") {
    return NextResponse.json({ error: "Invalid parking status." }, { status: 400 });
  }

  try {
    const sb = getSupabase();
    const patch: Record<string, unknown> = { parking_status: status };
    if (status === "ok") patch.parking_confirmed_at = new Date().toISOString();
    const { error } = await sb.from("units").update(patch).eq("unit_id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
