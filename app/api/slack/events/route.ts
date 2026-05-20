import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function validSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!timestamp || !signature) return false;
  // Reject requests older than 5 minutes (replay protection).
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`v0:${timestamp}:${rawBody}`),
  );
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `v0=${hex}` === signature;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  // Slack's one-time endpoint verification handshake.
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  const secret = process.env.SLACK_SIGNING_SECRET;
  if (secret) {
    const ok = await validSignature(
      rawBody,
      req.headers.get("x-slack-request-timestamp"),
      req.headers.get("x-slack-signature"),
      secret,
    );
    if (!ok) {
      return NextResponse.json({ error: "Bad signature." }, { status: 401 });
    }
  }

  // Any list-related event triggers a reconciliation.
  try {
    await runSync();
  } catch {
    // runSync records its own failure state.
  }

  return NextResponse.json({ ok: true });
}
