// Sends the invite/login link by email via Resend. Free tier covers a small
// team. If RESEND_API_KEY is unset it no-ops (the manual link still works).

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendInviteEmail(
  to: string,
  name: string,
  link: string,
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // not configured — caller falls back to the manual link
  const from = process.env.EMAIL_FROM || "Mason Homes Par <onboarding@resend.dev>";

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0B0B0D">
      <p>Hi ${name},</p>
      <p>You're set up on <b>Mason Homes Par</b>, our inventory app. Tap the button on your phone to log in — no app to download.</p>
      <p>
        <a href="${link}" style="display:inline-block;background:#E20602;color:#F5F2EC;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:700">
          Log in to Par
        </a>
      </p>
      <p style="color:#707176;font-size:13px">Or open this link: <a href="${link}">${link}</a></p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Your Mason Homes Par login",
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email failed (${res.status}): ${detail.slice(0, 200)}`);
  }
}
