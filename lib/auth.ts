export const AUTH_COOKIE = "ops_auth";

/** Deterministic token derived from the app password. Used for the access cookie. */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`ops-todo:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Whether a request may run a protected job endpoint (sync, reminders).
 * Accepts the cron secret, Vercel's cron header, or a valid access cookie.
 */
export async function isAuthorizedRequest(req: Request): Promise<boolean> {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return true;

  const auth = req.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  // Vercel cron sends this header even without a secret.
  if (!cronSecret && req.headers.get("x-vercel-cron")) return true;

  const cookie = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AUTH_COOKIE}=`))
    ?.slice(AUTH_COOKIE.length + 1);
  if (cookie && cookie === (await hashPassword(appPassword))) return true;

  return false;
}
