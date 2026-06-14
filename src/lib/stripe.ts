import "server-only";

import Stripe from "stripe";

/**
 * Server-side Stripe client. Uses the secret key — never exposed to the browser.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});
