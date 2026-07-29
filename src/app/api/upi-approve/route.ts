import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/plan";
import {
  makeApproveToken,
  tokenMatches,
  parseUpiAction,
  escapeHtml as esc,
} from "@/lib/upi";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Manual UPI payment approval.
 *
 * ── Why this route is shaped the way it is ──────────────────────────────────
 * It grants paid access, so it is the highest-value endpoint in the app. The
 * previous version had four defects, all now fixed:
 *
 *  1. A hardcoded `?? "fallback-secret-change-me"` meant that if the env var
 *     was ever missing, anyone reading this repo could forge an approval.
 *     → the secret is now required; the route fails closed without it.
 *  2. No authentication — the URL token was the only gate.
 *     → now requires a logged-in super-admin session as well.
 *  3. A state-changing GET: any mail scanner, link preview bot, or corporate
 *     URL prefetcher that touched the approve link silently granted Pro.
 *     → GET now only renders a confirmation page; POST performs the action.
 *  4. It used the cookie-bound anon client while claiming to use the service
 *     role, so the `profiles` update matched zero rows under RLS and the page
 *     still reported success.
 *     → now uses the service-role client and verifies rows were affected.
 */

/** Both verbs require a signed-in super admin. */
async function requireAdmin(): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email)) {
    return {
      ok: false,
      response: new NextResponse(
        `<html><body style="font-family:sans-serif;text-align:center;padding:60px">
           <h2>Admin sign-in required</h2>
           <p>Log in with an admin account, then open this link again.</p>
         </body></html>`,
        { status: 403, headers: { "Content-Type": "text/html" } }
      ),
    };
  }
  return { ok: true };
}

function page(html: string, status = 200): NextResponse {
  return new NextResponse(
    `<html><body style="font-family:sans-serif;text-align:center;padding:60px;color:#0f172a">${html}</body></html>`,
    { status, headers: { "Content-Type": "text/html" } }
  );
}

/**
 * GET — render a confirmation screen only. Deliberately performs no writes, so
 * link prefetchers and email scanners cannot trigger an upgrade.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const token = searchParams.get("token");
  const action = parseUpiAction(searchParams.get("action"));

  if (!id || !token) return page("<h2>Invalid link.</h2>", 400);

  let expected: string;
  try {
    expected = makeApproveToken(id, action);
  } catch {
    return page("<h2>Server misconfigured: UPI_APPROVE_SECRET is not set.</h2>", 500);
  }
  if (!tokenMatches(token, expected)) {
    return page("<h2>Invalid or expired approval link.</h2>", 403);
  }

  const db = createAdminClient();
  const { data: req } = await db.from("payment_requests").select("*").eq("id", id).single();
  if (!req) return page("<h2>Payment request not found.</h2>", 404);
  if (req.status !== "pending") return page(`<h2>Already ${esc(req.status)}.</h2>`, 409);

  const isApprove = action === "approve";
  return page(`
    <h2>${isApprove ? "Approve this payment?" : "Reject this payment?"}</h2>
    <p style="color:#475569">
      <strong>${esc(req.full_name)}</strong> (${esc(req.user_email)})<br/>
      ₹${esc(req.amount)} · txn ${esc(req.transaction_id)}
    </p>
    <form method="POST" style="margin-top:28px">
      <input type="hidden" name="id" value="${esc(id)}" />
      <input type="hidden" name="token" value="${esc(token)}" />
      <input type="hidden" name="action" value="${esc(action)}" />
      <button type="submit" style="background:${isApprove ? "#16a34a" : "#dc2626"};color:#fff;
        border:0;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer">
        ${isApprove ? "Confirm — upgrade to Pro" : "Confirm — reject payment"}
      </button>
    </form>
  `);
}

/** POST — the only verb that changes anything. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const token = String(form.get("token") ?? "");
  const action = parseUpiAction(String(form.get("action") ?? ""));

  if (!id || !token) return page("<h2>Invalid request.</h2>", 400);

  let expected: string;
  try {
    expected = makeApproveToken(id, action);
  } catch {
    return page("<h2>Server misconfigured: UPI_APPROVE_SECRET is not set.</h2>", 500);
  }
  if (!tokenMatches(token, expected)) {
    return page("<h2>Invalid or expired approval link.</h2>", 403);
  }

  const db = createAdminClient();
  const { data: req } = await db.from("payment_requests").select("*").eq("id", id).single();
  if (!req) return page("<h2>Payment request not found.</h2>", 404);
  if (req.status !== "pending") return page(`<h2>Already ${esc(req.status)}.</h2>`, 409);

  const fromAddress = process.env.EMAIL_FROM ?? "HYRISE <onboarding@resend.dev>";
  const supportEmail = process.env.SUPPORT_EMAIL ?? "admin@swache.in";

  // ── Reject ────────────────────────────────────────────────────────────────
  if (action === "reject") {
    await db.from("payment_requests").update({ status: "rejected" }).eq("id", id);

    await resend.emails.send({
      from: fromAddress,
      to: [req.user_email],
      subject: "Your HYRISE payment could not be verified",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#dc2626">Payment not verified</h2>
          <p>Hi ${esc(req.full_name)},</p>
          <p>We could not verify your UPI payment with transaction ID <strong>${esc(req.transaction_id)}</strong>.</p>
          <p>Reply to this email or write to <a href="mailto:${esc(supportEmail)}">${esc(supportEmail)}</a>
             with your payment screenshot and we'll sort it out.</p>
          <p>— HYRISE Team</p>
        </div>
      `,
    });

    return page(`<h2 style="color:#dc2626">Payment rejected</h2><p>The user has been notified.</p>`);
  }

  // ── Approve ───────────────────────────────────────────────────────────────
  // `select()` so we can confirm a row was actually updated — the previous
  // version treated a zero-row update as success.
  const { data: updated, error: upgradeErr } = await db
    .from("profiles")
    .update({ plan: "pro" })
    .eq("id", req.user_id)
    .select("id");

  if (upgradeErr) {
    return page(`<h2>Failed to upgrade:</h2><p>${esc(upgradeErr.message)}</p>`, 500);
  }
  if (!updated || updated.length === 0) {
    return page(
      `<h2>No profile matched user ${esc(req.user_id)}.</h2><p>Nothing was changed.</p>`,
      404
    );
  }

  await db.from("payment_requests").update({ status: "approved" }).eq("id", id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hyrise.swache.in";
  await resend.emails.send({
    from: fromAddress,
    to: [req.user_email],
    subject: "You're now a Pro member — HYRISE",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#16a34a">Welcome to Pro</h2>
        <p>Hi ${esc(req.full_name)},</p>
        <p>Your UPI payment of <strong>₹${esc(req.amount)}</strong> has been verified and your
           account is now <strong>Pro</strong>.</p>
        <p>Every tool is unlocked — salary coach, recruiter scan, company tailoring, job alerts and more.</p>
        <a href="${esc(siteUrl)}/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;
           padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
          Go to dashboard →
        </a>
        <p style="color:#64748b;font-size:14px">Transaction ID: ${esc(req.transaction_id)}</p>
        <p>— HYRISE Team</p>
      </div>
    `,
  });

  return page(`
    <h2 style="color:#16a34a">Approved</h2>
    <p>${esc(req.full_name)} (${esc(req.user_email)}) is now Pro.</p>
    <p style="color:#64748b">A confirmation email has been sent.</p>
  `);
}
