// Server-side viewer (role) resolution for pages and route handlers.
// A valid user session wins; otherwise the shared app password bootstraps an
// admin (so the owner can set up the Team before everyone has accounts).

import { cookies } from "next/headers";
import { AUTH_COOKIE, hashPassword } from "./auth";
import { SESSION_COOKIE, verifySession, type SessionRole } from "./users";

export interface Viewer {
  role: SessionRole;
  name: string;
  uid: string | null; // null for the shared-password bootstrap admin
}

export async function getViewer(): Promise<Viewer | null> {
  const c = await cookies();

  const session = await verifySession(c.get(SESSION_COOKIE)?.value);
  if (session) return { role: session.role, name: session.name, uid: session.uid };

  const pw = process.env.APP_PASSWORD;
  if (!pw) return { role: "admin", name: "Team", uid: null }; // no gate (dev)
  const cookie = c.get(AUTH_COOKIE)?.value;
  if (cookie && cookie === (await hashPassword(pw))) {
    return { role: "admin", name: "Team", uid: null };
  }
  return null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getViewer())?.role === "admin";
}
