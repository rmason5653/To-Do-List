import { getSupabase } from "./supabase";
import { listTasks } from "./tasks";
import { sendDirectMessage, slackEnabled } from "./slack";
import { isDone, todayISO } from "./grouping";
import type { Task } from "./types";

const KEY = "reminders";
const USER_ID = /^[UW][A-Z0-9]+$/;

/** Task ids opted in to a daily due/overdue reminder (stored in app_meta). */
export async function getReminderIds(): Promise<string[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_meta")
    .select("value")
    .eq("key", KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const value = data?.value;
  return Array.isArray(value) ? (value as string[]) : [];
}

export async function setReminderIds(ids: string[]): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("app_meta")
    .upsert({ key: KEY, value: ids, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

/** DM a teammate that a task was just assigned to them. Best-effort. */
export async function notifyAssignment(task: Task): Promise<void> {
  if (!slackEnabled()) return;
  if (!task.assignee || !USER_ID.test(task.assignee)) return;
  const due = task.due_date ? ` — due ${task.due_date}` : "";
  try {
    await sendDirectMessage(
      task.assignee,
      `You've been assigned a task: *${task.title}*${due}.`,
    );
  } catch {
    // Best effort — a failed notification must never fail the task edit.
  }
}

/** DM the assignee of every reminder-flagged task that is due or overdue. */
export async function runDueReminders(): Promise<{ sent: number; due: number }> {
  if (!slackEnabled()) return { sent: 0, due: 0 };
  const flagged = new Set(await getReminderIds());
  if (flagged.size === 0) return { sent: 0, due: 0 };

  const today = todayISO();
  const tasks = await listTasks();
  let sent = 0;
  let due = 0;

  for (const t of tasks) {
    if (!flagged.has(t.id) || isDone(t)) continue;
    if (!t.due_date || t.due_date > today) continue;
    if (!t.assignee || !USER_ID.test(t.assignee)) continue;
    due += 1;
    const text =
      t.due_date === today
        ? `Reminder: *${t.title}* is due today.`
        : `Reminder: *${t.title}* is overdue — it was due ${t.due_date}.`;
    try {
      await sendDirectMessage(t.assignee, text);
      sent += 1;
    } catch {
      // Skip a failed DM; the next daily run retries it.
    }
  }
  return { sent, due };
}
