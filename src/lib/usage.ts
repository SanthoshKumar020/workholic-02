import type { SupabaseClient } from "@supabase/supabase-js";
import { isPro, isSuperAdmin } from "@/lib/plan";
import { FREE_USES_PER_CORE_TOOL, STUDENT_PLAN } from "@/lib/pricing";

/**
 * Free-plan allowance: one use of each core tool (§2.1).
 *
 * Was three uses across twenty-one features — sixty-three free AI calls per
 * account. Nobody upgrades from an allowance they never exhaust, and it was
 * simultaneously the biggest line in the inference bill. One use is enough to
 * judge whether a tool is any good, which is the only job the free tier has.
 */
export const FREE_FEATURE_LIMIT = FREE_USES_PER_CORE_TOOL;

/** Saved resumes on the free plan. Not an AI cost — this is a storage/value cap. */
export const FREE_ENHANCE_LIMIT = 3;

/** Paid-plan monthly allowances. "Unlimited" is gone; see lib/pricing.ts. */
export const PAID_AI_ACTIONS_PER_MONTH = STUDENT_PLAN.aiActionsPerMonth;
export const PAID_MOCK_INTERVIEWS_PER_MONTH = STUDENT_PLAN.mockInterviewsPerMonth;

export type FeatureKey =
  | "enhance"
  | "ats-check"
  | "match"
  | "interview-questions"
  | "interview-feedback"
  | "interview-report"
  | "roadmap"
  | "outreach"
  | "company-prep"
  | "english"
  | "gd"
  | "aptitude"
  | "domains"
  | "dsa"
  | "resume-edit";

/**
 * The features that count against the mock-interview allowance rather than the
 * general AI-action allowance. These are the expensive path: a 20-turn session
 * is roughly ₹3.60 of inference against ~₹24/month of net revenue, so they get
 * their own, smaller budget.
 */
const MOCK_INTERVIEW_FEATURES: ReadonlySet<string> = new Set([
  "interview-questions",
  "interview-feedback",
  "interview-report",
]);

/** Start of the current rolling 30-day window, as an ISO timestamp. */
function windowStartIso(): string {
  return new Date(Date.now() - 30 * 86_400_000).toISOString();
}

export type LimitResult = {
  allowed: boolean;
  used: number;
  limit: number;
  /** Which budget was consulted — the caller uses this to word the message. */
  scope: "free" | "paid-ai" | "paid-interview" | "unlimited";
};

/**
 * Check a user's allowance for one feature.
 *
 * Free plan: one use of each core tool, ever (§2.1).
 * Paid plan: 50 AI actions and 10 mock interviews per rolling 30 days (§1.1).
 * Super admin: unmetered.
 *
 * ── Why paid is metered at all ──────────────────────────────────────────────
 * It used to return `allowed: true` for anyone on Pro, which is what
 * "unlimited" on the pricing page promised. That promise had no floor under
 * it: seven mock interviews in a month made a customer unprofitable, and the
 * users who run twenty are exactly the ones who would. Publishing an explicit
 * allowance and enforcing it here is what makes the pricing page true.
 *
 * ── Why rolling 30 days rather than a calendar month ────────────────────────
 * A calendar reset lets someone spend the whole allowance on the 30th and
 * again on the 1st — double the cost in two days, which is precisely the burst
 * the cap exists to prevent.
 */
export async function checkFreeLimit(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined,
  feature: FeatureKey
): Promise<LimitResult> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (isSuperAdmin(userEmail)) {
    return { allowed: true, used: 0, limit: Infinity, scope: "unlimited" };
  }

  // ── Paid: metered per rolling 30 days, across features ────────────────────
  if (isPro(profile?.plan)) {
    const isInterview = MOCK_INTERVIEW_FEATURES.has(feature);
    const limit = isInterview ? PAID_MOCK_INTERVIEWS_PER_MONTH : PAID_AI_ACTIONS_PER_MONTH;

    let query = supabase
      .from("feature_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowStartIso());

    query = isInterview
      ? query.in("feature", Array.from(MOCK_INTERVIEW_FEATURES))
      : query.not("feature", "in", `(${Array.from(MOCK_INTERVIEW_FEATURES).join(",")})`);

    const { count, error } = await query;

    // Fail open. A counting error should not lock a paying customer out of the
    // thing they paid for — the cost guard in lib/ai-cost.ts is the backstop
    // that catches genuine runaway spend.
    if (error) {
      console.error("[usage] paid allowance check failed, allowing:", error.message);
      return { allowed: true, used: 0, limit, scope: isInterview ? "paid-interview" : "paid-ai" };
    }

    const used = count ?? 0;
    return { allowed: used < limit, used, limit, scope: isInterview ? "paid-interview" : "paid-ai" };
  }

  // ── Free: lifetime count per feature ──────────────────────────────────────
  const { count } = await supabase
    .from("feature_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature);

  const used = count ?? 0;
  return { allowed: used < FREE_FEATURE_LIMIT, used, limit: FREE_FEATURE_LIMIT, scope: "free" };
}

/**
 * Resume-enhance limit, counted DIRECTLY from the `resumes` table.
 * This is the permanent source of truth — free users cannot delete resumes,
 * so the saved-resume count can only ever grow. Pro / super-admin are unlimited.
 */
export async function checkResumeLimit(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined
): Promise<{ allowed: boolean; used: number }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (isPro(profile?.plan) || isSuperAdmin(userEmail)) {
    return { allowed: true, used: 0 };
  }

  const { count } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const used = count ?? 0;
  return { allowed: used < FREE_ENHANCE_LIMIT, used };
}

/**
 * Roadmap limit, counted DIRECTLY from the `roadmaps` table.
 * Same model as resumes: free users can't delete roadmaps, so the saved count
 * only grows and is the permanent source of truth. Pro / super-admin unlimited.
 */
export async function checkRoadmapLimit(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined
): Promise<{ allowed: boolean; used: number }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (isPro(profile?.plan) || isSuperAdmin(userEmail)) {
    return { allowed: true, used: 0 };
  }

  const { count } = await supabase
    .from("roadmaps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const used = count ?? 0;
  return { allowed: used < FREE_FEATURE_LIMIT, used };
}

/** Insert a usage record after a successful AI call. */
export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  feature: FeatureKey
): Promise<void> {
  await supabase.from("feature_usage").insert({ user_id: userId, feature });
}

/**
 * The 403 for an exhausted allowance.
 *
 * Takes the limit result so the message can say which allowance ran out and
 * when it comes back. "free_limit_reached" alone left the UI guessing, and a
 * paying customer hitting their monthly cap needs a materially different
 * sentence from a free user hitting theirs — one is being asked to buy, the
 * other is being asked to wait.
 */
export function limitReachedResponse(result?: LimitResult) {
  if (!result || result.scope === "free") {
    return Response.json(
      {
        error: "free_limit_reached",
        message: `You've used your free go at this tool. ${STUDENT_PLAN.priceLabel} unlocks ${STUDENT_PLAN.aiActionsPerMonth} AI actions a month for ${STUDENT_PLAN.durationDays} days.`,
      },
      { status: 403 }
    );
  }

  const what = result.scope === "paid-interview" ? "mock interviews" : "AI actions";
  return Response.json(
    {
      error: "plan_limit_reached",
      message: `You've used all ${result.limit} ${what} in your plan this month. Your allowance rolls over as older usage ages out — or write to admin@swache.in if you need more.`,
      used: result.used,
      limit: result.limit,
    },
    { status: 403 }
  );
}
