import { getSupabase } from "./supabase";
import type { SyncStatus, Task, TaskInput } from "./types";

const COLUMNS =
  "id,title,description,status,priority,assignee,due_date,completed,category,slack_item_id,position,created_at,updated_at,last_synced_at";

export async function listTasks(): Promise<Task[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("tasks")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}

export async function getTask(id: string): Promise<Task | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("tasks")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Task) ?? null;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const sb = getSupabase();
  const now = new Date().toISOString();
  // A task imported from Slack carries last_synced_at; align updated_at to it
  // so the sync engine does not treat the fresh row as a pending local edit.
  const row: Record<string, unknown> = {
    ...input,
    updated_at: input.last_synced_at ?? now,
  };
  const { data, error } = await sb
    .from("tasks")
    .insert(row)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Task;
}

/**
 * Update a task. A normal edit bumps `updated_at` (marking it as a pending
 * local change to push to Slack). A sync write passes `last_synced_at` and
 * leaves `updated_at` untouched so it is not mistaken for a pending change.
 */
export async function updateTask(
  id: string,
  patch: Partial<TaskInput> & { last_synced_at?: string | null },
): Promise<Task> {
  const sb = getSupabase();
  const row: Record<string, unknown> = { ...patch };
  if (!("last_synced_at" in patch)) {
    row.updated_at = new Date().toISOString();
  }
  const { data, error } = await sb
    .from("tasks")
    .update(row)
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

const SYNC_KEY = "sync_status";

export async function getSyncStatus(): Promise<SyncStatus | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_meta")
    .select("value")
    .eq("key", SYNC_KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.value as SyncStatus) ?? null;
}

export async function setSyncStatus(status: SyncStatus): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("app_meta")
    .upsert({ key: SYNC_KEY, value: status, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
