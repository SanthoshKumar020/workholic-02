import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Plan, Profile } from "@/lib/types";

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/** True when the user is Pro by plan OR is a super admin. Use this in API routes. */
export function isUserPro(plan: Plan | string | null | undefined, email: string | null | undefined): boolean {
  return isPro(plan) || isSuperAdmin(email);
}

/**
 * The signed-in user's profile, creating the row if it is missing.
 *
 * ── The redirect loop this fixes ─────────────────────────────────────────────
 * 27 pages guard themselves with:
 *
 *     const profile = await getCurrentProfile();
 *     if (!profile) redirect("/login?redirectTo=…");
 *
 * This function used to return `null` in TWO different situations — "nobody is
 * signed in" and "somebody IS signed in but has no `profiles` row" — and the
 * callers could not tell them apart. In the second case the user was bounced
 * to /login while already authenticated, so login succeeded, sent them back to
 * the page, which bounced them again: an infinite loop where the navbar
 * correctly showed "Sign out" the whole time.
 *
 * A missing row is entirely possible: the `handle_new_user` trigger only fires
 * for rows inserted into `auth.users` after it was installed, so any account
 * created before that (or during a failed trigger run) has no profile.
 *
 * Rather than trapping those users forever, we create the row on demand. The
 * insert uses the service-role client because migration 010 deliberately
 * restricts what `authenticated` may write to `profiles`.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Genuinely signed out — the only case where a /login redirect is correct.
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  let profile = (data as Profile) ?? null;

  if (!profile) {
    // Signed in, but no profile row. Heal it instead of bouncing to /login.
    console.warn(`[plan] no profile row for user ${user.id}; creating one`);
    const admin = createAdminClient();
    const { data: created, error } = await admin
      .from("profiles")
      .upsert({ id: user.id, email: user.email }, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      console.error("[plan] could not create profile row:", error.message);
      return null;
    }
    profile = (created as Profile) ?? null;
  }

  // Super admins are always treated as Pro regardless of DB plan.
  if (profile && isSuperAdmin(user.email)) {
    return { ...profile, plan: "pro" };
  }

  return profile;
}

export function isPro(plan: Plan | string | null | undefined): boolean {
  return plan === "pro";
}

export const FREE_TEMPLATE_ID = "classic";

const ALL_TEMPLATE_IDS = ["classic", "executive", "minimal", "modern", "teal", "corporate", "impact"];
const FREE_TEMPLATE_IDS = ["classic", "executive", "minimal"];

export function templatesForPlan(plan: Plan | string | null | undefined): string[] {
  return isPro(plan) ? ALL_TEMPLATE_IDS : FREE_TEMPLATE_IDS;
}

export async function awardXp(userId: string, amount: number): Promise<void> {
  const supabase = createClient();
  const { data: profile } = await supabase.from("profiles").select("xp, streak, last_active").eq("id", userId).single();
  if (!profile) return;

  const now = new Date();
  const lastActive = profile.last_active ? new Date(profile.last_active) : null;
  const daysSince = lastActive ? Math.floor((now.getTime() - lastActive.getTime()) / 86400000) : 999;

  let newStreak = profile.streak ?? 0;
  if (daysSince === 1) newStreak += 1;
  else if (daysSince > 1) newStreak = 1;
  // Same day: keep streak

  await supabase
    .from("profiles")
    .update({ xp: (profile.xp ?? 0) + amount, streak: newStreak, last_active: now.toISOString() })
    .eq("id", userId);
}
