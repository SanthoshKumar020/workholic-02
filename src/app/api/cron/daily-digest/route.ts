import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { COST_ALERT_RUPEES } from "@/lib/ai-cost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The daily digest (§1.5).
 *
 * Six numbers, once a day, to the founder's inbox: signups, ATS checks, AI
 * errors, inference spend, queue depth, and anyone over the cost threshold.
 *
 * ── Why an email and not a dashboard ────────────────────────────────────────
 * A dashboard has to be visited. At sixteen users the failure mode is not
 * "I looked and misread the number", it is "nobody looked for three weeks and
 * the AI had been erroring the whole time". Push beats pull until there is a
 * reason to sit in front of a dashboard daily.
 *
 * It also doubles as an uptime signal: if this stops arriving, something is
 * wrong with the cron, the database, or the deploy.
 */

const ALERT_ERROR_RATE = 0.1; // 10% of AI calls failing is not a blip.

type Digest = {
  calls: number;
  errors: number;
  spend_rupees: number;
  groq_calls: number;
  gemini_calls: number;
  unique_users: number;
};

async function countSince(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  column: string,
  sinceIso: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte(column, sinceIso);
  if (error) {
    console.warn(`[daily-digest] count ${table} failed: ${error.message}`);
    return -1; // Distinguishable from a genuine zero in the email.
  }
  return count ?? 0;
}

const n = (v: number) => (v < 0 ? "—" : String(v));

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const [digestRes, offendersRes, signups, atsLeads, queueDepth] = await Promise.all([
    supabase.rpc("ai_daily_digest", { p_hours: 24 }),
    supabase.rpc("ai_spend_offenders", { p_threshold_rupees: COST_ALERT_RUPEES }),
    countSince(supabase, "profiles", "created_at", since),
    countSince(supabase, "ats_leads", "created_at", since),
    supabase.from("capacity_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  // The RPC returns a one-row table; supabase-js hands it back as an array.
  const d: Digest = (Array.isArray(digestRes.data) ? digestRes.data[0] : digestRes.data) ?? {
    calls: 0,
    errors: 0,
    spend_rupees: 0,
    groq_calls: 0,
    gemini_calls: 0,
    unique_users: 0,
  };

  const offenders = (offendersRes.data ?? []) as { email: string; spend_rupees: number; calls: number }[];
  const pending = queueDepth.count ?? 0;
  const errorRate = d.calls > 0 ? d.errors / d.calls : 0;

  // Anything in this list means "open the laptop", and it goes in the subject
  // line so it is visible without opening the mail.
  const alarms: string[] = [];
  if (errorRate > ALERT_ERROR_RATE) alarms.push(`${Math.round(errorRate * 100)}% AI errors`);
  if (offenders.length) alarms.push(`${offenders.length} over ₹${COST_ALERT_RUPEES}`);
  if (pending > 0) alarms.push(`${pending} queued`);

  const row = (label: string, value: string, note = "") => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#475569;font-size:14px">${label}</td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:15px;font-weight:700">${value}${
        note ? `<span style="font-weight:400;color:#94a3b8;font-size:12px"> ${note}</span>` : ""
      }</td>
    </tr>`;

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;padding:24px 0">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px">
    <tr><td>
      <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8">HYRISE · last 24 hours</p>
      <p style="margin:4px 0 20px;font-size:13px;color:#94a3b8">${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full" })}</p>

      ${
        alarms.length
          ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;margin-bottom:18px">
               <p style="margin:0;font-size:13px;font-weight:700;color:#b91c1c">Needs a look: ${alarms.join(" · ")}</p>
             </div>`
          : ""
      }

      <table width="100%" cellpadding="0" cellspacing="0">
        ${row("New signups", n(signups))}
        ${row("ATS emails captured", n(atsLeads))}
        ${row("AI calls", String(d.calls), d.calls ? `${d.unique_users} users` : "")}
        ${row("AI errors", String(d.errors), d.calls ? `${Math.round(errorRate * 100)}%` : "")}
        ${row("Served by Groq / Gemini", `${d.groq_calls} / ${d.gemini_calls}`, d.gemini_calls > 0 ? "fallback in use" : "")}
        ${row("Inference spend", `₹${Number(d.spend_rupees ?? 0).toFixed(2)}`, "est.")}
        ${row("Capacity queue", String(pending), pending ? "pending" : "clear")}
      </table>

      ${
        offenders.length
          ? `<p style="margin:22px 0 8px;font-size:13px;font-weight:700;color:#b91c1c">Over ₹${COST_ALERT_RUPEES} in 30 days</p>
             <table width="100%" cellpadding="0" cellspacing="0">${offenders
               .slice(0, 10)
               .map(
                 (o) =>
                   `<tr><td style="padding:6px 0;font-size:13px;color:#475569">${o.email}</td>
                        <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:#0f172a">₹${Number(o.spend_rupees).toFixed(2)}<span style="font-weight:400;color:#94a3b8"> · ${o.calls} calls</span></td></tr>`
               )
               .join("")}</table>`
          : ""
      }

      <p style="margin:24px 0 0;font-size:11px;line-height:1.6;color:#94a3b8">
        Spend is estimated from token counts against a published rate card, not billed amounts — it is an alarm, not an invoice.
        A dash means that counter could not be read.
        If this email stops arriving, the cron, the database or the deploy is broken.
      </p>
    </td></tr>
  </table>
</div>`;

  const to = process.env.MARKETING_REPORT_EMAIL;
  const subject = alarms.length
    ? `⚠️ HYRISE daily — ${alarms.join(" · ")}`
    : `HYRISE daily — ${n(signups)} signups, ${d.calls} AI calls, ₹${Number(d.spend_rupees ?? 0).toFixed(2)}`;

  if (!to) {
    return NextResponse.json({
      note: "Set MARKETING_REPORT_EMAIL to receive this by email.",
      digest: d,
      signups,
      atsLeads,
      pending,
      offenders,
    });
  }

  const r = await sendEmail({ to, subject, html });

  // Housekeeping shares this cron rather than earning its own. `rate_limits` is
  // append-only and would grow forever; `ats_pending_reports` holds analysis of
  // people's resumes who never gave us an email, which we have no business
  // keeping past the few seconds the flow needs.
  // `expire_lapsed_plans` is the other half of the one-time 90-day plan: a
  // purchase writes an end date, and this is what enforces it.
  await Promise.all([
    supabase.rpc("prune_rate_limits").then(null, () => {}),
    supabase.rpc("prune_ats_pending_reports").then(null, () => {}),
    supabase.rpc("expire_lapsed_plans").then(null, () => {}),
  ]);

  return NextResponse.json({ sent: !r.skipped, digest: d, signups, atsLeads, pending });
}
