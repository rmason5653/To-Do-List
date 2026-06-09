// Per-user sessions for invite-link login. Stateless signed cookie (HMAC-256)
// so the middleware can read identity + role with no database call. Works in
// both the edge middleware and node route handlers (Web Crypto).

export const SESSION_COOKIE = "par_user";

export type SessionRole = "admin" | "cleaner";

export interface Session {
  uid: string;
  role: SessionRole;
  name: string;
}

/** Signing secret. Falls back to APP_PASSWORD so it works before a dedicated
 *  SESSION_SECRET is set; set SESSION_SECRET in production for a stable key. */
function secret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.APP_PASSWORD ||
    "par-insecure-dev-secret"
  );
}

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(t)));
}

async function hmacHex(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build a signed session cookie value for a user. */
export async function createSessionCookie(
  user: { id: string; role: SessionRole; name: string },
  days = 90,
): Promise<string> {
  const exp = Date.now() + days * 86_400_000;
  const payload = b64urlEncode(
    JSON.stringify({ uid: user.id, role: user.role, name: user.name, exp }),
  );
  const sig = await hmacHex(payload);
  return `${payload}.${sig}`;
}

/** Verify a session cookie; returns the session or null if invalid/expired. */
export async function verifySession(value: string | undefined): Promise<Session | null> {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if ((await hmacHex(payload)) !== sig) return null;
  try {
    const obj = JSON.parse(b64urlDecode(payload)) as {
      uid: string;
      role: SessionRole;
      name: string;
      exp: number;
    };
    if (!obj.exp || obj.exp < Date.now()) return null;
    if (obj.role !== "admin" && obj.role !== "cleaner") return null;
    return { uid: obj.uid, role: obj.role, name: obj.name };
  } catch {
    return null;
  }
}
