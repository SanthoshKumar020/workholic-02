"use client";

import Link from "next/link";

const FREE_FEATURES = [
  "5 free AI uses per tool",
  "ATS score checker",
  "AI resume enhancement",
  "1 resume template",
  "Export to PDF",
  "Dashboard & saved resumes",
];

const PRO_MONTHLY_FEATURES = [
  "Unlimited AI uses — all tools",
  "All premium resume templates",
  "AI Career Mentor + weekly plans",
  "Voice mock interview + report card",
  "Salary negotiation coach",
  "Job search + daily email alerts",
  "LinkedIn & Naukri profile optimizer",
  "Cover letter generator",
  "GD practice, English learning & more",
];

const PRO_ANNUAL_FEATURES = [
  ...PRO_MONTHLY_FEATURES,
  "Save ₹49 vs monthly — best value",
  "Priority support",
];

const COMPARE_ROWS: { feature: string; free: string | boolean; pro: boolean }[] = [
  { feature: "ATS score checker",            free: "1 check",      pro: true },
  { feature: "AI resume enhancement",        free: "5 uses",       pro: true },
  { feature: "Resume templates",             free: "1 template",   pro: true },
  { feature: "PDF export",                   free: true,           pro: true },
  { feature: "Job Match Analyzer",           free: "5 uses",       pro: true },
  { feature: "Mock Interview + report card", free: "5 sessions",   pro: true },
  { feature: "Learning roadmaps",            free: "5 uses",       pro: true },
  { feature: "Aptitude prep",                free: "5 uses",       pro: true },
  { feature: "Outreach generator",           free: "5 uses",       pro: true },
  { feature: "GD practice",                  free: "5 uses",       pro: true },
  { feature: "English learning",             free: "5 uses",       pro: true },
  { feature: "AI Career Mentor",             free: false,          pro: true },
  { feature: "Salary coach",                 free: false,          pro: true },
  { feature: "Job search + email alerts",    free: false,          pro: true },
  { feature: "LinkedIn / Naukri optimizer",  free: false,          pro: true },
  { feature: "Cover letter generator",       free: false,          pro: true },
  { feature: "Recruiter scan & tailoring",   free: false,          pro: true },
  { feature: "Priority support",             free: false,          pro: true },
];

export function PricingSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const proHref = isLoggedIn ? "/billing" : "/signup";

  return (
    <section id="pricing" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-brand-100/50 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-violet-100/40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Simple, <span className="text-gradient">honest pricing</span>
          </h2>
          <p className="mt-3 text-slate-600">
            Start free forever. Upgrade to Pro when you&apos;re ready. Cancel anytime.
          </p>
        </div>

        {/* Three plan cards */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-3">

          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Free</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-extrabold text-slate-900">₹0</span>
              <span className="mb-1 text-sm text-slate-400">/month</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Forever free to start</p>
            <hr className="my-5 border-slate-100" />
            <ul className="flex-1 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckIcon className="text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-7 block rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Create free account
            </Link>
          </div>

          {/* Pro Monthly — Most Popular */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-brand-500 bg-white p-7 shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Pro</p>
              <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                Most popular
              </span>
            </div>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-extrabold text-slate-900">₹30</span>
              <span className="mb-1 text-sm text-slate-400">/month</span>
            </div>
            <p className="mt-1 text-xs font-medium text-brand-600">Less than a cup of chai ☕</p>
            <hr className="my-5 border-brand-100" />
            <ul className="flex-1 space-y-3">
              {PRO_MONTHLY_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckIcon className="text-brand-500" /> {f}
                </li>
              ))}
            </ul>
            <Link
              href={proHref}
              className="mt-7 block rounded-xl bg-brand-gradient px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              {isLoggedIn ? "Upgrade to Pro — ₹30/mo" : "Get Pro — ₹30/mo"}
            </Link>
          </div>

          {/* Pro Annual — Best Value */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-violet-400 bg-gradient-to-b from-violet-50 to-white p-7 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-brand-500" />
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Pro Annual</p>
              <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                Best value
              </span>
            </div>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-extrabold text-slate-900">₹311</span>
              <span className="mb-1 text-sm text-slate-400">/year</span>
            </div>
            <p className="mt-1 text-xs font-medium text-violet-600">₹25.9/mo · save ₹49 vs monthly</p>
            <hr className="my-5 border-violet-100" />
            <ul className="flex-1 space-y-3">
              {PRO_ANNUAL_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckIcon className="text-violet-500" /> {f}
                </li>
              ))}
            </ul>
            <Link
              href={proHref}
              className="mt-7 block rounded-xl border-2 border-violet-500 bg-white px-4 py-2.5 text-center text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              {isLoggedIn ? "Upgrade — ₹311/yr" : "Get Annual — ₹311/yr"}
            </Link>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h3 className="mb-6 text-center text-lg font-bold text-slate-900">
            Free vs Pro — full comparison
          </h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center text-brand-600">Pro</span>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 items-center px-5 py-3.5 text-sm ${
                  i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                }`}
              >
                <span className="font-medium text-slate-700">{row.feature}</span>
                <span className="text-center">
                  {row.free === false ? (
                    <span className="text-slate-300">—</span>
                  ) : row.free === true ? (
                    <GreenCheck />
                  ) : (
                    <span className="text-xs font-semibold text-amber-600">{row.free}</span>
                  )}
                </span>
                <span className="text-center">
                  {row.pro ? <GreenCheck /> : <span className="text-slate-300">—</span>}
                </span>
              </div>
            ))}
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
    <svg className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function GreenCheck() {
  return (
    <span className="inline-flex justify-center">
      <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    </span>
  );
}
