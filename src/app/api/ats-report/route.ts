import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { reportEmailHtml, type AtsReport } from "@/lib/ats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The email gate on the ATS result screen (§5.2).
 *
 * The visitor has a score and two of six categories on screen. They give an
 * email; we send the full six-category report immediately and register them
 * for the day-2 / day-5 / day-10 sequence.
 *
 * ── Why this is the highest-leverage endpoint on the site ───────────────────
 * The ATS result screen is the most motivated a stranger will ever be about
 * HYRISE: they have just been told a number about themselves and want to know
 * why. Before this existed, that moment ended in a dead end and the person was
 * gone with no way to reach them. This is the only place we convert attention
 * into a relationship.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const CAPTURE_DAILY_LIMIT = 5;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hyrise.swache.in";

export async function POST(request: Request) {
  const { allowed, retryAfter } = await rateLimit(clientKey(request, "ats-report"), CAPTURE_DAILY_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests from this device today." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: { email?: string; reportToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").toLowerCase().trim();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const token = (body.reportToken ?? "").trim();
  if (!token) {
    return NextResponse.json({ error: "That report has expired. Please run the check again." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: pending } = await supabase
    .from("ats_pending_reports")
    .select("id, report")
    .eq("id", token)
    .single();

  if (!pending?.report) {
    // Reports are pruned after 24 hours. Say so plainly rather than failing
    // with something the visitor can't act on.
    return NextResponse.json(
      { error: "That report has expired. Run the check again and we'll email it straight away." },
      { status: 404 }
    );
  }

  const report = pending.report as AtsReport;

  // Store the lead with the report attached, so the day-2 email can quote
  // their actual worst finding rather than sending everyone the same tip.
  const { error: leadError } = await supabase.from("ats_leads").upsert(
    {
      email,
      ats_score: report.score,
      report,
      source: "ats-result-gate",
      sequence_stage: 1, // Day 0 is being sent right now, below.
      last_emailed_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (leadError) {
    console.error("[ats-report] lead upsert failed:", leadError.message);
    // Keep going. Failing to record the lead is our problem; the person still
    // gets the report they asked for.
  }

  const unsubscribeUrl = `${APP_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  const sendResult = await sendEmail({
    to: email,
    subject: `Your full ATS report — ${report.score}/100`,
    html: reportEmailHtml(report, { appUrl: APP_URL, unsubscribeUrl }),
  });

  await supabase
    .from("ats_pending_reports")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", token);

  return NextResponse.json({
    ok: true,
    emailed: !sendResult.skipped && !sendResult.error,
    // The full report goes back in the response too. Making them leave for
    // their inbox to see what they just unlocked is how you lose them to their
    // inbox — show it immediately, and let the email be the thing that brings
    // them back later.
    findings: report.findings,
    score: report.score,
  });
}
