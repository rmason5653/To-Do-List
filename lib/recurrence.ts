import { getSupabase } from "./supabase";
import { addDays } from "./grouping";
import type { Recurrence, RecurrenceMap } from "./types";

const KEY = "recurrence";

export const RECURRENCE_RULES: Recurrence[] = [
  "daily",
  "weekdays",
  "weekly",
  "biweekly",
  "monthly",
];

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  daily: "Daily",
  weekdays: "Weekdays (Mon–Fri)",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export function isRecurrence(v: unknown): v is Recurrence {
  return typeof v === "string" && (RECURRENCE_RULES as string[]).includes(v);
}

/** The recurrence rules for all tasks, keyed by task id (stored in app_meta). */
export async function getRecurrenceMap(): Promise<RecurrenceMap> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_meta")
    .select("value")
    .eq("key", KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const value = data?.value;
  if (!value || typeof value !== "object") return {};
  const out: RecurrenceMap = {};
  for (const [id, rule] of Object.entries(value as Record<string, unknown>)) {
    if (isRecurrence(rule)) out[id] = rule;
  }
  return out;
}

export async function setRecurrenceMap(map: RecurrenceMap): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("app_meta")
    .upsert({ key: KEY, value: map, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** The next occurrence date (YYYY-MM-DD) one interval after `iso`. */
export function nextDate(iso: string, rule: Recurrence): string {
  if (rule === "daily") return addDays(iso, 1);
  if (rule === "weekly") return addDays(iso, 7);
  if (rule === "biweekly") return addDays(iso, 14);
  if (rule === "weekdays") {
    let d = addDays(iso, 1);
    const dow = new Date(`${d}T00:00:00`).getDay();
    if (dow === 6) d = addDays(d, 2); // Saturday → Monday
    else if (dow === 0) d = addDays(d, 1); // Sunday → Monday
    return d;
  }
  // monthly: same day next month, clamped to that month's last day
  const [y, m, day] = iso.split("-").map(Number);
  const lastDay = new Date(y, m + 1, 0).getDate();
  const target = new Date(y, m, Math.min(day, lastDay));
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
}

/** Due date for a fresh occurrence — on-cadence and not already in the past. */
export function nextDueDate(
  currentDue: string | null,
  rule: Recurrence,
  today: string,
): string {
  let d = nextDate(currentDue ?? today, rule);
  let guard = 0;
  while (d <= today && guard < 120) {
    d = nextDate(d, rule);
    guard += 1;
  }
  return d;
}
