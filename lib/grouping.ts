import type { Task } from "./types";

export interface TaskGroup {
  id: string;
  title: string;
  tasks: Task[];
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

function byRecent(a: Task, b: Task): number {
  return b.updated_at.localeCompare(a.updated_at);
}

/** Group tasks by due-date proximity; completed tasks collected last. */
export function groupByTime(tasks: Task[], today: string): TaskGroup[] {
  const weekEnd = addDays(today, 7);
  const overdue: Task[] = [];
  const dueToday: Task[] = [];
  const week: Task[] = [];
  const later: Task[] = [];
  const anytime: Task[] = [];
  const done: Task[] = [];

  for (const t of tasks) {
    if (isDone(t)) {
      done.push(t);
    } else if (!t.due_date) {
      anytime.push(t);
    } else if (t.due_date < today) {
      overdue.push(t);
    } else if (t.due_date === today) {
      dueToday.push(t);
    } else if (t.due_date <= weekEnd) {
      week.push(t);
    } else {
      later.push(t);
    }
  }
  [overdue, dueToday, week, later, anytime].forEach((g) => g.sort(compareActive));
  done.sort(byRecent);

  return [
    { id: "overdue", title: "Overdue", tasks: overdue },
    { id: "today", title: "Today", tasks: dueToday },
    { id: "week", title: "This week", tasks: week },
    { id: "later", title: "Later", tasks: later },
    { id: "anytime", title: "Anytime", tasks: anytime },
    { id: "done", title: "Recently done", tasks: done },
  ];
}

/** Group tasks by priority (3 → none); completed tasks collected last. */
export function groupByPriority(tasks: Task[]): TaskGroup[] {
  const byP: Record<number, Task[]> = { 3: [], 2: [], 1: [], 0: [] };
  const none: Task[] = [];
  const done: Task[] = [];

  for (const t of tasks) {
    if (isDone(t)) {
      done.push(t);
    } else if (t.priority != null && byP[t.priority]) {
      byP[t.priority].push(t);
    } else {
      none.push(t);
    }
  }
  [byP[3], byP[2], byP[1], byP[0], none].forEach((g) => g.sort(compareActive));
  done.sort(byRecent);

  return [
    { id: "p3", title: "Priority 3", tasks: byP[3] },
    { id: "p2", title: "Priority 2", tasks: byP[2] },
    { id: "p1", title: "Priority 1", tasks: byP[1] },
    { id: "p0", title: "Priority 0", tasks: byP[0] },
    { id: "none", title: "No priority", tasks: none },
    { id: "done", title: "Recently done", tasks: done },
  ];
}

/** Human-friendly relative label for a due date. */
export function dueLabel(due: string, today: string): string {
  if (due === today) return "Today";
  if (due === addDays(today, 1)) return "Tomorrow";
  if (due === addDays(today, -1)) return "Yesterday";
  if (due < today) {
    return `${daysBetween(due, today)}d overdue`;
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
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
