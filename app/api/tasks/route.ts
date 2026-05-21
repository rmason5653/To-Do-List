import { NextResponse } from "next/server";
import { createTask, getSyncStatus, listTasks } from "@/lib/tasks";
import { getTeam } from "@/lib/team";
import { getRecurrenceMap } from "@/lib/recurrence";
import { getReminderIds, notifyAssignment } from "@/lib/notifications";
import { pushTaskToSlack } from "@/lib/sync";
import { normalizeInput } from "@/lib/normalize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [tasks, sync, team, recurrence, reminders] = await Promise.all([
      listTasks(),
      getSyncStatus(),
      getTeam(),
      getRecurrenceMap(),
      getReminderIds(),
    ]);
    return NextResponse.json({ tasks, sync, team, recurrence, reminders });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const input = normalizeInput(body);
    if (!input.title || !input.title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    const task = await createTask({ title: input.title.trim(), ...input });

    if (task.category === "ops") {
      try {
        await pushTaskToSlack(task.id);
      } catch {
        // Saved locally; the next sync retries the Slack push.
      }
    }
    if (task.assignee) {
      await notifyAssignment(task);
    }

    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
