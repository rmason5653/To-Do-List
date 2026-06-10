import { getSupabase } from "./supabase";

// Records who changed a stock number, when, and from what to what. Best-effort:
// a logging failure must never break the action it's recording.
export async function logAudit(entry: {
  actor: string;
  action: string;
  item?: string | null;
  unit_name?: string | null;
  detail?: string | null;
}): Promise<void> {
  try {
    const sb = getSupabase();
    await sb.from("stock_audit").insert({
      actor: entry.actor || "Unknown",
      action: entry.action,
      item: entry.item ?? null,
      unit_name: entry.unit_name ?? null,
      detail: entry.detail ?? null,
    });
  } catch {
    /* swallow — never let an audit write break the user's action */
  }
}
