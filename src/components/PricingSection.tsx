"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";
import { STUDENT_PLAN, PRICE_ANCHOR } from "@/lib/pricing";

/**
 * Two plans, not three (§2.1).
 *
 * The old section offered Free, Pro Monthly and Pro Annual. Three columns to
 * choose between is a decision, and a decision at the point of payment is a
 * place to stop and think about it later. There is now one thing to buy.
 *
 * Both plans state explicit allowances. "Unlimited" was removed everywhere: it
 * was untrue the moment a mock interview cost ₹3.60 against ₹24 of revenue, and
 * a stated number reads as more generous than a word nobody believes.
 */

const FREE_FEATURES = [
  "1 free go at each of the 4 core tools",
  "ATS score check with the full 6-point report",
  "PDF export",
  "1 resume template",
  "Dashboard & saved resumes",
];

const STUDENT_FEATURES = [
  `${STUDENT_PLAN.aiActionsPerMonth} AI actions a month`,
  `${STUDENT_PLAN.mockInterviewsPerMonth} mock interviews a month, with report cards`,
  "All 21 tools",
  "Every resume template",
  "Company prep — TCS NQT, Infosys, Wipro, Cognizant & more",
  "Aptitude, DSA and English practice",
  "Job search + daily email alerts",
];

const COMPARE_ROWS: { feature: string; free: string | boolean; paid: string | boolean }[] = [
  { feature: "ATS score check", free: "1 check", paid: "Included in monthly actions" },
  { feature: "AI resume rewrite", free: "1 use", paid: "Included in monthly actions" },
  { feature: "Job match analyzer", free: "1 use", paid: "Included in monthly actions" },
  { feature: "Mock interview + report card", free: "1 session", paid: `${STUDENT_PLAN.mockInterviewsPerMonth}/month` },
  { feature: "Monthly AI actions", free: "—", paid: `${STUDENT_PLAN.aiActionsPerMonth}` },
  { feature: "Resume templates", free: "1 template", paid: "All 7" },
  { feature: "PDF export", free: true, paid: true },
  { feature: "Aptitude, DSA & English practice", free: false, paid: true },
  { feature: "Company-specific prep", free: false, paid: true },
  { feature: "Cover letters & cold outreach", free: false, paid: true },
  { feature: "AI career mentor & salary coach", free: false, paid: true },
  { feature: "Job search + email alerts", free: false, paid: true },
  { feature: "LinkedIn / Naukri optimizer", free: false, paid: true },
  { feature: "Recruiter scan & tailoring", free: false, paid: true },
];

export function PricingSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const paidHref = isLoggedIn ? "/billing" : "/signup";
  const sectionRef = useRef<HTMLElement>(null);

  // Fire `pricing_viewed` once, when the section actually scrolls into view.
  // "How many visitors even reach pricing?" is the first question you'll ask.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          track("pricing_viewed", { loggedIn: isLoggedIn });
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoggedIn]);

  return (
    <section ref={sectionRef} id="pricing" className="relative overflow-hidden py-24">
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
            Start free. One payment when you&apos;re ready — no subscription, no auto-renewal, no
            UPI mandate to set up.
          </p>
        </div>

        {/* Two plan cards */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Free</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-extrabold text-slate-900">₹0</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Free forever. No card, ever.</p>
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
              onClick={() => track("signup_cta_clicked", { source: "pricing_free" })}
              className="mt-7 block rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Create free account
            </Link>
          </div>

          {/* Student */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-brand-500 bg-white p-7 shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Student</p>
              <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                One payment
              </span>
            </div>
            <div className="mt-3 flex items-end gap-1.5">
              <span className="text-4xl font-extrabold text-slate-900">{STUDENT_PLAN.priceLabel}</span>
              <span className="mb-1 text-sm text-slate-400">for {STUDENT_PLAN.durationDays} days</span>
            </div>
            <p className="mt-1 text-xs font-medium text-brand-600">{PRICE_ANCHOR}</p>
            <hr className="my-5 border-brand-100" />
            <ul className="flex-1 space-y-3">
              {STUDENT_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckIcon className="text-brand-500" /> {f}
                </li>
              ))}
            </ul>
            <Link
              href={paidHref}
              onClick={() => track("upgrade_clicked", { plan: "student", loggedIn: isLoggedIn })}
              className="mt-7 block rounded-xl bg-brand-gradient px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Get Student — {STUDENT_PLAN.priceLabel}
            </Link>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
              Pay once by UPI. Nothing renews, and there is nothing to cancel.
            </p>
          </div>
        </div>

        {/* A college pays instead — this is now a real second audience (§3). */}
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-center">
          <p className="text-sm text-slate-600">
            <strong className="text-slate-900">Are you a placement officer?</strong> Institutions
            license HYRISE for a whole batch, and students pay nothing.{" "}
            <Link href="/for-colleges" className="font-semibold text-brand-600 hover:underline">
              See pricing for colleges →
            </Link>
          </p>
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h3 className="mb-6 text-center text-lg font-bold text-slate-900">
            Free vs Student — full comparison
          </h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Equal thirds gave the feature name the same width as a tick.
                Weighted columns keep the label readable at 320px. */}
            <div className="grid grid-cols-[1.6fr_1fr_1fr] border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 sm:px-5 sm:text-xs">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center text-brand-600">Student</span>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1.6fr_1fr_1fr] items-center px-4 py-3.5 text-sm sm:px-5 ${
                  i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                }`}
              >
                <span className="pr-2 font-medium text-slate-700">{row.feature}</span>
                <Cell value={row.free} />
                <Cell value={row.paid} />
              </div>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs text-slate-400">
          HYRISE by{" "}
          <span className="font-semibold text-slate-500">Swache Technologies (OPC) Private Limited</span>. We help
          you improve your resume — we do not guarantee interviews, offers, or employment outcomes.
        </p>
      </div>
    </section>
  );
}

function Cell({ value }: { value: string | boolean }) {
  return (
    <span className="text-center">
      {value === false || value === "—" ? (
        <span className="text-slate-300">—</span>
      ) : value === true ? (
        <GreenCheck />
      ) : (
        <span className="text-xs font-semibold text-slate-600">{value}</span>
      )}
    </span>
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
