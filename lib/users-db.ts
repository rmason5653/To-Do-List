import { getSupabase } from "./supabase";
import type { AppUser } from "./types";

const COLUMNS =
  "id,name,phone,email,role,status,invite_token,onboarded,created_at,last_login_at";

export async function listUsers(): Promise<AppUser[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_users")
    .select(COLUMNS)
    .order("role", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AppUser[];
}

export async function createUser(
  name: string,
  phone: string | null,
  email: string | null,
  role: "admin" | "cleaner",
): Promise<AppUser> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_users")
    .insert({ name, phone, email, role })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as AppUser;
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_users")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AppUser) ?? null;
}

export async function getUserByInviteToken(token: string): Promise<AppUser | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_users")
    .select(COLUMNS)
    .eq("invite_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AppUser) ?? null;
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<AppUser, "name" | "phone" | "role" | "status">>,
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("app_users").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteUser(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("app_users").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Rotate the invite token (revokes the old login link). */
export async function regenerateInvite(id: string): Promise<string> {
  const sb = getSupabase();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const { error } = await sb
    .from("app_users")
    .update({ invite_token: token })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return token;
}

/** Stamp a login; returns whether this was the user's first (for the walkthrough). */
export async function recordLogin(id: string): Promise<{ firstTime: boolean }> {
  const sb = getSupabase();
  const { data } = await sb
    .from("app_users")
    .select("onboarded")
    .eq("id", id)
    .maybeSingle();
  const firstTime = !(data?.onboarded ?? false);
  await sb
    .from("app_users")
    .update({ last_login_at: new Date().toISOString(), onboarded: true })
    .eq("id", id);
  return { firstTime };
}
