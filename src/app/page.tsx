import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AtsChecker } from "@/components/AtsChecker";
import { PricingSection } from "@/components/PricingSection";
import { Testimonials } from "@/components/Testimonials";
import { EmailCapture } from "@/components/EmailCapture";
import { TrackedLink } from "@/components/TrackedLink";
import { createClient } from "@/lib/supabase/server";

/**
 * FAQ content. Rendered visibly AND as FAQPage structured data — Google shows
 * these as expandable rich results, which is free SERP real estate and one of
 * the cheapest ways to lift click-through on a brand-new domain.
 */
const FAQS = [
  {
    q: "Is the ATS resume checker really free?",
    a: "Yes. You can check your resume's ATS score without creating an account — upload a PDF, DOCX, or TXT and get a score in about 20 seconds. A free account unlocks the full list of fixes plus the AI resume rewriter.",
  },
  {
    q: "What is an ATS score and why does it matter?",
    a: "An Applicant Tracking System is the software most companies use to filter resumes before a recruiter sees them. Your ATS score estimates how well your resume survives that filter — based on keyword coverage, section headings, formatting, contact details, action verbs, and quantified achievements.",
  },
  {
    // One clear story. The old wording ("sent to our server") sat next to a
    // separate claim that text is extracted in your browser, and a
    // privacy-conscious reader reads that as a contradiction. Both are true —
    // extraction is client-side, analysis is server-side — so say it in order.
    q: "What happens to my resume file?",
    a: "Your file never leaves your device. The text is extracted in your browser, and only that text is sent to our server to be analysed, then returned to you. If you are not logged in we do not store it at all — it exists only for the length of the request. If you have an account, saved resumes are private to your login and you can delete them at any time. The analysis runs on Groq, which processes outside India; we never sell your data or share it with advertisers or course partners.",
  },
  {
    q: "How much does HYRISE Pro cost?",
    a: "Pro is ₹30 per month or ₹311 per year. It removes the usage limits on every AI tool and unlocks the premium resume templates, career mentor, job alerts, and the salary negotiation coach. The free plan stays free forever.",
  },
  {
    q: "Will this guarantee me a job?",
    a: "No, and be sceptical of any tool that claims otherwise. HYRISE improves how your resume is written and parsed, and helps you prepare for interviews. Hiring decisions are still made by people.",
  },
  {
    q: "Which file formats can I upload?",
    a: "PDF, DOCX, and TXT, up to 5 MB. If your file is a scanned image rather than real text, nothing can be extracted from it — paste your resume text instead.",
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

/**
 * The tool catalogue, grouped so the breadth reads as "one platform" rather
 * than an intimidating wall of 25 cards. Each entry links to the live page —
 * a feature you can't click is just a claim.
 */
const FEATURE_GROUPS = [
  {
    label: "Resume",
    icon: "📄",
    accent: "from-brand-500 to-violet-500",
    blurb: "Get past the filter, then past the recruiter.",
    tools: [
      { name: "ATS score checker", href: "/#ats", desc: "Free, no signup" },
      { name: "AI resume rewriter", href: "/builder", desc: "Stronger verbs, quantified impact" },
      { name: "Job match analyzer", href: "/match", desc: "Score your resume against a JD" },
      { name: "Resume tailoring", href: "/tailor", desc: "One resume per application" },
      { name: "Recruiter scan", href: "/recruiter-scan", desc: "The 6-second skim test" },
      { name: "Cover letters", href: "/cover-letter", desc: "Tailored, with tone control" },
    ],
  },
  {
    label: "Interview",
    icon: "🎤",
    accent: "from-violet-500 to-fuchsia-500",
    blurb: "Practise until the real one feels easy.",
    tools: [
      { name: "Mock interview coach", href: "/interview", desc: "Voice or text, STAR feedback" },
      { name: "Company prep", href: "/company-prep", desc: "TCS, Infosys, Amazon and more" },
      { name: "Group discussion practice", href: "/gd", desc: "Campus placement rounds" },
      { name: "Salary negotiation coach", href: "/salary", desc: "Know your number" },
      { name: "Communication coach", href: "/communication", desc: "Emails that get replies" },
    ],
  },
  {
    label: "Skills",
    icon: "🧠",
    accent: "from-emerald-500 to-teal-500",
    blurb: "Close the gap the job description exposed.",
    tools: [
      { name: "DSA practice", href: "/dsa", desc: "Visualised, with a code runner" },
      { name: "Aptitude prep", href: "/aptitude", desc: "Placement test topics" },
      { name: "Domain roadmaps", href: "/domains", desc: "Structured, step by step" },
      { name: "English learning", href: "/english", desc: "For non-native speakers" },
      { name: "Learning roadmaps", href: "/roadmap", desc: "With free video for each step" },
    ],
  },
  {
    label: "Job hunt",
    icon: "🎯",
    accent: "from-amber-500 to-orange-500",
    blurb: "Stay organised while you apply.",
    tools: [
      { name: "Job search + alerts", href: "/jobs", desc: "Daily email, no manual scrolling" },
      { name: "Application tracker", href: "/tracker", desc: "Follow-ups you won't forget" },
      { name: "Cold outreach writer", href: "/outreach", desc: "Messages recruiters open" },
      { name: "LinkedIn / Naukri optimizer", href: "/profile-optimizer", desc: "Get found, not filtered" },
      { name: "AI career mentor", href: "/mentor", desc: "A weekly plan, not vibes" },
    ],
  },
];

const TOOL_COUNT = FEATURE_GROUPS.reduce((n, g) => n + g.tools.length, 0);

/**
 * Kept to three, and every one is about what the visitor gets rather than
 * about us. The old bar led with the tool count, which reinforced exactly the
 * "generic AI bundle" impression the headline is trying to avoid, and with the
 * price, which is not a benefit.
 *
 * Replace these with outcome numbers ("resumes analysed", "average score
 * improvement") the moment you have real ones — and only real ones.
 */
const STATS = [
  { value: "No signup", label: "to get your score" },
  { value: "~20s", label: "from upload to result" },
  { value: "PDF · DOCX", label: "up to 5 MB" },
];

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="hero-gradient">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
              Powered by Groq AI — llama-3.3-70b
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">
              Check your resume&apos;s{" "}
              <span className="text-gradient">ATS score</span>{" "}
              <br className="hidden sm:block" />
              free — no signup.
            </h1>

            {/* One promise. The previous version spent the headline focusing on
                the ATS checker, then immediately defocused with "and N more
                career tools" — which reads as a generic AI bundle, the
                category with the least trust. The other tools are a reward for
                signing up, not a pitch to a stranger. */}
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Most resumes are rejected by software before a human ever reads them. Upload yours and
              see exactly what an applicant tracking system sees — in about 20 seconds, with no
              account and no card.
            </p>

            {/* One CTA. The second button sent people to pricing before they'd
                experienced any value, which is the worst possible order. */}
            <div className="mt-8">
              <TrackedLink
                href="#ats"
                event="signup_cta_clicked"
                source="hero_primary"
                className="inline-block rounded-xl bg-brand-gradient px-8 py-4 text-center text-base font-semibold text-white shadow-md transition hover:opacity-90 hover:shadow-glow-sm"
              >
                Check my resume — free ↓
              </TrackedLink>
            </div>

            {/* 4 columns at 320px gave each stat ~65px — the labels wrapped to
                three lines. Two-up on phones, four-up from `sm`. */}
            <div className="mt-10 grid grid-cols-2 gap-3 border-t border-slate-200 pt-8 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-extrabold text-brand-600">{s.value}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="ats" className="scroll-mt-24 animate-slide-up">
            <AtsChecker />
          </div>
        </div>
      </section>

      {/* ── Feature highlight strip ───────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-violet-600 px-8 py-12 md:px-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Your resume — polished, ATS-optimised, and ready.
              </h2>
              <p className="mt-3 text-brand-100">
                Powered by Groq AI (llama-3.3-70b) running entirely server-side. No data sent to third-party automation tools.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <TrackedLink
                  href="/signup"
                  event="signup_cta_clicked"
                  source="highlight_strip"
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow transition hover:bg-brand-50"
                >
                  Start free
                </TrackedLink>
                <Link href="/#pricing" className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                  See pricing
                </Link>
              </div>
            </div>

            {/* "↑ 34 pts" was here. It read as an average score improvement
                and we have no data behind it — the same invented social proof
                we removed from the testimonials section two screens below, so
                it made the page argue with itself. Every value here is now
                something verifiably true about the product. Put a real
                improvement figure back only when you can state the sample. */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "To your score", value: "~20s" },
                { label: "PDF export", value: "< 1 min" },
                { label: "Signup to try", value: "None" },
                { label: "Built in", value: "India 🇮🇳" },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center justify-center rounded-2xl bg-white/10 py-5 text-center backdrop-blur-sm">
                  <span className="text-2xl font-extrabold text-white">{b.value}</span>
                  <span className="mt-1 text-xs font-medium text-brand-100">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      <EmailCapture />

      <PricingSection isLoggedIn={!!user} />

      {/* ── FAQ (visible + FAQPage schema for rich results) ───── */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Questions people ask before trying it
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition open:shadow-md"
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

      {/* ── Feature grid ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Everything you need
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {TOOL_COUNT} career tools in one platform
          </h2>
          <p className="mt-3 text-slate-500">
            From the first draft of your resume to the salary conversation — all in one login.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {FEATURE_GROUPS.map((group) => (
            <div
              key={group.label}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${group.accent} text-xl shadow-sm`}
                >
                  {group.icon}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900">{group.label}</h3>
                  <p className="text-xs text-slate-500">{group.blurb}</p>
                </div>
                <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  {group.tools.length}
                </span>
              </div>

              <ul className="flex-1 divide-y divide-slate-50">
                {group.tools.map((tool) => (
                  <li key={tool.name}>
                    <Link
                      href={tool.href}
                      className="group/item flex items-center gap-3 px-6 py-3 transition hover:bg-brand-50/50"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300 transition group-hover/item:bg-brand-500" />
                      <span className="text-sm font-semibold text-slate-800">{tool.name}</span>
                      <span className="ml-auto hidden text-xs text-slate-400 sm:block">
                        {tool.desc}
                      </span>
                      <span className="text-brand-400 opacity-0 transition group-hover/item:opacity-100">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-white px-8 py-16 text-center shadow-sm">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/3 top-0 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl" />
            <div className="absolute right-1/3 bottom-0 h-64 w-64 rounded-full bg-violet-100/40 blur-3xl" />
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Your next job starts here.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-slate-600">
            Free forever to start. Pro is just ₹30/month — less than a cup of chai.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedLink
              href="/signup"
              event="signup_cta_clicked"
              source="footer_cta"
              className="rounded-xl bg-brand-gradient px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:opacity-90 hover:shadow-glow-sm"
            >
              Create free account
            </TrackedLink>
            <Link href="/#ats" className="rounded-xl border border-slate-300 px-8 py-3.5 text-base font-semibold text-slate-800 transition hover:bg-slate-50">
              Try ATS checker first
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-400">No card required · Built in India 🇮🇳</p>
        </div>
      </section>

      <Footer />
    </>
  );
}
