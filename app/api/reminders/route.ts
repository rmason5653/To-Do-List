import { NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { runDueReminders } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: Request) {
  if (!(await isAuthorizedRequest(req))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const result = await runDueReminders();
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
