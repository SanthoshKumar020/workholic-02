import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Create a Stripe Checkout Session to upgrade the current user to Pro.
 * Accepts { plan: "monthly" | "yearly" } in the request body.
 * Reuses (or creates) a Stripe customer tied to the profile.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const plan: "monthly" | "yearly" = body.plan === "yearly" ? "yearly" : "monthly";
  const priceId = plan === "yearly"
    ? process.env.STRIPE_PRICE_ID_YEARLY!
    : process.env.STRIPE_PRICE_ID!;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email, plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "pro") {
    return NextResponse.json({ error: "You're already on the Pro plan." }, { status: 400 });
  }

  // Ensure a Stripe customer exists; persist with the admin client.
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await createAdminClient()
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${siteUrl}/billing?status=success`,
    cancel_url: `${siteUrl}/billing?status=cancelled`,
    metadata: { supabase_user_id: user.id },
    subscription_data: { metadata: { supabase_user_id: user.id } },
  });

  return NextResponse.json({ url: session.url });
}
