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
  const secret = process.env.CASHFREE_SECRET_KEY!;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + body)
    .digest("base64");

  if (expected !== signature) {
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
