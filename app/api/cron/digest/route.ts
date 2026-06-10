import { NextResponse } from "next/server";
import { emailConfigured, sendEmail } from "@/lib/email";
import { listUsers } from "@/lib/users-db";
import { buildDigest } from "@/lib/digest";

export const dynamic = "force-dynamic";

// Scheduled daily digest (Vercel Cron). Only emails when there's something to
// act on, so quiet days don't generate noise. Secured by CRON_SECRET when set
// (Vercel includes it as a Bearer token on cron requests).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ ok: false, skipped: "email not configured" });
  }

  try {
    const origin = new URL(req.url).origin;
    const to = (await listUsers())
      .filter((u) => u.role === "admin" && u.status === "active" && u.email)
      .map((u) => u.email as string);
    if (to.length === 0) return NextResponse.json({ ok: false, skipped: "no admin emails" });

    const digest = await buildDigest(origin);
    if (!digest.anyIssues) return NextResponse.json({ ok: true, skipped: "all good" });

    await sendEmail(to, digest.subject, digest.html);
    return NextResponse.json({ ok: true, sent: to.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
