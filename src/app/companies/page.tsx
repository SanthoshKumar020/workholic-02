import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  COMPANIES,
  COMPANY_CATEGORIES,
  CATEGORY_BLURB,
  DIFFICULTY_COLOR,
  getByCategory,
} from "@/lib/company-data";

export const metadata: Metadata = {
  title: "Company Interview Questions & Process — India 2026 | HYRISE",
  description:
    "Interview process, rounds, difficulty and prep timeline for TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, Flipkart, Swiggy, Razorpay, CRED, Google, Amazon, Microsoft and Meta.",
  keywords: [
    "company interview questions india",
    "TCS interview questions",
    "Infosys interview process",
    "Wipro interview questions",
    "Accenture interview rounds",
    "Flipkart interview process",
    "FAANG interview india",
  ],
  alternates: { canonical: "/companies" },
  openGraph: {
    title: "Company Interview Questions & Process — India 2026 | HYRISE",
    description:
      "Round-by-round interview processes, difficulty and prep timelines for 14 companies that hire heavily in India.",
    url: "/companies",
  },
};

export default function CompaniesHub() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Company interview questions and processes (India)",
    itemListElement: COMPANIES.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${c.name} interview questions and process`,
      url: `https://hyrise.swache.in/companies/${c.id}`,
    })),
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <header className="text-center">
          <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Company Interview Prep
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Company interview questions &amp; process
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Every round, its duration, and what interviewers actually assess — for {COMPANIES.length} companies
            that hire at scale in India. Pick a company to see the full process before you apply.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/company-prep"
              className="inline-block rounded-xl bg-brand-gradient px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Generate a question bank →
            </Link>
            <Link
              href="/interview"
              className="inline-block rounded-xl border border-brand-300 bg-white px-6 py-3 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Practise a mock interview
            </Link>
          </div>
        </header>

        {COMPANY_CATEGORIES.map((cat) => {
          const list = getByCategory(cat);
          if (list.length === 0) return null;
          return (
            <section key={cat} className="mt-12">
              <h2 className="text-xl font-bold text-slate-900">{cat}</h2>
              <p className="mt-1 text-sm text-slate-500">{CATEGORY_BLURB[cat]}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {list.map((c) => (
                  <Link
                    key={c.id}
                    href={`/companies/${c.id}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="text-2xl">{c.emoji}</span>
                      <span className="font-semibold text-slate-900">{c.name}</span>
                      <span className={`ml-auto rounded-full border px-2 py-0.5 text-xs font-semibold ${DIFFICULTY_COLOR[c.difficulty]}`}>
                        {c.difficulty}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{c.tagline}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {c.avgRounds} rounds · {c.prepWeeks} of prep
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-12 rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h2 className="text-xl font-bold text-brand-800">Reading about a process isn&apos;t the same as sitting in one</h2>
          <p className="mt-1 text-sm text-brand-700">
            Use the company question bank to generate role-specific questions, then answer them out loud in a mock
            interview that scores your structure, pacing, and filler words.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/company-prep" className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
              Company question bank
            </Link>
            <Link href="/interview" className="rounded-xl border border-brand-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
              Start mock interview
            </Link>
            <Link href="/interview-questions" className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Questions by role
            </Link>
          </div>
        </section>

        <section className="mt-12 border-t border-slate-100 pt-8">
          <h2 className="text-lg font-bold text-slate-900">Where this information comes from</h2>
          <p className="mt-2 text-sm text-slate-600">
            These pages describe process shape — number of rounds, typical duration, and what each round assesses —
            based on publicly reported hiring patterns. Processes change, and they differ by role, level, and campus
            versus lateral hiring, so always confirm against the company&apos;s own careers page and your recruiter.
            Salary bands are indicative ranges, not offers. We don&apos;t publish pass rates, and we don&apos;t
            guarantee interviews, offers, or employment.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
