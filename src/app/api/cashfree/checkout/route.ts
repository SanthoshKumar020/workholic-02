import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cashfree } from "@/lib/cashfree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const plan: "monthly" | "yearly" = body.plan === "yearly" ? "yearly" : "monthly";
  const amount = plan === "yearly" ? 311 : 30;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, email")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "pro") {
    return NextResponse.json({ error: "You're already on the Pro plan." }, { status: 400 });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  const orderId = `rsb_${Date.now()}_${user.id.replace(/-/g, "").slice(0, 10)}`;

  const orderRequest = {
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: user.id.replace(/-/g, "").slice(0, 50),
      customer_email: user.email ?? profile?.email ?? "user@example.com",
      customer_phone: "9999999999",
    },
    order_meta: {
      return_url: `${siteUrl}/billing?status=success&order_id={order_id}`,
      notify_url: `${siteUrl}/api/cashfree/webhook`,
    },
    order_tags: {
      supabase_user_id: user.id,
      plan,
    },
  };

  try {
    const response = await cashfree.PGCreateOrder(orderRequest);
    const sessionId = response.data?.payment_session_id;
    if (!sessionId) throw new Error("No session ID returned");
    return NextResponse.json({ payment_session_id: sessionId });
  } catch (err: unknown) {
    // The Cashfree SDK is axios-based: the useful reason is in err.response.data,
    // not err.message (which is just "Request failed with status code 401").
    const ax = err as {
      response?: { status?: number; data?: { message?: string; code?: string; type?: string } };
      message?: string;
    };
    const cashfreeStatus = ax?.response?.status;
    const cashfreeData = ax?.response?.data;
    const reason = cashfreeData?.message || ax?.message || "Failed to create order.";

    console.error("[cashfree] create order error", {
      status: cashfreeStatus,
      code: cashfreeData?.code,
      type: cashfreeData?.type,
      message: cashfreeData?.message,
      env: process.env.NEXT_PUBLIC_CASHFREE_ENV,
    });

    // 401/403 from Cashfree means credentials/permissions — surface it clearly.
    if (cashfreeStatus === 401 || cashfreeStatus === 403) {
      return NextResponse.json(
        { error: `Cashfree rejected the request (${cashfreeStatus}): ${reason}. Check API keys, environment, and account activation.` },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: reason }, { status: 502 });
  }
}
