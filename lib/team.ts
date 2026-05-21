import { getSupabase } from "./supabase";
import type { TeamMember } from "./types";

const TEAM_KEY = "slack_team";

export interface TeamRecord {
  members: TeamMember[];
  updatedAt: string;
}

/** The cached workspace directory, or null if it has never been synced. */
export async function getTeamRecord(): Promise<TeamRecord | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_meta")
    .select("value")
    .eq("key", TEAM_KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const record = data?.value as TeamRecord | null;
  return record && Array.isArray(record.members) ? record : null;
}

export async function getTeam(): Promise<TeamMember[]> {
  return (await getTeamRecord())?.members ?? [];
}

export async function setTeam(members: TeamMember[]): Promise<void> {
  const sb = getSupabase();
  const record: TeamRecord = { members, updatedAt: new Date().toISOString() };
  const { error } = await sb
    .from("app_meta")
    .upsert({ key: TEAM_KEY, value: record, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
