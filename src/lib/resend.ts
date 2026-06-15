import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

/** Resend client (server only). Null if not configured so callers can no-op. */
export const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM || "HYRISE <onboarding@resend.dev>";

/**
 * Send a transactional email. Safely no-ops (logs) if Resend isn't configured,
 * so a missing key never breaks the user flow.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — skipping email:", opts.subject);
    return { skipped: true };
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { skipped: false };
  } catch (err) {
    console.error("[resend] failed to send email", err);
    return { skipped: false, error: true };
  }
}
