import { NextResponse } from "next/server";
import { getUserByInviteToken, recordLogin } from "@/lib/users-db";
import { SESSION_COOKIE, createSessionCookie } from "@/lib/users";

export const dynamic = "force-dynamic";

// The invite link. Validates the token, sets the user's session cookie, and
// sends a first-time user to the walkthrough.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const origin = new URL(req.url).origin;

  try {
    const user = await getUserByInviteToken(token);
    if (!user || user.status !== "active") {
      return NextResponse.redirect(new URL("/login?e=invite", origin));
    }
    const { firstTime } = await recordLogin(user.id);
    const value = await createSessionCookie({
      id: user.id,
      role: user.role,
      name: user.name,
    });
    const res = NextResponse.redirect(new URL(firstTime ? "/guide" : "/", origin));
    res.cookies.set(SESSION_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL("/login?e=invite", origin));
  }
}
