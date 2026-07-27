import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Two callers: the Parking view's confirmation toggle, and the manager's
// pullout-couch switch on the unit page. Each sends only its own field.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (body.parking_status !== undefined) {
    const status = String(body.parking_status);
    if (status !== "ok" && status !== "missing") {
      return NextResponse.json({ error: "Invalid parking status." }, { status: 400 });
    }
    patch.parking_status = status;
    if (status === "ok") patch.parking_confirmed_at = new Date().toISOString();
  }

  if (body.has_pullout !== undefined) {
    if (typeof body.has_pullout !== "boolean") {
      return NextResponse.json({ error: "has_pullout must be true or false." }, { status: 400 });
    }
    patch.has_pullout = body.has_pullout;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const sb = getSupabase();
    const { error } = await sb.from("units").update(patch).eq("unit_id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
