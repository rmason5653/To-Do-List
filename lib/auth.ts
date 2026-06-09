export const AUTH_COOKIE = "par_auth";

/** Deterministic token derived from the app password. Used for the access cookie. */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`par:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
