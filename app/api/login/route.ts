import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The shared team password has been retired — login is invite-link only.
// Kept as a tombstone so any old client gets a clear message instead of a 404.
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "Team password login has been retired. Use your personal login link.",
    },
    { status: 410 },
  );
}
