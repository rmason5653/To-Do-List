import { getSupabase } from "./supabase";
import type { AppUser } from "./types";

const COLUMNS =
  "id,name,phone,email,role,status,invite_token,onboarded,created_at,last_login_at";

type AuthUser = AppUser & { password_hash: string | null };

function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function listUsers(): Promise<AppUser[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_users")
    .select(`${COLUMNS},password_hash`)
    .order("role", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  // Never ship the hash to the client — expose only whether a password is set.
  return (data ?? []).map((r) => {
    const { password_hash, ...rest } = r as AuthUser;
    return { ...(rest as AppUser), password_set: !!password_hash };
  });
}

/** Look up a user (with their password hash) by email, for login. */
export async function getAuthUserByEmail(email: string): Promise<AuthUser | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_users")
    .select(`${COLUMNS},password_hash`)
    .ilike("email", email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AuthUser) ?? null;
}

/** Look up a user (with their password hash) by setup-link token. */
export async function getAuthUserByToken(token: string): Promise<AuthUser | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_users")
    .select(`${COLUMNS},password_hash`)
    .eq("invite_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AuthUser) ?? null;
}

/** Store a user's chosen password hash (first-time setup). */
export async function setUserPassword(id: string, passwordHash: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("app_users")
    .update({ password_hash: passwordHash })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Clear the password and issue a fresh setup link (manager "Reset password"). */
export async function resetUserPassword(id: string): Promise<string> {
  const sb = getSupabase();
  const token = randomToken();
  const { error } = await sb
    .from("app_users")
    .update({ password_hash: null, invite_token: token })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return token;
}

/**
 * Names of active team members, for the "who did this" picker on the clean and
 * restock flows. Pass a role to narrow it — restock is manager-run, so that
 * picker asks for "admin" and can't log the run under a cleaner. Returns [] if
 * the table isn't set up yet so those flows still render (the picker just falls
 * back to the logged-in user).
 */
export async function listActiveStaffNames(
  role?: "admin" | "cleaner",
): Promise<string[]> {
  try {
    const sb = getSupabase();
    let q = sb.from("app_users").select("name").eq("status", "active");
    if (role) q = q.eq("role", role);
    const { data, error } = await q.order("name", { ascending: true });
    if (error) return [];
    return (data ?? []).map((r) => r.name as string);
  } catch {
    return [];
  }
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
  patch: Partial<Pick<AppUser, "name" | "phone" | "email" | "role" | "status">>,
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
