import { NextResponse } from "next/server";
import { deleteTask, getTask, updateTask } from "@/lib/tasks";
import { deleteTaskFromSlack, pushTaskToSlack } from "@/lib/sync";
import { normalizeInput } from "@/lib/normalize";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const existing = await getTask(id);
    if (!existing) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const patch = normalizeInput(body);
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ task: existing });
    }

    const task = await updateTask(id, patch);

    if (task.category === "ops" || existing.category === "ops") {
      try {
        await pushTaskToSlack(task.id);
      } catch {
        // Saved locally; the next sync retries the Slack push.
      }
    }

    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const existing = await getTask(id);
    if (!existing) {
      return NextResponse.json({ ok: true });
    }

    // Tombstone + push the Slack delete before dropping the local row, so a
    // crash mid-delete cannot leave an orphaned row that re-imports later.
    if (existing.category === "ops" && existing.slack_item_id) {
      try {
        await deleteTaskFromSlack(existing.slack_item_id);
      } catch {
        // Saved as a tombstone; the next sync retries the Slack delete.
      }
    }

    await deleteTask(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
