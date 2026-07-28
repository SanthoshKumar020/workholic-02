import Link from "next/link";

/**
 * Social proof section.
 *
 * ── How to add real testimonials ─────────────────────────────────────────────
 * Add entries to TESTIMONIALS below. The moment the array has at least one
 * entry, the quote cards render automatically and the "we're new" note
 * disappears. Until then the section shows how the product works instead.
 *
 * Only add quotes you actually received, with the person's real name and
 * permission. Invented testimonials are the fastest way to lose a visitor who
 * checks — and for a careers product, trust is the entire proposition.
 *
 * Good ways to collect them:
 *   • Email users who ran 3+ scans: "what changed after you fixed your resume?"
 *   • Ask the first college batch you run a session for
 *   • Watch for people posting their score card and ask permission to quote
 */

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  avatarInitials: string;
  avatarColor: string;
};

const TESTIMONIALS: Testimonial[] = [
  // Example of the shape (delete this comment, don't uncomment a fake one):
  // {
  //   quote: "…",
  //   name: "Priya S.",
  //   role: "Software Engineer",
  //   company: "Bengaluru",
  //   avatarInitials: "PS",
  //   avatarColor: "bg-brand-600",
  // },
];

/** The three steps a first-time visitor actually takes. */
const STEPS = [
  {
    n: "1",
    title: "Upload your resume",
    body: "PDF, DOCX, or TXT. The text is pulled out in your browser — no account, no card, nothing to install.",
  },
  {
    n: "2",
    title: "See what an ATS sees",
    body: "You get a 0–100 readability score in about 20 seconds, plus the specific issues that would get your resume filtered out.",
  },
  {
    n: "3",
    title: "Fix it and apply",
    body: "AI rewrites weak bullet points, matches your resume to a job description, and drafts the cover letter. Then practise the interview.",
  },
];

/** What the score is actually built from — substance instead of star ratings. */
const SIGNALS = [
  { icon: "🔑", label: "Keyword coverage", body: "Do the terms recruiters filter on actually appear?" },
  { icon: "📐", label: "Structure & headings", body: "Can a parser find your experience, skills, and education?" },
  { icon: "📊", label: "Quantified impact", body: "Numbers and outcomes, not vague responsibility lists." },
  { icon: "⚡", label: "Action verbs", body: "Led, shipped, reduced — instead of 'was responsible for'." },
  { icon: "📇", label: "Contact details", body: "Reachable, machine-readable, and in the right place." },
  { icon: "🧱", label: "Formatting traps", body: "Tables, columns, and graphics that parsers silently drop." },
];

export function Testimonials() {
  const hasTestimonials = TESTIMONIALS.length > 0;

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      {/* ── How it works ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          How it works
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Three steps, about a minute
        </h2>
        <p className="mt-3 text-slate-500">
          No onboarding wizard, no credit card, no &ldquo;book a demo&rdquo;.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-base font-extrabold text-white shadow-sm">
              {s.n}
            </span>
            <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.body}</p>

            {/* Connector arrow between cards on desktop */}
            {i < STEPS.length - 1 && (
              <span className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 text-xl text-brand-300 md:block">
                →
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── What the score measures ───────────────────────────────────── */}
      <div className="mt-20 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-8 py-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            What your ATS score is actually measuring
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Not a black box. These are the six things the analysis looks at, and the
            report tells you which ones your resume is failing.
          </p>
        </div>

        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
          {SIGNALS.map((s) => (
            <div key={s.label} className="bg-white p-6 transition hover:bg-brand-50/40">
              <span className="text-2xl">{s.icon}</span>
              <h3 className="mt-2.5 text-sm font-bold text-slate-900">{s.label}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Testimonials, or an honest note while we have none ────────── */}
      {hasTestimonials ? (
        <>
          <div className="mx-auto mt-20 max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              What job seekers say
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              In their words
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <p className="flex-1 text-sm leading-relaxed text-slate-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${t.avatarColor}`}
                  >
                    {t.avatarInitials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mx-auto mt-20 max-w-3xl overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50 px-8 py-10 text-center">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
            Being straight with you
          </span>
          <h2 className="mx-auto mt-4 max-w-lg text-2xl font-bold tracking-tight text-slate-900">
            We&apos;re new, so there are no testimonials here yet
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Plenty of tools fill this space with stock photos and invented quotes. We
            would rather you just try the checker — it&apos;s free, it takes 20 seconds, and
            it doesn&apos;t ask for your email. Judge it on the result.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            If it helps you, tell us and we&apos;ll ask permission to quote you here. If it
            doesn&apos;t, tell us that too — that&apos;s more useful.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#ats"
              className="rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Try the free checker
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Send us feedback
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            Built by Swache Technologies (OPC) Pvt Ltd, Bangalore 🇮🇳
          </p>
        </div>
      )}
    </section>
  );
}
