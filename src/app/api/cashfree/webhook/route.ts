import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { STUDENT_PLAN } from "@/lib/pricing";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const secret = process.env.CASHFREE_SECRET_KEY;

  // Fail closed: without the secret we cannot verify anything, so we must not
  // process the payload. (`!` previously let an undefined secret through into
  // the HMAC, which would silently produce a stable, forgeable digest.)
  if (!secret) {
    console.error("[cashfree] CASHFREE_SECRET_KEY is not configured");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  // Cashfree signs `timestamp + body`. The timestamp is only meaningful if we
  // actually check it — otherwise a legitimate webhook captured once can be
  // replayed forever, re-triggering the upgrade path indefinitely.
  const REPLAY_WINDOW_MS = 5 * 60 * 1000;
  const rawTs = Number(timestamp);
  // Cashfree sends epoch seconds; accept milliseconds too rather than
  // rejecting valid webhooks if that ever changes.
  const tsMs = rawTs < 1e12 ? rawTs * 1000 : rawTs;

  if (!Number.isFinite(rawTs) || Math.abs(Date.now() - tsMs) > REPLAY_WINDOW_MS) {
    console.error("[cashfree] webhook timestamp outside the accepted window");
    return NextResponse.json({ error: "Stale webhook." }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + body)
    .digest("base64");

  // Constant-time compare: `!==` on a secret-derived string leaks information
  // through timing. Lengths must match before timingSafeEqual is called.
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  const signatureValid =
    expectedBuf.length === signatureBuf.length &&
    crypto.timingSafeEqual(expectedBuf, signatureBuf);

  if (!signatureValid) {
    console.error("[cashfree] webhook signature mismatch");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
    const data = event.data as Record<string, unknown>;
    const order = data?.order as Record<string, unknown> | undefined;
    const tags = order?.order_tags as Record<string, string> | undefined;
    const userId = tags?.supabase_user_id;

    if (userId) {
      const admin = createAdminClient();

      // A one-time payment buys a fixed window, so the window has to be written
      // down. Without `plan_expires_at` a single ₹299 would grant Pro forever —
      // the recurring mandate used to provide the end date for free.
      const expiresAt = new Date(Date.now() + STUDENT_PLAN.durationDays * 86_400_000);
      await admin
        .from("profiles")
        .update({ plan: "pro", plan_expires_at: expiresAt.toISOString() })
        .eq("id", userId);

      const { data: profile } = await admin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();

      if (profile?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hyrise.swache.in";
        const until = expiresAt.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        await sendEmail({
          to: profile.email,
          subject: "You're on HYRISE Student 🎉",
          // State the allowance and the end date up front. Both are things the
          // customer will otherwise discover by surprise, and a surprise about
          // what you paid for is a refund request.
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#334155;line-height:1.7">
              <p>Your payment went through — all 21 tools are unlocked.</p>
              <p style="margin:20px 0;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
                <strong style="color:#0f172a">HYRISE Student</strong><br>
                ${STUDENT_PLAN.aiActionsPerMonth} AI actions and ${STUDENT_PLAN.mockInterviewsPerMonth} mock interviews a month<br>
                Runs until <strong>${until}</strong> — nothing renews, and there is nothing to cancel.
              </p>
              <p><a href="${appUrl}/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:12px">Go to your dashboard →</a></p>
              <p style="font-size:13px;color:#64748b">Start with a mock interview — it's the tool people tell us moved the needle most.</p>
            </div>`,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
