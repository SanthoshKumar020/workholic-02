import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Save onboarding preferences.
 *
 * ── Why this is a server route and not a direct browser write ───────────────
 * OnboardingClient used to call supabase.from("profiles").update(...) straight
 * from the browser, which made every schema imperfection a user-facing 400:
 *
 *   PGRST204: Could not find the 'preferred_language' column of 'profiles'
 *             in the schema cache
 *
 * This app's live schema has drifted from its migrations, so that is not a
 * hypothetical. Going through the server lets us (a) write each field
 * independently, so one unavailable column cannot discard the other, and
 * (b) return a clear, actionable message instead of raw PostgREST text.
 *
 * A partial save is much better than none here: `target_role` alone still
 * personalises six different tools.
 */

const ALLOWED_LANGUAGES = new Set(["en", "hi", "ta", "te", "kn", "ml", "mr", "bn", "gu", "pa"]);

type FieldResult = "saved" | "unavailable" | "failed";

/** Write one column on its own so a failure can't take the others with it. */
async function writeField(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  column: string,
  value: unknown
): Promise<FieldResult> {
  const { error } = await admin
    .from("profiles")
    .update({ [column]: value })
    .eq("id", userId);

  if (!error) return "saved";

  // PGRST204 = column missing from the schema cache; 42703 = column does not
  // exist at all. Both mean the database is behind the code, which is our
  // problem to fix — not something the user can act on.
  const missing =
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /schema cache|does not exist/i.test(error.message ?? "");

  console.error(`[onboarding] failed to write ${column}:`, error.code, error.message);
  return missing ? "unavailable" : "failed";
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  let body: { targetRole?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const targetRole = (body.targetRole ?? "").trim().slice(0, 80) || null;
  const language =
    typeof body.language === "string" && ALLOWED_LANGUAGES.has(body.language)
      ? body.language
      : "en";

  // Service-role: migration 014 controls which columns `authenticated` may
  // write, and this route has already verified the caller owns the row.
  const admin = createAdminClient();

  const results: Record<string, FieldResult> = {
    target_role: await writeField(admin, user.id, "target_role", targetRole),
    preferred_language: await writeField(admin, user.id, "preferred_language", language),
  };

  const saved = Object.entries(results)
    .filter(([, r]) => r === "saved")
    .map(([c]) => c);
  const unavailable = Object.entries(results)
    .filter(([, r]) => r === "unavailable")
    .map(([c]) => c);
  const failed = Object.entries(results)
    .filter(([, r]) => r === "failed")
    .map(([c]) => c);

  // Nothing landed and it wasn't a schema gap — a genuine error worth showing.
  if (saved.length === 0 && failed.length > 0) {
    return NextResponse.json(
      { error: "Could not save your preferences. Please try again." },
      { status: 500 }
    );
  }

  // Some or all saved (possibly with columns the database doesn't have yet).
  // Either way the user should continue — never block onboarding on this.
  return NextResponse.json({ ok: true, saved, unavailable });
}
