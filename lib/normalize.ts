import type { Category, Status, TaskInput } from "./types";

const STATUSES: Status[] = ["not_started", "in_progress", "done"];
const CATEGORIES: Category[] = ["ops", "personal"];

/**
 * Turn an untrusted request body into a safe, whitelisted task patch and keep
 * `status` and `completed` consistent with each other.
 */
export function normalizeInput(body: unknown): Partial<TaskInput> {
  const b = (body ?? {}) as Record<string, unknown>;
  const out: Partial<TaskInput> = {};

  if (typeof b.title === "string" && b.title.trim()) {
    out.title = b.title.trim();
  }
  if ("description" in b) {
    out.description = b.description ? String(b.description) : null;
  }
  if (typeof b.status === "string" && STATUSES.includes(b.status as Status)) {
    out.status = b.status as Status;
  }
  if ("priority" in b) {
    if (b.priority === null || b.priority === "" || b.priority === undefined) {
      out.priority = null;
    } else {
      const n = Number(b.priority);
      out.priority = Number.isNaN(n) ? null : n;
    }
  }
  if ("assignee" in b) {
    out.assignee = b.assignee ? String(b.assignee) : null;
  }
  if ("due_date" in b) {
    const d = b.due_date;
    out.due_date =
      d && /^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? String(d) : null;
  }
  if (typeof b.completed === "boolean") {
    out.completed = b.completed;
  }
  if (typeof b.category === "string" && CATEGORIES.includes(b.category as Category)) {
    out.category = b.category as Category;
  }

  // Reconcile status <-> completed.
  if (out.completed === true) {
    out.status = "done";
  } else if (out.completed === false) {
    if (!out.status || out.status === "done") out.status = "not_started";
  }
  if (out.status === "done") {
    out.completed = true;
  } else if (out.status === "in_progress" || out.status === "not_started") {
    out.completed = false;
  }

  return out;
}
