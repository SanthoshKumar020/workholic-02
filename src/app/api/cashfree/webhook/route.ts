import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
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
      await admin.from("profiles").update({ plan: "pro" }).eq("id", userId);

      const { data: profile } = await admin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();

      if (profile?.email) {
        await sendEmail({
          to: profile.email,
          subject: "Welcome to HYRISE Pro 🎉",
          html: `<p>Your upgrade is complete. All features are now unlocked. <a href="https://workholic-02-orpin.vercel.app/dashboard">Go to dashboard →</a></p>`,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
