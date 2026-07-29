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

/**
 * The user's local calendar day, as YYYY-MM-DD.
 *
 * Streaks must be counted in calendar days, not 24-hour blocks. The old code
 * used `Math.floor(msElapsed / 86400000)`, which meant practising at 9am
 * Monday and 8am Tuesday produced `daysSince === 0` — two consecutive days of
 * real use that never incremented the streak. Users experience "days" as
 * dates on a calendar, not as elapsed milliseconds.
 *
 * Fixed to IST because that's where essentially all of this audience is; a
 * UTC boundary would roll the day over at 5:30am local, mid-evening-session.
 */
const STREAK_TIMEZONE = "Asia/Kolkata";

function localDayKey(date: Date): string {
  // en-CA gives ISO-style YYYY-MM-DD.
  return date.toLocaleDateString("en-CA", { timeZone: STREAK_TIMEZONE });
}

function daysBetweenKeys(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00Z`).getTime();
  const to = new Date(`${toKey}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

/**
 * One missed day is forgiven.
 *
 * A streak should encourage a habit, not punish someone for a bad day — and
 * this audience is job hunting, which is stressful enough. Missing a single
 * day keeps the streak alive; missing two starts it over. This is deliberate
 * and worth stating in the UI so the number stays honest.
 */
const STREAK_GRACE_DAYS = 1;

function nextStreak(current: number, lastKey: string | null, todayKey: string): number {
  if (!lastKey) return 1;
  const gap = daysBetweenKeys(lastKey, todayKey);
  if (gap <= 0) return Math.max(current, 1); // already counted today
  if (gap <= 1 + STREAK_GRACE_DAYS) return current + 1;
  return 1;
}

/**
 * Record activity and optionally award XP. THE single place that touches
 * `xp`, `streak` and `last_active`.
 *
 * Previously three separate implementations existed — this function, a raw
 * `.update({ xp: xp + 10, last_active })` in both `enhance` and
 * `cover-letter`, and an `increment_xp` RPC used by `roadmap/generate`. The
 * raw updates were the damaging ones: they moved `last_active` forward WITHOUT
 * advancing `streak`, so the two most-used tools in the product quietly
 * sabotaged the streak they were supposed to build.
 */
export async function awardXp(userId: string, amount = 0): Promise<void> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, streak, last_active")
    .eq("id", userId)
    .single();
  if (!profile) return;

  const now = new Date();
  const todayKey = localDayKey(now);
  const lastKey = profile.last_active ? localDayKey(new Date(profile.last_active)) : null;

  await supabase
    .from("profiles")
    .update({
      xp: (profile.xp ?? 0) + Math.max(0, amount),
      streak: nextStreak(profile.streak ?? 0, lastKey, todayKey),
      last_active: now.toISOString(),
    })
    .eq("id", userId);
}

/**
 * Credit a day's activity without XP.
 *
 * Most of the app — job search, tracker, mentor, tailor, salary coach,
 * recruiter scan — awards no XP, so a user could work in HYRISE all day and
 * get no streak credit at all. Call this from those paths so the streak
 * reflects genuine use rather than only the handful of gamified surfaces.
 */
export async function recordActivity(userId: string): Promise<void> {
  return awardXp(userId, 0);
}
