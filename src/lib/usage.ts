import type { SupabaseClient } from "@supabase/supabase-js";
import { isPro, isSuperAdmin } from "@/lib/plan";

export const FREE_FEATURE_LIMIT = 3;
export const FREE_ENHANCE_LIMIT = 3;

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
  | "dsa";

/** Returns { allowed, used } for a free-plan user. Pro / super-admin always allowed. */
export async function checkFreeLimit(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined,
  feature: FeatureKey
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
    .from("feature_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature);

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

/** Convenience: check limit and immediately return a 403 response if exceeded. */
export function limitReachedResponse() {
  return Response.json({ error: "free_limit_reached" }, { status: 403 });
}
