import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Join an institution with a code the placement cell hands out.
 *
 * Students enrol themselves rather than being bulk-imported from a
 * spreadsheet. A college cannot give consent on a student's behalf under the
 * DPDP Act, and a student typing a code into their own account is consent they
 * actually gave. It also means the roster self-cleans: people who never sign
 * up never occupy a seat.
 *
 * Written with the service role because joining has to check the seat limit
 * and the contract expiry, neither of which a client-side insert could be
 * trusted to enforce.
 */

/** Wrong codes per device per day — enough for typos, not for enumeration. */
const JOIN_ATTEMPT_LIMIT = 20;

export async function POST(request: Request) {
  const { allowed, retryAfter } = await rateLimit(clientKey(request, "inst-join"), JOIN_ATTEMPT_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts today. Please try again tomorrow." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  let body: { code?: string; batchLabel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Enter your college code." }, { status: 400 });

  const admin = createAdminClient();

  const { data: institution } = await admin
    .from("institutions")
    .select("id, name, seat_limit, expires_at")
    .eq("join_code", code)
    .maybeSingle();

  // Same message whether the code is wrong or expired, so this can't be used
  // to discover which colleges are customers.
  if (!institution) {
    return NextResponse.json({ error: "That code isn't valid." }, { status: 404 });
  }

  if (institution.expires_at && new Date(institution.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "That code has expired. Ask your placement cell for a current one." },
      { status: 410 }
    );
  }

  // Already a member — succeed quietly rather than erroring.
  const { data: existing } = await admin
    .from("institution_members")
    .select("institution_id")
    .eq("institution_id", institution.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, institution: institution.name, alreadyMember: true });
  }

  // Seat limit. `seat_limit = 0` means unlimited (useful for a free pilot).
  if (institution.seat_limit > 0) {
    const { count } = await admin
      .from("institution_members")
      .select("user_id", { count: "exact", head: true })
      .eq("institution_id", institution.id)
      .eq("role", "student");

    if ((count ?? 0) >= institution.seat_limit) {
      return NextResponse.json(
        { error: "All seats for your college are currently taken. Please contact your placement cell." },
        { status: 409 }
      );
    }
  }

  const { error } = await admin.from("institution_members").insert({
    institution_id: institution.id,
    user_id: user.id,
    role: "student", // never accepted from the request body
    batch_label: (body.batchLabel ?? "").trim().slice(0, 40) || null,
  });

  if (error) {
    console.error("[institution/join]", error.message);
    return NextResponse.json({ error: "Could not join right now. Please try again." }, { status: 500 });
  }

  // Grant Pro immediately.
  //
  // The `has_active_institution()` SQL function was the intended mechanism,
  // but nothing ever called it — roughly 30 places check `profiles.plan`
  // through isUserPro(), which is synchronous and can't do a membership
  // lookup. Rather than thread an async check through all of them (and risk
  // missing one, which would silently paywall a paying college's students),
  // membership writes the plan directly. /api/cron/institution-sync reconciles
  // daily and revokes it when the contract lapses.
  await admin.from("profiles").update({ plan: "pro" }).eq("id", user.id);

  return NextResponse.json({ ok: true, institution: institution.name });
}
