import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Placement Readiness Software for Colleges | HYRISE",
  description:
    "Track placement readiness for every student in your batch. AI resume checks, mock interviews, aptitude and DSA tracking, and batch reports for your placement cell. Built in India. From ₹60,000/year.",
  alternates: { canonical: "https://hyrise.swache.in/for-colleges" },
  // Explicitly indexable. /institution is the gated app and stays noindex;
  // this is the public front door, and it was previously missing entirely —
  // no TPO could find or evaluate HYRISE without an account.
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://hyrise.swache.in/for-colleges",
    title: "Placement Readiness Software for Colleges | HYRISE",
    description:
      "One dashboard for resume quality, aptitude, DSA and mock interview readiness across your whole batch.",
  },
};

const PROBLEMS = [
  {
    title: "Placement cells run on spreadsheets",
    body: "Attendance in one file, mock interview notes in another, resumes in a WhatsApp folder. Nothing joins up.",
  },
  {
    title: "You find out too late",
    body: "The student who can't clear aptitude is discovered on drive day, not three weeks before, when there was still time to fix it.",
  },
  {
    title: "Reporting eats your week",
    body: "Batch-wise readiness data, assembled by hand, every single time management or an accreditation body asks.",
  },
];

const CURRICULUM = [
  {
    group: "Resume",
    icon: "📄",
    items: "ATS scoring, AI rewrite, job-description matching, cover letters, recruiter scan",
  },
  {
    group: "Interview",
    icon: "🎤",
    items: "Mock interviews with report cards, GD practice, company prep, communication coaching",
  },
  {
    group: "Aptitude & coding",
    icon: "🧠",
    items: "Aptitude sets, DSA practice with visualisers, an in-browser code runner",
  },
  {
    group: "English & communication",
    icon: "🗣️",
    items: "Lessons, quizzes and conversation practice — for the students who need it most",
  },
  {
    group: "Job hunt",
    icon: "🎯",
    items: "Application tracker, cold outreach writer, LinkedIn and Naukri profile optimisation",
  },
];

const PRICING = [
  { size: "Up to 300 students", price: "₹60,000", per: "per year" },
  { size: "Up to 750 students", price: "₹1,25,000", per: "per year", featured: true },
  { size: "Up to 1,500 students", price: "₹2,00,000", per: "per year" },
  { size: "Over 1,500", price: "Let's talk", per: "custom" },
];

const FAQS = [
  {
    q: "Who owns the student data?",
    a: "The institution does. HYRISE processes it on your behalf and deletes it on termination of the contract. We will sign a Data Processing Addendum setting that out. Students also retain their own accounts and can delete their data at any time.",
  },
  {
    q: "What exactly can our placement cell see?",
    a: "Batch aggregates: average ATS score, how many students are at risk, the most common skill gaps, mock-interview participation. You cannot see an individual student's resume, their score, or their interview feedback. That is a deliberate design decision — students share that material with us for their own preparation, and a tool they feel surveilled by is one they quietly stop using, which makes the licence worthless to you.",
  },
  {
    q: "Can we import our existing student list?",
    a: "Yes, by CSV. Students then activate their own accounts with a join code — we deliberately don't create accounts on their behalf, because under the DPDP Act consent has to come from the student, not from the college.",
  },
  {
    q: "Do students pay anything?",
    a: "No. The institution licence covers every tool for every enrolled student for the full contract term.",
  },
  {
    q: "What if a student already has a HYRISE account?",
    a: "They enter the join code on their existing account and keep all their history. Nothing is duplicated or lost.",
  },
  {
    q: "Is there a minimum contract?",
    a: "One placement season. We would rather you leave after a season that didn't work than be locked into one that didn't.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const CONTACT_EMAIL = "admin@swache.in";

export default function ForCollegesPage() {
  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="hero-gradient">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
            <span className="inline-flex items-center rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-700">
              For placement cells
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
              Know which students aren&apos;t placement-ready —{" "}
              <span className="text-gradient">three weeks before the drive.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              Your placement cell probably runs on Excel and WhatsApp. HYRISE gives you one
              dashboard for resume quality, aptitude, DSA and mock-interview readiness across your
              whole batch.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Demo request — HYRISE for colleges")}&body=${encodeURIComponent("College:\nBatch size:\nBranches:\nBest time to call:\n")}`}
                className="rounded-xl bg-brand-gradient px-8 py-4 text-base font-semibold text-white shadow-md transition hover:opacity-90"
              >
                Book a 20-minute demo
              </a>
              <Link
                href="#dashboard"
                className="rounded-xl border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                See what the dashboard shows
              </Link>
            </div>
          </div>
        </section>

        {/* ── The problem ──────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-bold text-slate-900">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── What the TPO sees ────────────────────────────────── */}
        <section id="dashboard" className="scroll-mt-20 bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                What your placement cell sees
              </h2>
              <p className="mt-3 text-slate-500">
                One screen, updated as students work. No spreadsheets to assemble.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { v: "61", l: "Average ATS score", tone: "text-amber-600" },
                { v: "38%", l: "At risk (below 60)", tone: "text-red-600" },
                { v: "24%", l: "Application-ready", tone: "text-emerald-600" },
                { v: "12", l: "Never logged in", tone: "text-slate-500" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className={`text-3xl font-extrabold leading-none ${s.tone}`}>{s.v}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{s.l}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Illustrative figures showing the dashboard layout — not data from a real college.
            </p>

            <div className="mt-10 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-slate-600">
                <strong className="text-slate-900">The sentence that matters:</strong> before a TCS
                drive, the dashboard tells you &ldquo;37 eligible students, 12 at risk&rdquo; — with
                three weeks left to run a workshop on the specific gap they share, rather than
                finding out on drive day.
              </p>
            </div>
          </div>
        </section>

        {/* ── What students get ────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              What your students get
            </h2>
            <p className="mt-3 text-slate-500">
              Twenty-one tools, covering the whole placement curriculum. Included for every enrolled
              student.
            </p>
          </div>

          <div className="mt-12 space-y-3">
            {CURRICULUM.map((c) => (
              <div
                key={c.group}
                className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:gap-5"
              >
                <div className="flex shrink-0 items-center gap-3 sm:w-64">
                  <span className="text-2xl">{c.icon}</span>
                  <span className="font-bold text-slate-900">{c.group}</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-500">{c.items}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="font-bold text-slate-900">Company-specific preparation</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Question sets mapped to the drives your students actually sit — TCS NQT, Infosys,
              Wipro Elite NTH, Cognizant, Capgemini, Accenture — rather than generic aptitude
              material.
            </p>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────── */}
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pricing</h2>
              <p className="mt-3 text-slate-500">
                Published, because you need a number before you can take it to a committee.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PRICING.map((p) => (
                <div
                  key={p.size}
                  className={`rounded-2xl border bg-white p-6 text-center shadow-sm ${
                    p.featured ? "border-2 border-brand-500" : "border-slate-200"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {p.size}
                  </p>
                  <p className="mt-3 text-2xl font-extrabold text-slate-900">{p.price}</p>
                  <p className="mt-1 text-xs text-slate-400">{p.per}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              Covers every tool for every enrolled student for the full contract term. Payment by
              NEFT or cheque against a proforma invoice.
            </p>
          </div>
        </section>

        {/* ── Being straight with you ──────────────────────────── */}
        <section className="mx-auto max-w-3xl px-4 py-20">
          <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50 px-8 py-10 text-center">
            <span className="inline-flex items-center rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
              Being straight with you
            </span>
            <h2 className="mx-auto mt-4 max-w-xl text-2xl font-bold tracking-tight text-slate-900">
              We&apos;re new, and we don&apos;t have college logos to show you
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
              So the first college in each city gets a <strong>free semester</strong>. In exchange
              we&apos;d like an honest case study afterwards — including what didn&apos;t work. If
              you&apos;d rather wait until we have references from colleges like yours, that&apos;s
              a reasonable call and we won&apos;t chase you.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Free semester pilot — HYRISE")}`}
              className="mt-7 inline-block rounded-xl bg-brand-gradient px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Ask about the free semester
            </a>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-4 pb-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Questions placement officers ask
          </h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                  {f.q}
                  <span className="shrink-0 text-brand-500 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-4 pb-24 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-14 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Twenty minutes, and you&apos;ll know if it fits
            </h2>
            <p className="mx-auto mt-3 max-w-md text-slate-600">
              We&apos;ll show you the dashboard with your own batch structure. No slides.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Demo request — HYRISE for colleges")}&body=${encodeURIComponent("College:\nBatch size:\nBranches:\nBest time to call:\n")}`}
              className="mt-8 inline-block rounded-xl bg-brand-gradient px-8 py-4 text-base font-semibold text-white shadow-md transition hover:opacity-90"
            >
              Email us to book a demo
            </a>
            <p className="mt-6 text-sm text-slate-500">
              Or write directly to{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-brand-600 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="mt-6 text-xs leading-relaxed text-slate-400">
              HYRISE is built by Swache Technologies (OPC) Private Limited, Bangalore. We help
              students present themselves better and prepare properly — we do not guarantee
              placements, and you should be sceptical of anyone who does.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
