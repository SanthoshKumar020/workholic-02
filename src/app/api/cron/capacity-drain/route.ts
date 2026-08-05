import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { scoreResume, reportEmailHtml } from "@/lib/ats";
import { MAX_ATTEMPTS } from "@/lib/capacity-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Drain the capacity queue (§1.3).
 *
 * Runs every 15 minutes. Each pass retries a small batch of the requests we
 * had to turn away while both AI providers were down, and emails the result.
 *
 * ── Why the batch is small ──────────────────────────────────────────────────
 * The queue only fills during an outage, and an outage is exactly when
 * capacity is scarce. Draining 25 at a time means we resume service for real
 * users first and work through the backlog over a few passes, rather than
 * firing a hundred calls the moment Groq recovers and putting ourselves
 * straight back into a 429.
 */
const BATCH_SIZE = 25;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hyrise.swache.in";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("capacity_queue")
    .select("id, email, feature, payload, attempts")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[capacity-drain]", error.message);
    return NextResponse.json({ error: "Queue read failed." }, { status: 500 });
  }
  if (!rows?.length) return NextResponse.json({ drained: 0, note: "Queue empty." });

  let sent = 0;
  let failed = 0;
  let abandoned = 0;

  for (const row of rows) {
    const resumeText = String((row.payload as { resumeText?: string })?.resumeText ?? "");

    // A row we can never fulfil should leave the queue immediately rather than
    // burn three retries proving it.
    if (row.feature !== "ats-check" || resumeText.length < 30) {
      await supabase
        .from("capacity_queue")
        .update({ status: "abandoned", last_error: "unfulfillable payload", processed_at: new Date().toISOString() })
        .eq("id", row.id);
      abandoned++;
      continue;
    }

    try {
      const report = await scoreResume(resumeText, { feature: "ats-check-queued" });

      await sendEmail({
        to: row.email,
        subject: `Your ATS score: ${report.score}/100`,
        html: reportEmailHtml(report, { appUrl: APP_URL }),
      });

      await supabase
        .from("capacity_queue")
        .update({ status: "sent", processed_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } catch (e) {
      const attempts = (row.attempts ?? 0) + 1;
      const message = e instanceof Error ? e.message : String(e);
      const giveUp = attempts >= MAX_ATTEMPTS;

      await supabase
        .from("capacity_queue")
        .update({
          attempts,
          last_error: message.slice(0, 500),
          // Past the retry budget the "within the hour" promise is already
          // broken, and a resume score they asked for yesterday is worse than
          // silence.
          ...(giveUp ? { status: "failed", processed_at: new Date().toISOString() } : {}),
        })
        .eq("id", row.id);

      if (giveUp) failed++;
      console.warn(`[capacity-drain] ${row.id} attempt ${attempts}: ${message}`);
    }
  }

  return NextResponse.json({ processed: rows.length, sent, failed, abandoned });
}
