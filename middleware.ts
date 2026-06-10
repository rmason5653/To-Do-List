import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/users";

// Open: the login screen, its endpoint, and the invite link (a new cleaner
// has no session yet — the token in the URL is the credential).
const OPEN_PATHS = ["/login", "/api/login", "/api/setup", "/api/cron", "/join"];

// Admin-only areas.
const ADMIN_PATHS = ["/settings", "/team", "/activity"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Login is invite-link only: a valid signed session is required. With no gate
  // configured (local dev) the app stays open.
  let role: "admin" | "cleaner" | null = null;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) {
    role = session.role;
  } else if (!process.env.APP_PASSWORD) {
    role = "admin"; // no gate configured (local dev)
  }

  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    role !== "admin" &&
    ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
