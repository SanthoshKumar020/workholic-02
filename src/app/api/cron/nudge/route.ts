import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily re-engagement nudge.
 *
 * `last_active` and `streak` have always been in `profiles` and no job ever
 * read them — nothing in the product ever invited a user back. This is the
 * cheapest retention mechanism available and it needs no new tables.
 *
 * ── Deliberate restraint ────────────────────────────────────────────────────
 * These people are job hunting. That is already an anxious, rejection-heavy
 * process, and it is easy to make a "productivity" tool feel like one more
 * thing they are failing at. So:
 *
 *   • At most ONE nudge per user per week (`last_nudged_at`).
 *   • Nothing at all until they've been away 3 days — no daily pestering.
 *   • Nothing after 30 days away; at that point they've moved on and more
 *     email is spam, not a reminder.
 *   • Streak mentions are framed as "still alive" rather than "about to be
 *     lost". A grace day exists precisely so this is true.
 *   • No fake urgency, no invented counts, no "we miss you!".
 *   • Every email carries a working unsubscribe.
 *
 * A nudge that makes someone feel guilty gets the app abandoned, which costs
 * far more than the open it might have won.
 */

const MIN_DAYS_AWAY = 3;
const MAX_DAYS_AWAY = 30;
const MIN_DAYS_BETWEEN_NUDGES = 7;
/** Keeps one cron invocation inside the serverless time budget. */
const MAX_EMAILS_PER_RUN = 200;

type NudgeProfile = {
  id: string;
  email: string | null;
  target_role: string | null;
  streak: number | null;
  last_active: string | null;
  last_nudged_at: string | null;
  nudge_opt_out: boolean | null;
};

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  return Math.floor((Date.now() - then) / 86_400_000);
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Pick the single most relevant thing to say. One message, one action. */
function composeNudge(p: NudgeProfile, away: number, appUrl: string) {
  const role = p.target_role?.trim();
  const streak = p.streak ?? 0;

  // A streak still within the grace window is genuinely recoverable, so this
  // is a true statement rather than manufactured pressure.
  if (streak >= 3 && away <= 2) {
    return {
      subject: `Your ${streak}-day streak is still going`,
      heading: `${streak} days in a row`,
      body: `You've been at this ${streak} days running. One small thing today keeps it going — a mock interview question, or a quick tailor of your resume.`,
      cta: "Keep it going",
      href: `${appUrl}/dashboard`,
    };
  }

  if (role) {
    return {
      subject: `Ready for the next ${role} application?`,
      heading: `Still going for ${role}?`,
      body: `Tailoring your resume to a specific posting is the highest-return 10 minutes in a job hunt — it usually moves an ATS score 15–25 points. Yours is saved and ready.`,
      cta: "Tailor my resume",
      href: `${appUrl}/tailor`,
    };
  }

  return {
    subject: "Your resume is still waiting",
    heading: "Pick up where you left off",
    body: "Your saved resume is here whenever you want it. A quick ATS re-check takes about 20 seconds and tells you what to fix next.",
    cta: "Open HYRISE",
    href: `${appUrl}/dashboard`,
  };
}

function buildHtml(n: ReturnType<typeof composeNudge>, appUrl: string, userId: string) {
  const unsubscribe = `${appUrl}/api/unsubscribe?u=${encodeURIComponent(userId)}`;
  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px">
      <p style="margin:0;font-size:20px;font-weight:800;color:#fff">${esc(n.heading)}</p>
    </div>
    <div style="padding:24px 28px">
      <p style="margin:0;font-size:15px;line-height:1.6;color:#334155">${esc(n.body)}</p>
      <div style="margin:26px 0 8px">
        <a href="${esc(n.href)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 26px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none">${esc(n.cta)} →</a>
      </div>
      <p style="margin-top:26px;font-size:11px;color:#94a3b8">
        You're getting this because you have a HYRISE account. We send at most one of these a week.<br>
        <a href="${unsubscribe}" style="color:#6366f1">Stop these reminders</a>
      </p>
    </div>
  </div>
</body></html>`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email not configured." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hyrise.swache.in";

  const awayCutoff = new Date(Date.now() - MIN_DAYS_AWAY * 86_400_000).toISOString();
  const staleCutoff = new Date(Date.now() - MAX_DAYS_AWAY * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, target_role, streak, last_active, last_nudged_at, nudge_opt_out")
    .not("email", "is", null)
    .not("last_active", "is", null)
    .lte("last_active", awayCutoff)
    .gte("last_active", staleCutoff)
    .limit(MAX_EMAILS_PER_RUN);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const candidates = (data as NudgeProfile[]) ?? [];
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const p of candidates) {
    if (p.nudge_opt_out) {
      skipped++;
      continue;
    }

    const sinceNudge = daysSince(p.last_nudged_at);
    if (sinceNudge !== null && sinceNudge < MIN_DAYS_BETWEEN_NUDGES) {
      skipped++;
      continue;
    }

    const away = daysSince(p.last_active);
    if (away === null) {
      skipped++;
      continue;
    }

    try {
      const nudge = composeNudge(p, away, appUrl);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "HYRISE <noreply@hyrise.swache.in>",
        to: p.email!,
        subject: nudge.subject,
        html: buildHtml(nudge, appUrl, p.id),
      });

      // Record the send even on partial failure paths below, so a retry of
      // this cron can't double-send to the same person.
      await supabase
        .from("profiles")
        .update({ last_nudged_at: new Date().toISOString() })
        .eq("id", p.id);

      sent++;
    } catch (e) {
      errors.push(`${p.id}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return NextResponse.json({ message: `Nudged ${sent}, skipped ${skipped}.`, sent, skipped, errors });
}
