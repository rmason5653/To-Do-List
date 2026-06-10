// Posts alerts to a Slack channel via an Incoming Webhook. The webhook URL is
// bound to one channel at creation; set it as SLACK_WEBHOOK_URL. If unset this
// no-ops (same pattern as email), so the app runs fine without it.

export function slackConfigured(): boolean {
  return !!process.env.SLACK_WEBHOOK_URL;
}

export async function sendSlack(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return; // not configured
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Slack post failed (${res.status}): ${detail.slice(0, 200)}`);
  }
}
