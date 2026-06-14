"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Check } from "lucide-react";

const PRO_FEATURES = [
  "Unlimited ATS checks & enhancements",
  "All premium resume templates",
  "AI Career Mentor with weekly plans",
  "Voice mock interview + report card",
  "Salary negotiation coach",
  "Job search + daily email alerts",
  "LinkedIn & Naukri profile optimizer",
  "Save unlimited resumes",
];

export function BillingClient({ isPro }: { isPro: boolean }) {
  const params = useSearchParams();
  const status = params.get("status");

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    setLoading("checkout");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billing }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data?.error || "Could not start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(null);
    }
  }

  async function openPortal() {
    setError(null);
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data?.error || "Could not open portal.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      {status === "success" && (
        <Alert tone="success">Payment successful! Your Pro features are now active.</Alert>
      )}
      {status === "cancelled" && (
        <Alert tone="info">Checkout cancelled. You can upgrade whenever you&apos;re ready.</Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}

      {/* Already Pro */}
      {isPro && (
        <div className="rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Current Plan</p>
              <h2 className="mt-0.5 text-2xl font-extrabold text-slate-900">Pro</h2>
              <p className="mt-1 text-sm text-slate-500">All features unlocked. Cancel anytime.</p>
            </div>
            <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">ACTIVE</span>
          </div>
          <Button
            size="lg"
            variant="secondary"
            loading={loading === "portal"}
            onClick={openPortal}
            className="mt-5 w-full"
          >
            Manage subscription
          </Button>
        </div>
      )}

      {/* Upgrade flow */}
      {!isPro && (
        <>
          {/* Monthly / Yearly toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 gap-1">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                  billing === "monthly"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("yearly")}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition ${
                  billing === "yearly"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Yearly
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                  SAVE ₹49
                </span>
              </button>
            </div>
          </div>

          {/* Price card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Pro</h2>
              <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                Most popular
              </span>
            </div>

            {billing === "monthly" ? (
              <div className="mt-5">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">₹30</span>
                  <span className="mb-1.5 text-base font-medium text-slate-400">/month</span>
                </div>
                <p className="mt-1 text-xs font-medium text-brand-600">Billed monthly · cancel anytime</p>
              </div>
            ) : (
              <div className="mt-5">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">₹311</span>
                  <span className="mb-1.5 text-base font-medium text-slate-400">/year</span>
                </div>
                <p className="mt-1 text-xs font-medium text-brand-600">
                  That&apos;s ₹25.9/month · save ₹49 vs monthly
                </p>
              </div>
            )}

            <hr className="my-6 border-brand-100" />

            <ul className="grid gap-2.5 sm:grid-cols-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              loading={loading === "checkout"}
              onClick={startCheckout}
              className="mt-7 w-full"
            >
              {billing === "monthly"
                ? "Upgrade to Pro — ₹30/month"
                : "Upgrade to Pro — ₹311/year"}
            </Button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Secure payment via Stripe · Cancel anytime
            </p>
          </div>

          {/* Free plan reminder */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-700">Free plan</h3>
                <p className="text-sm text-slate-400">Resume builder · Job match · Aptitude prep</p>
              </div>
              <span className="text-2xl font-extrabold text-slate-300">₹0</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
