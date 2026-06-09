import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, hashPassword } from "@/lib/auth";
import { SESSION_COOKIE, verifySession } from "@/lib/users";

// Open: the login screen, its endpoint, and the invite link (a new cleaner
// has no session yet — the token in the URL is the credential).
const OPEN_PATHS = ["/login", "/api/login", "/join"];

// Admin-only areas.
const ADMIN_PATHS = ["/settings", "/team"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Resolve the viewer's role: a valid user session wins; otherwise the shared
  // app password bootstraps an admin (so the owner can set up the team).
  let role: "admin" | "cleaner" | null = null;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) {
    role = session.role;
  } else {
    const password = process.env.APP_PASSWORD;
    if (!password) {
      role = "admin"; // no gate configured (local dev)
    } else {
      const cookie = req.cookies.get(AUTH_COOKIE)?.value;
      if (cookie && cookie === (await hashPassword(password))) role = "admin";
    }
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
