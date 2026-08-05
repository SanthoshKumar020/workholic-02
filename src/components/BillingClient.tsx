"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Check } from "lucide-react";
import { track } from "@/lib/analytics";
import { STUDENT_PLAN, PRICE_ANCHOR } from "@/lib/pricing";

/**
 * One plan, one button (§2.1).
 *
 * The monthly/yearly toggle is gone along with the subscription. A toggle at
 * the point of payment is a decision to make, and a decision is a reason to
 * come back later — which nobody does. There is now one price and one action.
 *
 * Every feature line states a number. "Unlimited ATS checks" was replaced with
 * the actual allowance: it is more honest, it reads as more generous than a
 * word people have learned to discount, and it is what the server now enforces.
 */

const STUDENT_FEATURES = [
  `${STUDENT_PLAN.aiActionsPerMonth} AI actions a month`,
  `${STUDENT_PLAN.mockInterviewsPerMonth} mock interviews with report cards`,
  "All 7 resume templates",
  "Company prep — TCS NQT, Infosys, Wipro & more",
  "AI career mentor + weekly plans",
  "Salary negotiation coach",
  "Job search + daily email alerts",
  "LinkedIn & Naukri profile optimizer",
];

export function BillingClient({ isPro, planExpiresAt }: { isPro: boolean; planExpiresAt?: string | null }) {
  const params = useSearchParams();
  const status = params.get("status");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expiryLabel = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  async function startCheckout() {
    setError(null);
    setLoading(true);
    track("checkout_started", { plan: "student" });
    try {
      const res = await fetch("/api/cashfree/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "student" }),
      });
      const data = await res.json();
      if (!res.ok || !data.payment_session_id)
        throw new Error(data?.error || "Could not start checkout.");
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({
        mode: (process.env.NEXT_PUBLIC_CASHFREE_ENV as "sandbox" | "production") ?? "production",
      });
      await cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: "_self" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {status === "success" && (
        <Alert tone="success">Payment successful — all 21 tools are unlocked.</Alert>
      )}
      {status === "cancelled" && (
        <Alert tone="info">Checkout cancelled. You can come back whenever you&apos;re ready.</Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}

      {/* Already on the paid plan */}
      {isPro && (
        <div className="rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Current plan</p>
              <h2 className="mt-0.5 text-2xl font-extrabold text-slate-900">Student</h2>
              <p className="mt-1 text-sm text-slate-500">
                {STUDENT_PLAN.aiActionsPerMonth} AI actions and {STUDENT_PLAN.mockInterviewsPerMonth}{" "}
                mock interviews a month.
              </p>
              {/* Say when it ends without being asked. Someone discovering their
                  access lapsed is a support email and a refund request; someone
                  who knew the date is a renewal. */}
              {expiryLabel && (
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Runs until {expiryLabel}. Nothing renews automatically.
                </p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
              ACTIVE
            </span>
          </div>
          <a
            href="mailto:admin@swache.in?subject=HYRISE%20Student%20—%20question%20about%20my%20plan"
            className="mt-5 flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Question about your plan?
          </a>
        </div>
      )}

      {/* Upgrade */}
      {!isPro && (
        <>
          <div className="relative overflow-hidden rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">HYRISE Student</h2>
              <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                One payment
              </span>
            </div>

            <div className="mt-5">
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                  {STUDENT_PLAN.priceLabel}
                </span>
                <span className="mb-1.5 text-base font-medium text-slate-400">
                  for {STUDENT_PLAN.durationDays} days
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-brand-600">{PRICE_ANCHOR}</p>
            </div>

            <hr className="my-6 border-brand-100" />

            <ul className="grid gap-2.5 sm:grid-cols-2">
              {STUDENT_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> {f}
                </li>
              ))}
            </ul>

            <Button size="lg" loading={loading} onClick={startCheckout} className="mt-7 w-full">
              Pay {STUDENT_PLAN.priceLabel} once
            </Button>
            <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
              UPI, cards and netbanking via Cashfree. No mandate to approve, nothing renews, and
              there is nothing to cancel.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-700">Free plan</h3>
                <p className="text-sm text-slate-400">
                  One go at each core tool · stays free forever
                </p>
              </div>
              <span className="text-2xl font-extrabold text-slate-300">₹0</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
