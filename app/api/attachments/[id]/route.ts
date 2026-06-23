import { NextResponse } from "next/server";
import { deleteAttachment } from "@/lib/attachments";

export const dynamic = "force-dynamic";

// Delete a single attachment (storage object + index row).
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    await deleteAttachment(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
