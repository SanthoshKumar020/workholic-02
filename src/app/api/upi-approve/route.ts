import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

function makeApproveToken(requestId: string): string {
  const secret = process.env.UPI_APPROVE_SECRET ?? "fallback-secret-change-me";
  return crypto.createHmac("sha256", secret).update(requestId).digest("hex");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id      = searchParams.get("id");
  const token   = searchParams.get("token");
  const action  = searchParams.get("action") ?? "approve";

  if (!id || !token) {
    return new NextResponse("Invalid link.", { status: 400 });
  }

  // Verify HMAC token
  const expected = makeApproveToken(id);
  if (token !== expected) {
    return new NextResponse("Invalid or expired approval link.", { status: 403 });
  }

  // Use service role to bypass RLS
  const supabase = createClient();

  // Fetch payment request
  const { data: req, error: fetchErr } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !req) {
    return new NextResponse("Payment request not found.", { status: 404 });
  }
  if (req.status !== "pending") {
    return new NextResponse(`Already ${req.status}.`, { status: 409 });
  }

  if (action === "reject") {
    await supabase.from("payment_requests").update({ status: "rejected" }).eq("id", id);

    // Notify user of rejection
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ResumeBoost <onboarding@resend.dev>",
      to: [req.user_email],
      subject: "Your ResumeBoost payment could not be verified",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#dc2626">Payment Not Verified</h2>
          <p>Hi ${req.full_name},</p>
          <p>We could not verify your UPI payment with transaction ID <strong>${req.transaction_id}</strong>.</p>
          <p>Please contact us at <a href="mailto:kumarsanthosh2743@gmail.com">kumarsanthosh2743@gmail.com</a> or WhatsApp <strong>6374310315</strong> with your payment screenshot and we'll resolve it.</p>
          <p>— ResumeBoost Team</p>
        </div>
      `,
    });

    return new NextResponse(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2 style="color:#dc2626">❌ Payment Rejected</h2>
        <p>User has been notified.</p>
      </body></html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  // Upgrade user plan to pro
  const { error: upgradeErr } = await supabase
    .from("profiles")
    .update({ plan: "pro" })
    .eq("id", req.user_id);

  if (upgradeErr) {
    return new NextResponse(`Failed to upgrade: ${upgradeErr.message}`, { status: 500 });
  }

  // Mark request as approved
  await supabase.from("payment_requests").update({ status: "approved" }).eq("id", id);

  // Notify user of approval
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "ResumeBoost <onboarding@resend.dev>",
    to: [req.user_email],
    subject: "🎉 You're now a Pro member — ResumeBoost",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#16a34a">🎉 Welcome to Pro!</h2>
        <p>Hi ${req.full_name},</p>
        <p>Your UPI payment of <strong>₹${req.amount}</strong> has been verified and your account has been upgraded to <strong>Pro</strong>.</p>
        <p>You now have access to all Pro features including Salary Coach, Recruiter Scan, Company Tailoring, and more.</p>
        <a href="${siteUrl}/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
          Go to Dashboard →
        </a>
        <p style="color:#64748b;font-size:14px">Transaction ID: ${req.transaction_id}</p>
        <p>— ResumeBoost Team</p>
      </div>
    `,
  });

  return new NextResponse(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px">
      <h2 style="color:#16a34a">✅ Approved!</h2>
      <p>${req.full_name} (${req.user_email}) has been upgraded to Pro.</p>
      <p style="color:#64748b">A confirmation email has been sent to the user.</p>
    </body></html>
  `, { headers: { "Content-Type": "text/html" } });
}
