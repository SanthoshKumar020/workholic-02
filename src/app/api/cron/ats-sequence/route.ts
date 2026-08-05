import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { escapeHtml, type AtsReport, type AtsFinding } from "@/lib/ats";
import { STUDENT_PLAN } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The ATS lead nurture sequence (§5.4).
 *
 *   Day 0  — full report            (sent inline by /api/ats-report)
 *   Day 2  — their single biggest issue, with the fix
 *   Day 5  — one interview question for their level, with a model answer
 *   Day 10 — what Student adds, and the ₹299 offer
 *
 * ── Why this is worth building before more tools ────────────────────────────
 * Emails were already being collected for "weekly tips" that never went out,
 * because the blog is dormant. A capture form with nothing behind it is worse
 * than no capture form: it spends the one moment of trust you get and returns
 * nothing. This is the minimum that makes the ask honest.
 *
 * ── Why each email quotes their actual report ───────────────────────────────
 * The lead row carries the six findings. Day 2 names the specific thing wrong
 * with *their* resume, in their own words where possible. Generic advice is
 * what the rest of the internet already sends them, and it is why the rest of
 * the internet's emails go unread.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hyrise.swache.in";

/** stage → how many days after capture this email goes out. */
const SCHEDULE: Record<number, number> = { 1: 2, 2: 5, 3: 10 };

/** Don't send more than this per run — a free-tier function and a sending quota. */
const BATCH_SIZE = 60;

type Lead = {
  id: string;
  email: string;
  ats_score: number | null;
  report: AtsReport | null;
  sequence_stage: number;
  created_at: string;
};

const shell = (email: string, inner: string) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;padding:24px 0">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
    <tr><td style="color:#334155;font-size:15px;line-height:1.7">
      ${inner}
      <p style="margin:28px 0 0;font-size:11px;line-height:1.6;color:#94a3b8">
        You're getting this because you ran a free ATS check on HYRISE.
        <a href="${APP_URL}/api/unsubscribe?email=${encodeURIComponent(email)}" style="color:#94a3b8">Unsubscribe</a>.
      </p>
    </td></tr>
  </table>
</div>`;

const button = (href: string, label: string) => `
<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td>
  <a href="${APP_URL}${href}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:12px">${label}</a>
</td></tr></table>`;

/** The finding most worth writing an entire email about. */
function worstFinding(report: AtsReport | null): AtsFinding | null {
  if (!report?.findings?.length) return null;
  return (
    report.findings.find((f) => f.status === "fail") ??
    report.findings.find((f) => f.status === "warn") ??
    null
  );
}

function dayTwo(lead: Lead): { subject: string; html: string } | null {
  const worst = worstFinding(lead.report);
  // No specific finding means no specific email to send. Skipping is better
  // than padding the sequence with something generic — see the header note.
  if (!worst) return null;

  const fixes = worst.fixes.length
    ? `<ul style="padding-left:18px;margin:12px 0">${worst.fixes
        .map((f) => `<li style="margin-bottom:8px">${escapeHtml(f)}</li>`)
        .join("")}</ul>`
    : "";

  return {
    subject: `The one thing hurting your resume: ${worst.label.toLowerCase()}`,
    html: shell(
      lead.email,
      `<p>Hi,</p>
       <p>You scored <strong>${lead.ats_score ?? "—"}/100</strong> on the ATS check a couple of days ago. Of the six things we look at, this is the one costing you the most:</p>
       <p style="margin:20px 0;padding:16px 18px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:8px">
         <strong style="color:#0f172a">${escapeHtml(worst.label)}</strong><br>
         <span style="color:#475569">${escapeHtml(worst.summary)}</span>
       </p>
       <p>What to change:</p>
       ${fixes}
       <p>This is a twenty-minute edit, and it moves the score more than anything else on the list.</p>
       ${button("/builder", "Fix it with AI rewrite")}
       <p style="color:#64748b;font-size:14px">If you'd rather do it by hand, that's genuinely fine — the fixes above are the whole answer.</p>`
    ),
  };
}

function dayFive(lead: Lead): { subject: string; html: string } {
  return {
    subject: "The interview question you will definitely be asked",
    html: shell(
      lead.email,
      `<p>Hi,</p>
       <p>Whatever role you're applying for, some version of this comes up in almost every Indian campus and fresher interview:</p>
       <p style="margin:20px 0;padding:16px 18px;background:#f1f5f9;border-radius:8px;font-weight:600;color:#0f172a">
         "Walk me through a project on your resume."
       </p>
       <p>Most candidates describe what the project <em>was</em>. The ones who get offers describe what they <em>decided</em>. A model answer has four parts, and takes ninety seconds:</p>
       <ol style="padding-left:18px;margin:12px 0">
         <li style="margin-bottom:8px"><strong>Context</strong> — one sentence on the problem and who it was for.</li>
         <li style="margin-bottom:8px"><strong>Your decision</strong> — something you chose and the option you rejected. This is the part that separates you.</li>
         <li style="margin-bottom:8px"><strong>What you built</strong> — the specific work, with the stack named.</li>
         <li style="margin-bottom:8px"><strong>The number</strong> — anything measurable. Users, latency, marks, hours saved. If you have none, say what you'd measure next time.</li>
       </ol>
       <p>Practise it out loud once. The gap between knowing this and being able to say it under pressure is bigger than it sounds.</p>
       ${button("/interview", "Run a mock interview")}`
    ),
  };
}

function dayTen(lead: Lead): { subject: string; html: string } {
  return {
    subject: `HYRISE Student — ${STUDENT_PLAN.priceLabel} for ${STUDENT_PLAN.durationDays} days`,
    html: shell(
      lead.email,
      `<p>Hi,</p>
       <p>You ran an ATS check with us ten days ago. If it was useful, here is what the paid plan adds — and if it wasn't, ignore this and there'll be nothing further.</p>
       <p style="margin:20px 0;padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
         <strong style="color:#0f172a;font-size:16px">HYRISE Student — ${STUDENT_PLAN.priceLabel}</strong>
         <span style="color:#64748b"> · one payment, ${STUDENT_PLAN.durationDays} days, no auto-renewal</span>
         <br><br>
         <span style="color:#475569">
           ${STUDENT_PLAN.aiActionsPerMonth} AI actions and ${STUDENT_PLAN.mockInterviewsPerMonth} mock interviews a month · all 21 tools · every resume template · company-specific prep for TCS NQT, Infosys, Wipro and the rest.
         </span>
       </p>
       <p>One interview going well is worth a hundred times this. That's the entire pitch.</p>
       ${button("/billing", `Get Student — ${STUDENT_PLAN.priceLabel}`)}
       <p style="color:#64748b;font-size:14px">The free plan stays free. We don't guarantee placements, and you should be sceptical of anyone who does.</p>`
    ),
  };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ats_leads")
    .select("id, email, ats_score, report, sequence_stage, created_at")
    .is("unsubscribed_at", null)
    // Someone who has made an account is no longer a lead — they should be in
    // the product's own onboarding, not still being sold the thing they have.
    .is("converted_user_id", null)
    .gte("sequence_stage", 1)
    .lte("sequence_stage", 3)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE * 3);

  if (error) {
    console.error("[ats-sequence]", error.message);
    return NextResponse.json({ error: "Lead read failed." }, { status: 500 });
  }

  const leads = (data ?? []) as Lead[];
  const now = Date.now();
  let sent = 0;
  let skipped = 0;

  for (const lead of leads) {
    if (sent >= BATCH_SIZE) break;

    const dueAfterDays = SCHEDULE[lead.sequence_stage];
    if (dueAfterDays === undefined) continue;

    const ageDays = (now - new Date(lead.created_at).getTime()) / 86_400_000;
    if (ageDays < dueAfterDays) continue;

    const build =
      lead.sequence_stage === 1 ? dayTwo(lead) : lead.sequence_stage === 2 ? dayFive(lead) : dayTen(lead);

    // Day 2 has nothing specific to say for this lead — advance past it rather
    // than stalling the sequence or sending filler.
    if (!build) {
      await supabase.from("ats_leads").update({ sequence_stage: lead.sequence_stage + 1 }).eq("id", lead.id);
      skipped++;
      continue;
    }

    const r = await sendEmail({ to: lead.email, subject: build.subject, html: build.html });
    if (r.error) {
      console.warn(`[ats-sequence] send failed for ${lead.email}`);
      continue; // Leave the stage untouched so the next run retries.
    }

    await supabase
      .from("ats_leads")
      .update({ sequence_stage: lead.sequence_stage + 1, last_emailed_at: new Date().toISOString() })
      .eq("id", lead.id);
    sent++;
  }

  return NextResponse.json({ candidates: leads.length, sent, skipped });
}
