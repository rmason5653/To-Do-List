import { NextResponse } from "next/server";
import { createTask, deleteTask, getTask, updateTask } from "@/lib/tasks";
import { deleteTaskAttachments } from "@/lib/attachments";
import { deleteTaskFromSlack, pushTaskToSlack } from "@/lib/sync";
import { normalizeInput } from "@/lib/normalize";
import { isDone, todayISO } from "@/lib/grouping";
import {
  getRecurrenceMap,
  isRecurrence,
  nextDueDate,
  setRecurrenceMap,
} from "@/lib/recurrence";
import {
  getReminderIds,
  notifyAssignment,
  setReminderIds,
} from "@/lib/notifications";

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

    const task =
      Object.keys(patch).length > 0 ? await updateTask(id, patch) : existing;

    // A recurrence rule passed in the body sets or clears the task's schedule.
    const map = await getRecurrenceMap();
    let mapChanged = false;
    if ("recurrence" in body) {
      if (isRecurrence(body.recurrence)) map[id] = body.recurrence;
      else delete map[id];
      mapChanged = true;
    }

    // The reminder flag opts a task in or out of daily due/overdue DMs.
    let reminderIds = await getReminderIds();
    let remindersChanged = false;
    if ("reminder" in body) {
      const has = reminderIds.includes(id);
      if (body.reminder && !has) {
        reminderIds = [...reminderIds, id];
        remindersChanged = true;
      } else if (!body.reminder && has) {
        reminderIds = reminderIds.filter((x) => x !== id);
        remindersChanged = true;
      }
    }

    // Completing a recurring task spawns the next occurrence and carries the
    // recurrence rule and reminder flag onto it.
    let spawned = null;
    if (!isDone(existing) && isDone(task) && map[id]) {
      const rule = map[id];
      spawned = await createTask({
        title: task.title,
        description: task.description,
        status: "not_started",
        priority: task.priority,
        assignee: task.assignee,
        due_date: nextDueDate(task.due_date, rule, todayISO()),
        completed: false,
        category: task.category,
      });
      delete map[id];
      map[spawned.id] = rule;
      mapChanged = true;
      if (reminderIds.includes(id)) {
        reminderIds = [...reminderIds.filter((x) => x !== id), spawned.id];
        remindersChanged = true;
      }
    }

    if (mapChanged) await setRecurrenceMap(map);
    if (remindersChanged) await setReminderIds(reminderIds);

    if (task.category === "ops" || existing.category === "ops") {
      try {
        await pushTaskToSlack(task.id);
      } catch {
        // Saved locally; the next sync retries the Slack push.
      }
    }
    if (spawned && spawned.category === "ops") {
      try {
        await pushTaskToSlack(spawned.id);
      } catch {
        // Saved locally; the next sync retries the Slack push.
      }
    }

    // Notify a teammate when a task is newly assigned (or reassigned) to them.
    if (task.assignee && task.assignee !== existing.assignee) {
      await notifyAssignment(task);
    }

    return NextResponse.json({
      task,
      spawned,
      recurrence: map,
      reminders: reminderIds,
    });
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

    // Clear storage objects first; the DB rows cascade when the task is gone.
    try {
      await deleteTaskAttachments(id);
    } catch {
      // Orphaned objects are harmless; the index rows still cascade-delete.
    }

    await deleteTask(id);

    try {
      const map = await getRecurrenceMap();
      if (map[id]) {
        delete map[id];
        await setRecurrenceMap(map);
      }
    } catch {
      // A stale recurrence entry is harmless if cleanup fails.
    }
    try {
      const ids = await getReminderIds();
      if (ids.includes(id)) {
        await setReminderIds(ids.filter((x) => x !== id));
      }
    } catch {
      // A stale reminder entry is harmless if cleanup fails.
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
