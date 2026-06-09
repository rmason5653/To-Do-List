import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/users";

export const dynamic = "force-dynamic";

// Clears both the per-user session and the shared-password cookie, then
// returns to the login screen. Lets anyone switch accounts / device.
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
