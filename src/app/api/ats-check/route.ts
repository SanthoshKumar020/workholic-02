import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkFreeLimit, recordUsage, limitReachedResponse } from "@/lib/usage";
import { callAi, AI_CAPACITY_MESSAGE } from "@/lib/ai";
import { rateLimit, clientKey, rateLimitMessage } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Anonymous visitors get this many free scans per 24h, per IP+UA. */
const ANON_DAILY_LIMIT = 3;
/** How many improvement tips an anonymous visitor sees before the signup wall. */
const ANON_VISIBLE_TIPS = 2;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Anonymous visitors: allowed, rate-limited, given a teaser ─────────────
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
    const { allowed } = await checkFreeLimit(supabase, user.id, user.email, "ats-check");
    if (!allowed) return limitReachedResponse();
  }

  let body: { resumeText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const resumeText = (body.resumeText || "").trim();
  if (resumeText.length < 30) {
    return NextResponse.json({ error: "Please provide resume text (at least 30 characters)." }, { status: 400 });
  }

  // Uses the fallback chain (Groq → Gemini) rather than Groq alone. This is
  // the endpoint most likely to be hit by a sudden burst — a Reddit thread or
  // a college WhatsApp group — and Groq's free tier is 30 req/min. Everyone
  // past that would otherwise see a broken tool on their first visit.
  let result: { atsScore?: number; improvements?: string[] };
  try {
    const { result: r, provider } = await callAi<{ atsScore?: number; improvements?: string[] }>([
      {
        role: "system",
        content: `You are an ATS (Applicant Tracking System) expert. Analyze the resume and return a score and improvement tips. Return JSON: { atsScore: 0-100, improvements: ["tip1", "tip2", "tip3", "tip4", "tip5"] }. Score based on: keyword density, formatting, contact info, measurable achievements, action verbs, section headers. Each tip must be specific and actionable and reference something actually present in (or missing from) this resume — never generic advice.`,
      },
      {
        role: "user",
        content: `Analyze this resume for ATS compatibility:\n\n${resumeText.slice(0, 4000)}`,
      },
    ]);
    result = r;
    if (provider !== "groq") console.info(`[ats-check] served by fallback provider: ${provider}`);
  } catch (err) {
    // Never leak a provider error string to the user — "Groq 429" means
    // nothing to someone trying to fix their resume, and it reads as broken
    // rather than busy.
    console.error("[ats-check] all providers failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: AI_CAPACITY_MESSAGE }, { status: 503 });
  }

  const atsScore =
    typeof result?.atsScore === "number" ? Math.round(Math.min(100, Math.max(0, result.atsScore))) : 50;
  const allTips = Array.isArray(result?.improvements) ? result.improvements.slice(0, 5) : [];

  if (user) {
    await recordUsage(supabase, user.id, "ats-check");
    return NextResponse.json({ atsScore, improvements: allTips, lockedCount: 0 });
  }

  // Teaser: real score + the first couple of fixes; the rest need a free account.
  return NextResponse.json({
    atsScore,
    improvements: allTips.slice(0, ANON_VISIBLE_TIPS),
    lockedCount: Math.max(0, allTips.length - ANON_VISIBLE_TIPS),
    anonymous: true,
  });
}
