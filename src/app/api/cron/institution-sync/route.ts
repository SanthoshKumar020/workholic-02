import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reconcile college-sponsored Pro access, daily.
 *
 * Joining an institution sets profiles.plan = 'pro' directly, because ~30
 * call sites read that column through a synchronous isUserPro(). This job is
 * the other half: it grants access to anyone who somehow missed it, and
 * revokes it when a college's contract lapses.
 *
 * ── The dangerous part ──────────────────────────────────────────────────────
 * Revocation must never downgrade someone who pays us themselves. A student
 * whose college contract ends but who then bought Pro individually would lose
 * access they paid for — a refund request and a support complaint, from
 * exactly the user who liked the product most.
 *
 * So a downgrade requires ALL of:
 *   • membership in an institution whose expires_at has passed
 *   • no stripe_customer_id (never went through Stripe checkout)
 *   • no approved payment_requests row (never paid by UPI)
 *
 * When in doubt, we leave them on Pro. Erring toward giving away access is far
 * cheaper than erring toward taking away access someone paid for.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = createAdminClient();
  const now = new Date().toISOString();

  // ── Active vs lapsed institutions ─────────────────────────────────────────
  const { data: institutions, error: instErr } = await db
    .from("institutions")
    .select("id, name, expires_at");

  if (instErr) return NextResponse.json({ error: instErr.message }, { status: 500 });

  const activeIds = new Set<string>();
  const lapsedIds = new Set<string>();
  for (const i of institutions ?? []) {
    if (!i.expires_at || i.expires_at > now) activeIds.add(i.id);
    else lapsedIds.add(i.id);
  }

  const { data: members, error: memErr } = await db
    .from("institution_members")
    .select("user_id, institution_id");

  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

  const activeUsers = new Set<string>();
  const lapsedOnly = new Set<string>();
  for (const m of members ?? []) {
    if (activeIds.has(m.institution_id)) activeUsers.add(m.user_id);
    else if (lapsedIds.has(m.institution_id)) lapsedOnly.add(m.user_id);
  }
  // Someone in two institutions, one still active, keeps access.
  activeUsers.forEach((u) => lapsedOnly.delete(u));

  let granted = 0;
  let revoked = 0;
  let keptPaying = 0;

  // ── Grant ─────────────────────────────────────────────────────────────────
  if (activeUsers.size > 0) {
    const ids = Array.from(activeUsers);
    const { data: toGrant } = await db
      .from("profiles")
      .select("id")
      .in("id", ids)
      .neq("plan", "pro");

    for (const p of toGrant ?? []) {
      await db.from("profiles").update({ plan: "pro" }).eq("id", p.id);
      granted++;
    }
  }

  // ── Revoke, carefully ─────────────────────────────────────────────────────
  if (lapsedOnly.size > 0) {
    const ids = Array.from(lapsedOnly);
    const { data: candidates } = await db
      .from("profiles")
      .select("id, stripe_customer_id")
      .in("id", ids)
      .eq("plan", "pro");

    for (const p of candidates ?? []) {
      // Paid via Stripe at some point — never touch.
      if (p.stripe_customer_id) {
        keptPaying++;
        continue;
      }

      // Paid via UPI at some point — never touch.
      const { count } = await db
        .from("payment_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", p.id)
        .eq("status", "approved");

      if ((count ?? 0) > 0) {
        keptPaying++;
        continue;
      }

      await db.from("profiles").update({ plan: "free" }).eq("id", p.id);
      revoked++;
    }
  }

  return NextResponse.json({
    message: `Granted ${granted}, revoked ${revoked}, kept ${keptPaying} individually-paying users on Pro.`,
    activeInstitutions: activeIds.size,
    lapsedInstitutions: lapsedIds.size,
    granted,
    revoked,
    keptPaying,
  });
}
