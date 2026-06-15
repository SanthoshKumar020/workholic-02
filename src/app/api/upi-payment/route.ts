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

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { fullName, transactionId, plan, amount } = body as {
    fullName: string; transactionId: string; plan: string; amount: string;
  };

  if (!fullName?.trim() || !transactionId?.trim() || !plan || !amount) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  // Save payment request to Supabase
  const { data: paymentReq, error: dbErr } = await supabase
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

  const approveToken = makeApproveToken(paymentReq.id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const approveUrl = `${siteUrl}/api/upi-approve?id=${paymentReq.id}&token=${approveToken}`;
  const rejectUrl  = `${siteUrl}/api/upi-approve?id=${paymentReq.id}&token=${approveToken}&action=reject`;

  // Send admin notification email
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "HYRISE <onboarding@resend.dev>",
    to: ["kumarsanthosh2743@gmail.com"],
    subject: `💰 New UPI Payment — ${fullName} (${plan})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b;margin-bottom:4px">New UPI Payment Request</h2>
        <p style="color:#64748b;margin-top:0">Someone paid for HYRISE Pro. Verify and approve below.</p>

        <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#f8fafc;border-radius:12px;overflow:hidden">
          <tr><td style="padding:12px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Name</td><td style="padding:12px 16px;color:#1e293b;border-bottom:1px solid #e2e8f0">${fullName}</td></tr>
          <tr><td style="padding:12px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Email</td><td style="padding:12px 16px;color:#1e293b;border-bottom:1px solid #e2e8f0">${user.email}</td></tr>
          <tr><td style="padding:12px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Plan</td><td style="padding:12px 16px;color:#1e293b;border-bottom:1px solid #e2e8f0">${plan === "yearly" ? "Yearly ₹311" : "Monthly ₹30"}</td></tr>
          <tr><td style="padding:12px 16px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Amount</td><td style="padding:12px 16px;color:#1e293b;border-bottom:1px solid #e2e8f0">₹${amount}</td></tr>
          <tr><td style="padding:12px 16px;font-weight:600;color:#475569">Transaction ID</td><td style="padding:12px 16px;color:#1e293b;font-family:monospace;font-size:15px;font-weight:700">${transactionId}</td></tr>
        </table>

        <p style="color:#64748b;font-size:14px">
          📱 Verify this transaction ID in your UPI app (PhonePe / GPay / Paytm).<br/>
          Phone: <strong>6374310315</strong>
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
