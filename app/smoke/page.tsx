import { notFound } from "next/navigation";
import SmokeClient from "./SmokeClient";

// Dev/CI-only harness for the e2e smoke test — it mounts a real TaskRow so the
// title paragraph-break behaviour can be driven by a headless browser.
// Hidden in production (the live site never exposes it).
export const dynamic = "force-dynamic";

export default function SmokePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SmokeClient />;
}
