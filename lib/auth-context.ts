// Server-side viewer (role) resolution for pages and route handlers.
// Login is invite-link only: a valid signed user session is required. (With no
// APP_PASSWORD configured — local dev — the app stays open as admin.)

import { cookies } from "next/headers";
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

  // No session: invite-link login is required. With no gate configured (local
  // dev) the app stays open as admin.
  if (!process.env.APP_PASSWORD) return { role: "admin", name: "Team", uid: null };
  return null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getViewer())?.role === "admin";
}
