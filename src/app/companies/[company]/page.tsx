import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  COMPANIES,
  DIFFICULTY_COLOR,
  STEP_TYPE_COLOR,
  STEP_TYPE_LABEL,
  getCompany,
  relatedCompanies,
  type Category,
} from "@/lib/company-data";
import { companyFaq, companyValueQuestions } from "@/lib/seo/content";
import { getSeoRole } from "@/lib/seo/roles";

interface Props {
  params: { company: string };
}

/** Role pages worth linking from each company category. */
const CATEGORY_ROLE_SLUGS: Record<Category, string[]> = {
  "FAANG": ["software-engineer", "machine-learning-engineer", "data-engineer"],
  "Indian Product": ["software-engineer", "backend-developer", "product-manager"],
  "IT Services": ["software-engineer", "sql-developer", "technical-support-engineer"],
};

export function generateStaticParams() {
  return COMPANIES.map((c) => ({ company: c.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const c = getCompany(params.company);
  if (!c) return { title: "Company Interview Questions — HYRISE" };

  const title = `${c.name} Interview Questions & Process 2026 | HYRISE`;
  const description = `${c.name} interview process: ${c.avgRounds} rounds (${c.interviewProcess
    .map((s) => s.name)
    .slice(0, 3)
    .join(", ")}…), rated ${c.difficulty}. What each round assesses, the values interviewers score against, and a ${c.prepWeeks} prep plan.`;

  return {
    title,
    description,
    keywords: [
      `${c.name} interview questions`,
      `${c.name} interview process`,
      `${c.name} interview rounds`,
      `${c.name} interview preparation`,
      `how to crack ${c.name} interview`,
      `${c.name} hiring process India`,
    ],
    alternates: { canonical: `/companies/${c.id}` },
    openGraph: { title, description, url: `/companies/${c.id}` },
  };
}

export default function CompanyPage({ params }: Props) {
  const c = getCompany(params.company);
  if (!c) notFound();

  const faq = companyFaq(c);
  const valueQuestions = companyValueQuestions(c);
  const siblings = relatedCompanies(c.id, 5);
  const technicalRounds = c.interviewProcess.filter(
    (s) => s.type === "dsa" || s.type === "system_design"
  ).length;

  const roleLinks = CATEGORY_ROLE_SLUGS[c.category]
    .map((slug) => getSeoRole(slug))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Companies", item: "https://hyrise.swache.in/companies" },
        { "@type": "ListItem", position: 2, name: c.name, item: `https://hyrise.swache.in/companies/${c.id}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <nav className="mb-6 text-sm text-slate-400">
          <Link href="/companies" className="hover:text-brand-600">Companies</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-500">{c.name}</span>
        </nav>

        <header>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {c.category}
            </span>
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_COLOR[c.difficulty]}`}>
              {c.difficulty}
            </span>
          </div>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            <span aria-hidden="true">{c.emoji}</span>
            <span>{c.name} Interview Questions &amp; Process</span>
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            {c.tagline}. Below is the full {c.name} process — {c.avgRounds} rounds, {technicalRounds} of them
            technical — with what each round assesses, the values interviewers score against, and roughly{" "}
            {c.prepWeeks} of preparation to plan for.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/company-prep"
              className="inline-block rounded-xl bg-brand-gradient px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Get {c.name} practice questions →
            </Link>
            <Link
              href="/interview"
              className="inline-block rounded-xl border border-brand-300 bg-white px-6 py-3 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Practise a mock interview
            </Link>
          </div>
        </header>

        {/* ── At a glance ──────────────────────────────────────────────────── */}
        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rounds</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{c.avgRounds}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Difficulty</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{c.difficulty}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prep time to plan for</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{c.prepWeeks}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reported salary range</p>
            <p className="mt-1 text-base font-bold text-slate-900">{c.avgSalary}</p>
          </div>
        </section>

        {/* ── Round-by-round timeline ──────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">
            The {c.name} interview process, round by round
          </h2>
          <p className="mt-2 text-slate-600">
            {c.name} typically runs {c.avgRounds} rounds. Order and count shift by role, level, and whether you
            come through campus, referral, or a direct application.
          </p>
          <ol className="mt-5 space-y-4">
            {c.interviewProcess.map((s) => (
              <li key={s.step} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                    {s.step}
                  </span>
                  <h3 className="font-bold text-slate-900">{s.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STEP_TYPE_COLOR[s.type]}`}>
                    {STEP_TYPE_LABEL[s.type]}
                  </span>
                  <span className="ml-auto text-xs font-medium text-slate-400">{s.duration}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">Focus: {s.focus}</p>
                <p className="mt-1 text-sm text-slate-600">{s.what}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Summary table ────────────────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">{c.name} rounds at a glance</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Round</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Duration</th>
                  <th className="px-4 py-2.5">What is assessed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {c.interviewProcess.map((s) => (
                  <tr key={s.step} className="align-top">
                    <td className="px-4 py-3 font-bold text-brand-500">{s.step}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600">{STEP_TYPE_LABEL[s.type]}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{s.duration}</td>
                    <td className="px-4 py-3 text-slate-600">{s.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Roles ────────────────────────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">Roles {c.name} hires for</h2>
          <p className="mt-2 text-slate-600">
            These are the titles that recur in {c.name} hiring cycles. Openings change constantly — check the
            official careers page for what&apos;s live right now.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.hiringFor.map((r) => (
              <span key={r} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                {r}
              </span>
            ))}
          </div>
        </section>

        {/* ── Values & culture ─────────────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">What {c.name} scores you against</h2>
          <p className="mt-2 text-slate-600">
            Interviewers at {c.name} map answers back to a small set of stated values. Prepare a concrete story
            for each one rather than a general answer.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.values.map((v) => (
              <span key={v} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
                {v}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">Culture</h3>
            <p className="mt-1 text-sm text-slate-600">{c.culture}</p>
          </div>
        </section>

        {/* ── Behavioral questions from stated values ──────────────────────── */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">
            Behavioral questions to prepare for {c.name}
          </h2>
          <p className="mt-2 text-slate-600">
            Each of these maps directly to one of {c.name}&apos;s stated values. Answer them in STAR format —
            situation, task, action, result — with real numbers where you have them.
          </p>
          <ol className="mt-4 space-y-2.5">
            {valueQuestions.map((q, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
                <span className="font-bold text-brand-500">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Prep tips ────────────────────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">How to prepare for the {c.name} interview</h2>
          <ul className="mt-4 space-y-3">
            {c.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="mt-12 rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h2 className="text-xl font-bold text-brand-800">
            Turn this into practice, not just reading
          </h2>
          <p className="mt-1 text-sm text-brand-700">
            Generate a {c.name}-specific question bank for your target role, then answer the questions out loud in
            a mock interview that scores structure, pacing, and filler words. We don&apos;t promise an offer — we
            just make sure the rounds above aren&apos;t the first time you say these answers aloud.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/company-prep" className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
              {c.name} question bank
            </Link>
            <Link href="/interview" className="rounded-xl border border-brand-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
              Start mock interview
            </Link>
            <Link href="/blog/star-method-interview-answers" className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Learn the STAR method
            </Link>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">{c.name} interview FAQ</h2>
          <div className="mt-4 space-y-5">
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-slate-900">{f.q}</h3>
                <p className="mt-1 text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Role-specific prep ───────────────────────────────────────────── */}
        {roleLinks.length > 0 && (
          <section className="mt-12 border-t border-slate-100 pt-8">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Role-specific prep for {c.name} applicants</h2>
            <div className="flex flex-wrap gap-2">
              {roleLinks.map((r) => (
                <Link key={`iq-${r.slug}`} href={`/interview-questions/${r.slug}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700">
                  {r.name} interview questions
                </Link>
              ))}
              {roleLinks.slice(0, 2).map((r) => (
                <Link key={`rc-${r.slug}`} href={`/resume-checker/${r.slug}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700">
                  {r.name} resume checker
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Sibling companies ────────────────────────────────────────────── */}
        {siblings.length > 0 && (
          <section className="mt-10 border-t border-slate-100 pt-8">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Other {c.category} interview processes
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link key={s.id} href={`/companies/${s.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700">
                  {s.name} interview questions
                </Link>
              ))}
              <Link href="/companies" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700">
                All companies
              </Link>
            </div>
          </section>
        )}

        <p className="mt-10 text-xs text-slate-400">
          Process details reflect publicly reported hiring patterns and change over time. Salary figures are
          indicative ranges, not offers. Always confirm the current process with {c.name}&apos;s careers page or
          your recruiter. HYRISE does not guarantee interviews, offers, or employment.
        </p>
      </main>
      <Footer />
    </>
  );
}
