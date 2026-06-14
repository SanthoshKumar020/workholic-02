import { createClient } from "@/lib/supabase/server";
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

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = (data as Profile) ?? null;

  // Super admins are always treated as Pro regardless of DB plan
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
