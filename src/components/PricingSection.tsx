"use client";

import { useState } from "react";
import Link from "next/link";

const FREE_FEATURES = [
  "5 free AI uses (resume, match, interview…)",
  "AI resume enhancement",
  "ATS score checker",
  "1 clean resume template",
  "Export to PDF",
  "Save to dashboard",
];

const PRO_FEATURES = [
  "Unlimited AI uses across all tools",
  "All premium resume templates",
  "AI Career Mentor + weekly plans",
  "Voice mock interview + report card",
  "Salary negotiation coach",
  "Job search + daily email alerts",
  "LinkedIn & Naukri profile optimizer",
  "Save unlimited resumes",
  "GD practice & English learning",
];

export function PricingSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <section id="pricing" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-brand-100/50 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-violet-100/40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Simple,{" "}
            <span className="text-gradient">honest pricing</span>
          </h2>
          <p className="mt-3 text-slate-600">
            Start free. Upgrade when you&apos;re ready. Cancel anytime — no questions asked.
          </p>
        </div>

        {/* Billing toggle — visible to everyone */}
        <div className="mt-8 flex justify-center">
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

        {/* Plan cards — visible to everyone */}
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">

          {/* Free plan */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Free</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                Forever free
              </span>
            </div>

            <div className="mt-5 flex items-end gap-1">
              <span className="text-5xl font-extrabold tracking-tight text-slate-900">₹0</span>
              <span className="mb-1 text-base font-medium text-slate-400">/month</span>
            </div>

            <hr className="my-6 border-slate-100" />

            <ul className="flex-1 space-y-3.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <CheckIcon className="text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="mt-8 block rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Create free account
            </Link>
          </div>

          {/* Pro plan */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-lg ring-glow">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Pro</h3>
              <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                Most popular
              </span>
            </div>

            {billing === "monthly" ? (
              <div className="mt-5">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">₹30</span>
                  <span className="mb-1.5 text-base font-medium text-slate-400">/month</span>
                </div>
                <p className="mt-1 text-xs font-medium text-brand-600">
                  That&apos;s less than a cup of chai ☕
                </p>
              </div>
            ) : (
              <div className="mt-5">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">₹311</span>
                  <span className="mb-1.5 text-base font-medium text-slate-400">/year</span>
                </div>
                <p className="mt-1 text-xs font-medium text-brand-600">
                  ₹25.9/month · save ₹49 vs monthly ☕
                </p>
              </div>
            )}

            <hr className="my-6 border-brand-100" />

            <ul className="flex-1 space-y-3.5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <CheckIcon className="text-brand-500" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={isLoggedIn ? "/billing" : "/signup"}
              className="mt-8 block rounded-xl bg-brand-gradient px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-90 hover:shadow-glow-sm"
            >
              {isLoggedIn
                ? (billing === "monthly" ? "Upgrade to Pro — ₹30/mo" : "Upgrade to Pro — ₹311/yr")
                : "Get started — it&apos;s free"}
            </Link>

            {!isLoggedIn && (
              <p className="mt-3 text-center text-xs text-slate-400">
                Create a free account first · upgrade to Pro anytime
              </p>
            )}
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs text-slate-400">
          HYRISE by{" "}
          <span className="font-semibold text-slate-500">Santo Square Automation</span>. We help
          you improve your resume — we do not guarantee interviews, offers, or employment outcomes.
        </p>
      </div>
    </section>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 shrink-0 ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
