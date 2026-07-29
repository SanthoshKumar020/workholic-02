import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Only allow relative, same-origin paths.
 *
 * `redirectTo` arrives in a query parameter, so it is attacker-controllable:
 * a link like /login?redirectTo=https://evil.example would otherwise turn our
 * own auth callback into an open redirect, which is a credible phishing
 * primitive ("the link really was hyrise.swache.in"). Anything that isn't a
 * single-slash relative path is discarded.
 */
function safeRedirectPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null; // protocol-relative → external
  if (raw.includes("\\")) return null; // some parsers treat \ as /
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requested = safeRedirectPath(searchParams.get("redirectTo"));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Send first-time users through onboarding once. It collects
      // `target_role`, which personalises the interview, tailor, salary,
      // outreach, mentor and chat prompts. Onboarding was previously
      // unreachable — nothing linked to it — so `target_role` was null for
      // essentially every user and all six tools silently ran generic.
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("target_role, xp")
          .eq("id", user.id)
          .single();

        // Only for genuinely new accounts: no role AND no activity yet.
        // Gating on `target_role` alone would re-prompt anyone who skipped
        // onboarding, every single login — nagging, not onboarding.
        if (!profile?.target_role && (profile?.xp ?? 0) === 0) {
          const next = requested ? `?redirectTo=${encodeURIComponent(requested)}` : "";
          return NextResponse.redirect(`${origin}/onboarding${next}`);
        }
      }

      // Honour where the user was actually headed. The guards on 27 pages set
      // `?redirectTo=…` when they bounce a logged-out visitor, but this
      // callback used to ignore it and always land on /dashboard — so the
      // user had to navigate back to whatever they originally clicked.
      return NextResponse.redirect(`${origin}${requested ?? "/dashboard"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
