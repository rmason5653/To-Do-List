import { NextResponse } from "next/server";
import { AUTH_COOKIE, hashPassword } from "@/lib/auth";
import { runSync } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authorized(req: Request): Promise<boolean> {
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

async function handle(req: Request) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const status = await runSync();
  return NextResponse.json({ sync: status });
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
