import { NextResponse } from "next/server";
import { STUDENT_PLAN } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeApproveToken } from "@/lib/upi";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Escape user-controlled values before interpolating them into the admin
 * email. Without this, a payer could set `fullName` to markup that overlays or
 * relabels the Approve button and trick the admin into approving a payment
 * that never happened.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { fullName, transactionId } = body as { fullName: string; transactionId: string };

  if (!fullName?.trim() || !transactionId?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  // Plan and amount are derived, never taken from the request body. There is
  // one plan at one price (§2.1), and letting the client name the amount it
  // paid is how an approval email ends up quoting a number the payer chose.
  const plan = "student";
  const amount = String(STUDENT_PLAN.price);

  // Save the payment request with the SERVICE-ROLE client.
  //
  // Migration 010 revokes insert/update/delete on `payment_requests` from the
  // `authenticated` role — otherwise a user could insert a row and flip its own
  // status to "approved" straight from the browser. The row is written here
  // instead, with user_id and user_email taken from the verified session rather
  // than from the request body.
  const db = createAdminClient();
  const { data: paymentReq, error: dbErr } = await db
    .from("payment_requests")
    .insert({
      user_id: user.id,
      user_email: user.email,
      full_name: fullName.trim(),
      transaction_id: transactionId.trim(),
      plan,
      amount,
      status: "pending",
    })
    .select()
    .single();

  if (dbErr) {
    console.error("[upi-payment] DB error:", dbErr);
    return NextResponse.json({ error: "Could not save request. Try again." }, { status: 500 });
  }

  // Separate tokens per action, so an approve link can't be edited into a
  // reject. Both links now open a confirmation page rather than acting on GET.
  let approveUrl: string;
  let rejectUrl: string;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hyrise.swache.in";
  try {
    approveUrl = `${siteUrl}/api/upi-approve?id=${paymentReq.id}&action=approve&token=${makeApproveToken(paymentReq.id, "approve")}`;
    rejectUrl = `${siteUrl}/api/upi-approve?id=${paymentReq.id}&action=reject&token=${makeApproveToken(paymentReq.id, "reject")}`;
  } catch {
    // The payment request is saved; only the admin notification fails.
    console.error("[upi-payment] UPI_APPROVE_SECRET is not configured");
    return NextResponse.json(
      { error: "Payment recorded, but approval could not be requested. Please contact support." },
      { status: 500 }
    );
  }

  // Send admin notification email
  const adminEmail =
    (process.env.SUPER_ADMIN_EMAILS ?? "").split(",")[0].trim() || "admin@swache.in";
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "HYRISE <onboarding@resend.dev>",
    to: [adminEmail],
    subject: `💰 New UPI Payment — ${fullName} (${plan})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b;margin-bottom:4px">New UPI Payment Request</h2>
        <p style="color:#64748b;margin-top:0">Someone paid for HYRISE Pro. Verify and approve below.</p>

        <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#f8fafc;border-radius:12px;overflow:hidden">
          <tr><td style="padding:12px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Name</td><td style="padding:12px 16px;color:#1e293b;border-bottom:1px solid #e2e8f0">${esc(fullName)}</td></tr>
          <tr><td style="padding:12px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Email</td><td style="padding:12px 16px;color:#1e293b;border-bottom:1px solid #e2e8f0">${esc(user.email)}</td></tr>
          <tr><td style="padding:12px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Plan</td><td style="padding:12px 16px;color:#1e293b;border-bottom:1px solid #e2e8f0">HYRISE Student — ₹${STUDENT_PLAN.price} for ${STUDENT_PLAN.durationDays} days</td></tr>
          <tr><td style="padding:12px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Amount</td><td style="padding:12px 16px;color:#1e293b;border-bottom:1px solid #e2e8f0">₹${esc(amount)}</td></tr>
          <tr><td style="padding:12px 16px;font-weight:600;color:#475569">Transaction ID</td><td style="padding:12px 16px;color:#1e293b;font-family:monospace;font-size:15px;font-weight:700">${esc(transactionId)}</td></tr>
        </table>

        <p style="color:#64748b;font-size:14px">
          Verify this transaction ID in your UPI app (PhonePe / GPay / Paytm) before approving.
        </p>

        <div style="margin:28px 0;display:flex;gap:12px">
          <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin-right:12px">
            ✅ Approve & Upgrade to Pro
          </a>
          <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px">
            ❌ Reject
          </a>
        </div>

        <p style="color:#94a3b8;font-size:12px">
          Request ID: ${paymentReq.id}<br/>
          User ID: ${user.id}<br/>
          Submitted: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
