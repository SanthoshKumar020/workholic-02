import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";
// Stripe needs the raw, unparsed body to verify the signature.
export const dynamic = "force-dynamic";

async function setPlanByCustomer(
  customerId: string,
  plan: "free" | "pro",
  supabaseUserId?: string | null
) {
  const admin = createAdminClient();
  // Prefer the explicit user id from metadata; fall back to the customer id.
  if (supabaseUserId) {
    await admin
      .from("profiles")
      .update({ plan, stripe_customer_id: customerId })
      .eq("id", supabaseUserId);
  } else {
    await admin.from("profiles").update({ plan }).eq("stripe_customer_id", customerId);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing signature or secret." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // `checkout.session.completed` fires when checkout is *finished*, not
        // necessarily when money has arrived. Delayed-notification methods
        // (bank debits, vouchers) complete the session with payment_status
        // "unpaid" and can still fail afterwards. Granting Pro here would give
        // away paid access on a payment that never settles — wait for
        // async_payment_succeeded instead, which this switch also handles.
        if (session.payment_status !== "paid") {
          console.info(
            `[stripe] session ${session.id} completed but payment_status=${session.payment_status}; deferring upgrade`
          );
          break;
        }

        const customerId = session.customer as string;
        const userId = (session.metadata?.supabase_user_id as string) || null;
        await setPlanByCustomer(customerId, "pro", userId);

        if (session.customer_details?.email) {
          await sendEmail({
            to: session.customer_details.email,
            subject: "Welcome to HYRISE Pro 🎉",
            html: `<p>Your upgrade is complete. All templates and job alerts are now unlocked. Head to your dashboard to get started.</p>`,
          });
        }
        break;
      }

      // The other half of the payment_status check above: a delayed payment
      // that eventually settles lands here, and the upgrade happens then.
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const userId = (session.metadata?.supabase_user_id as string) || null;
        await setPlanByCustomer(customerId, "pro", userId);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId = (sub.metadata?.supabase_user_id as string) || null;
        const active = sub.status === "active" || sub.status === "trialing";
        await setPlanByCustomer(customerId, active ? "pro" : "free", userId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId = (sub.metadata?.supabase_user_id as string) || null;
        await setPlanByCustomer(customerId, "free", userId);
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error("[stripe] handler error", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
