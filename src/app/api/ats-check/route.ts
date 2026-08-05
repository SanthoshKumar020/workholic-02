import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkFreeLimit, recordUsage, limitReachedResponse } from "@/lib/usage";
import { capacityResponse } from "@/lib/ai";
import { scoreResume, gateReport, primaryCta } from "@/lib/ats";
import { rateLimit, clientKey, rateLimitMessage } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Anonymous visitors get this many free scans per IP+UA per 24h.
 *
 * Two, not three (§1.1). The number exists to stop one burst exhausting a
 * 1,000/day provider quota for everyone else, and a genuine visitor checks one
 * resume, maybe a second draft. A third is almost always someone testing.
 */
const ANON_DAILY_LIMIT = 2;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Anonymous visitors: allowed, rate-limited, given a partial report ──────
  // This is the top-of-funnel lead magnet. Requiring login here was killing
  // conversion — the homepage explicitly promises "no login needed".
  if (!user) {
    const { allowed, retryAfter } = await rateLimit(clientKey(request, "ats-check"), ANON_DAILY_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "anon_limit_reached",
          message: `${rateLimitMessage(retryAfter)} Create a free account to keep checking — it takes 20 seconds.`,
          retryAfter,
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  } else {
    const limit = await checkFreeLimit(supabase, user.id, user.email, "ats-check");
    if (!limit.allowed) return limitReachedResponse(limit);
  }

  let body: { resumeText?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const resumeText = (body.resumeText || "").trim();
  if (resumeText.length < 30) {
    return NextResponse.json({ error: "Please provide resume text (at least 30 characters)." }, { status: 400 });
  }

  let report;
  try {
    report = await scoreResume(resumeText, { feature: "ats-check", userId: user?.id });
  } catch (err) {
    // Never leak a provider error string — "Groq 429" means nothing to someone
    // trying to fix their resume, and it reads as broken rather than busy.
    // `capacityResponse` offers to email the result instead of dead-ending.
    console.error("[ats-check] all providers failed:", err instanceof Error ? err.message : err);
    return capacityResponse("ats-check");
  }

  const cta = primaryCta(report);

  // ── Signed in: the whole report, no gate ──────────────────────────────────
  if (user) {
    await recordUsage(supabase, user.id, "ats-check");
    return NextResponse.json({ score: report.score, findings: report.findings, lockedCount: 0, cta });
  }

  // ── Anonymous: two categories in full, four named but locked (§5.2) ────────
  const gated = gateReport(report);

  // Stash the full report against the email-capture token so /api/ats-report
  // can email all six categories without paying for a second inference run —
  // and, more importantly, so the emailed report is the SAME analysis they are
  // looking at. Re-running would produce slightly different wording and read
  // as though we had made it up.
  const { data: stash } = await createAdminClient()
    .from("ats_pending_reports")
    .insert({ report })
    .select("id")
    .single();

  return NextResponse.json({
    ...gated,
    cta,
    anonymous: true,
    reportToken: stash?.id ?? null,
  });
}
