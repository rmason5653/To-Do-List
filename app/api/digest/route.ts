import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth-context";
import { emailConfigured, sendEmail } from "@/lib/email";
import { listUsers } from "@/lib/users-db";
import { buildDigest } from "@/lib/digest";

export const dynamic = "force-dynamic";

// Admin-triggered "email me the summary now" (also useful for testing alerts).
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer?.role !== "admin")
    return NextResponse.json({ ok: false, error: "Admins only." }, { status: 403 });
  if (!emailConfigured())
    return NextResponse.json(
      { ok: false, error: "Email isn't set up yet (RESEND_API_KEY)." },
      { status: 400 },
    );

  try {
    const origin = new URL(req.url).origin;
    const admins = (await listUsers()).filter(
      (u) => u.role === "admin" && u.status === "active" && u.email,
    );
    const to = admins.map((u) => u.email as string);
    if (to.length === 0)
      return NextResponse.json(
        { ok: false, error: "No admin has an email on file." },
        { status: 400 },
      );

    const digest = await buildDigest(origin);
    await sendEmail(to, digest.subject, digest.html);
    return NextResponse.json({ ok: true, sent: to.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
