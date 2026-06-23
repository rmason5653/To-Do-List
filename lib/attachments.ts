import { getSupabase } from "./supabase";
import type { Attachment, AttachmentMap } from "./types";

const BUCKET = "task-files";
const COLUMNS = "id,task_id,name,path,mime,size,created_at";
// Signed URLs are minted on read and embedded in the page; an hour comfortably
// outlives a working session and the dashboard re-fetches well before expiry.
const SIGNED_TTL = 60 * 60;

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file

/** Strip path separators / control chars from an uploaded filename so it is safe
 *  to embed in a storage key and to echo back to the browser. */
export function safeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\- ]+/g, "_").trim();
  return cleaned.slice(0, 120) || "file";
}

/** Mint signed URLs for a batch of attachments in one round-trip. */
async function signAll(rows: Attachment[]): Promise<void> {
  if (rows.length === 0) return;
  const sb = getSupabase();
  const { data } = await sb.storage
    .from(BUCKET)
    .createSignedUrls(rows.map((r) => r.path), SIGNED_TTL);
  const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  for (const r of rows) r.url = byPath.get(r.path) ?? null;
}

/** Every attachment, grouped by task id, each carrying a fresh signed URL. */
export async function getAttachmentMap(): Promise<AttachmentMap> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("attachments")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Attachment[];
  await signAll(rows);
  const map: AttachmentMap = {};
  for (const r of rows) (map[r.task_id] ??= []).push(r);
  return map;
}

/** A single task's attachments, with signed URLs. */
export async function listTaskAttachments(taskId: string): Promise<Attachment[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("attachments")
    .select(COLUMNS)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Attachment[];
  await signAll(rows);
  return rows;
}

/** Upload a file to storage and index it against a task. Returns the row with a
 *  signed URL ready for display. */
export async function createAttachment(
  taskId: string,
  file: { name: string; type: string; size: number; bytes: ArrayBuffer },
): Promise<Attachment> {
  const sb = getSupabase();
  const clean = safeName(file.name);
  const path = `${taskId}/${crypto.randomUUID()}-${clean}`;

  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(path, file.bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const { data, error } = await sb
    .from("attachments")
    .insert({
      task_id: taskId,
      name: clean,
      path,
      mime: file.type || null,
      size: file.size,
    })
    .select(COLUMNS)
    .single();
  if (error) {
    // Don't orphan the uploaded object if the index insert fails.
    await sb.storage.from(BUCKET).remove([path]).catch(() => {});
    throw new Error(error.message);
  }

  const row = data as Attachment;
  await signAll([row]);
  return row;
}

/** Delete one attachment (storage object + index row). */
export async function deleteAttachment(id: string): Promise<void> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("attachments")
    .select("path")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return;

  await sb.storage.from(BUCKET).remove([(data as { path: string }).path]);
  const { error: delErr } = await sb.from("attachments").delete().eq("id", id);
  if (delErr) throw new Error(delErr.message);
}

/** Remove all storage objects for a task before it (and its cascading rows) are
 *  deleted, so the bucket doesn't accumulate orphans. */
export async function deleteTaskAttachments(taskId: string): Promise<void> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("attachments")
    .select("path")
    .eq("task_id", taskId);
  if (error) throw new Error(error.message);
  const paths = (data ?? []).map((r) => (r as { path: string }).path);
  if (paths.length > 0) await sb.storage.from(BUCKET).remove(paths);
}
