import type { Task } from "./types";

export type Bucket =
  | "overdue"
  | "dueToday"
  | "thisWeek"
  | "later"
  | "someday"
  | "done";

export interface Groups {
  overdue: Task[];
  dueToday: Task[];
  thisWeek: Task[];
  later: Task[];
  someday: Task[];
  done: Task[];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local-time YYYY-MM-DD for "today". */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Add days to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function isDone(t: Task): boolean {
  return t.completed || t.status === "done";
}

function compareActive(a: Task, b: Task): number {
  const ad = a.due_date ?? "9999-99-99";
  const bd = b.due_date ?? "9999-99-99";
  if (ad !== bd) return ad < bd ? -1 : 1;
  const ap = a.priority ?? -1;
  const bp = b.priority ?? -1;
  if (ap !== bp) return bp - ap;
  return a.title.localeCompare(b.title);
}

/** Sort tasks into the dashboard buckets relative to `today`. */
export function groupTasks(tasks: Task[], today: string): Groups {
  const weekEnd = addDays(today, 7);
  const g: Groups = {
    overdue: [],
    dueToday: [],
    thisWeek: [],
    later: [],
    someday: [],
    done: [],
  };

  for (const t of tasks) {
    if (isDone(t)) {
      g.done.push(t);
      continue;
    }
    if (!t.due_date) {
      g.someday.push(t);
      continue;
    }
    if (t.due_date < today) g.overdue.push(t);
    else if (t.due_date === today) g.dueToday.push(t);
    else if (t.due_date <= weekEnd) g.thisWeek.push(t);
    else g.later.push(t);
  }

  g.overdue.sort(compareActive);
  g.dueToday.sort(compareActive);
  g.thisWeek.sort(compareActive);
  g.later.sort(compareActive);
  g.someday.sort(compareActive);
  g.done.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return g;
}

/** Human-friendly relative label for a due date. */
export function dueLabel(due: string, today: string): string {
  if (due === today) return "Today";
  if (due === addDays(today, 1)) return "Tomorrow";
  if (due === addDays(today, -1)) return "Yesterday";
  if (due < today) {
    const days = daysBetween(due, today);
    return `${days}d overdue`;
  }
  const ahead = daysBetween(today, due);
  if (ahead <= 7) return `In ${ahead}d`;
  const [y, m, d] = due.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[m - 1]} ${d}${y !== new Date().getFullYear() ? `, ${y}` : ""}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = Date.UTC(ay, am - 1, ad);
  const db = Date.UTC(by, bm - 1, bd);
  return Math.round((db - da) / 86400000);
}
