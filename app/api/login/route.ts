import { NextResponse } from "next/server";
import { AUTH_COOKIE, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password ?? "");
  const appPassword = process.env.APP_PASSWORD;

  // No password configured — the app is open, so any attempt succeeds.
  if (!appPassword) {
    return NextResponse.json({ ok: true });
  }

  if (password !== appPassword) {
    return NextResponse.json(
      { ok: false, error: "Incorrect password." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await hashPassword(appPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days — the team logs in rarely.
  });
  return res;
}
