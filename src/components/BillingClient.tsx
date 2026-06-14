"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Check, Copy, CheckCircle2, Smartphone, CreditCard } from "lucide-react";

const UPI_ID = "kumarsanthosh2743@okicici";

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

function CopyUPI() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(UPI_ID);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-100 transition"
    >
      <span className="font-mono">{UPI_ID}</span>
      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export function BillingClient({ isPro }: { isPro: boolean }) {
  const params = useSearchParams();
  const status = params.get("status");

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [payMethod, setPayMethod] = useState<"stripe" | "upi">("stripe");
  const [loading, setLoading] = useState<"checkout" | "portal" | "upi" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upiStep, setUpiStep] = useState<"qr" | "form" | "done">("qr");
  const [upiSuccess, setUpiSuccess] = useState(false);

  // UPI form state
  const [fullName, setFullName] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [upiError, setUpiError] = useState<string | null>(null);

  const amount = billing === "yearly" ? "311" : "30";

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

  async function submitUpiForm() {
    if (!fullName.trim() || !transactionId.trim()) {
      setUpiError("Please fill in all fields.");
      return;
    }
    setUpiError(null);
    setLoading("upi");
    try {
      const res = await fetch("/api/upi-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, transactionId, plan: billing, amount }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setUpiStep("done");
    } catch (e) {
      setUpiError(e instanceof Error ? e.message : "Submission failed. Try again.");
    } finally {
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
          <Button size="lg" variant="secondary" loading={loading === "portal"} onClick={openPortal} className="mt-5 w-full">
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
              <button type="button" onClick={() => setBilling("monthly")}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${billing === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                Monthly
              </button>
              <button type="button" onClick={() => setBilling("yearly")}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition ${billing === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                Yearly
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">SAVE ₹49</span>
              </button>
            </div>
          </div>

          {/* Price card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Pro</h2>
              <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">Most popular</span>
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
                <p className="mt-1 text-xs font-medium text-brand-600">That&apos;s ₹25.9/month · save ₹49 vs monthly</p>
              </div>
            )}

            <hr className="my-6 border-brand-100" />

            <ul className="grid gap-2.5 sm:grid-cols-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> {f}
                </li>
              ))}
            </ul>

            {/* Payment method selector */}
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => { setPayMethod("stripe"); setUpiStep("qr"); }}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition ${payMethod === "stripe" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
                <CreditCard className="h-4 w-4" /> Card / Stripe
              </button>
              <button type="button" onClick={() => { setPayMethod("upi"); setUpiStep("qr"); }}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition ${payMethod === "upi" ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
                <Smartphone className="h-4 w-4" /> UPI / QR
              </button>
            </div>

            {/* Stripe */}
            {payMethod === "stripe" && (
              <>
                <Button size="lg" loading={loading === "checkout"} onClick={startCheckout} className="mt-4 w-full">
                  {billing === "monthly" ? "Pay ₹30/month via Stripe" : "Pay ₹311/year via Stripe"}
                </Button>
                <p className="mt-3 text-center text-xs text-slate-400">Secure payment via Stripe · Cancel anytime</p>
              </>
            )}

            {/* UPI */}
            {payMethod === "upi" && (
              <div className="mt-4">
                {/* Step 1 — QR + UPI ID */}
                {upiStep === "qr" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center space-y-3">
                      <p className="text-sm font-bold text-green-800">
                        Pay ₹{amount} to the QR code below
                      </p>
                      <div className="flex justify-center">
                        <div className="overflow-hidden rounded-2xl border-4 border-white shadow-lg">
                          <Image
                            src="/upi-qr.jpg"
                            alt="UPI QR Code"
                            width={200}
                            height={200}
                            className="block"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-green-600">Or pay using UPI ID</p>
                        <div className="flex justify-center">
                          <CopyUPI />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Open PhonePe · GPay · Paytm · any UPI app and scan or enter the ID above
                      </p>
                    </div>

                    <Button onClick={() => setUpiStep("form")} className="w-full" size="lg">
                      I&apos;ve Paid — Enter Transaction Details →
                    </Button>
                  </div>
                )}

                {/* Step 2 — Transaction form */}
                {upiStep === "form" && (
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div>
                      <h3 className="font-bold text-slate-900">Confirm your payment</h3>
                      <p className="text-sm text-slate-500">We&apos;ll verify your transaction and activate Pro within a few hours.</p>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Amount paid: <span className="font-bold">₹{amount}</span> ·
                      Plan: <span className="font-bold capitalize">{billing}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Your Name</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                          placeholder="As shown in UPI app"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Transaction ID / UTR Number</label>
                        <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. 426789012345 or T2506140001..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                        <p className="mt-1 text-xs text-slate-400">Find this in your UPI app under payment history</p>
                      </div>
                    </div>

                    {upiError && (
                      <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{upiError}</p>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setUpiStep("qr")} className="px-4">← Back</Button>
                      <Button onClick={submitUpiForm} loading={loading === "upi"} className="flex-1">
                        Submit for Verification
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3 — Success */}
                {upiStep === "done" && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
                    <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-7 w-7 text-green-600" />
                    </div>
                    <h3 className="font-bold text-green-800">Request submitted!</h3>
                    <p className="text-sm text-green-700">
                      We&apos;ll verify your payment and activate Pro within a few hours.
                      You&apos;ll get a confirmation email once it&apos;s done.
                    </p>
                    <p className="text-xs text-slate-500">
                      Questions? WhatsApp <strong>6374310315</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
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
