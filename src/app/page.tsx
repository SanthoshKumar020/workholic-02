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
    q: "Do you store or sell my resume?",
    a: "Your resume text is sent to our server, analysed, and returned. We do not sell your data or share it with advertisers. If you create an account, your saved resumes are stored privately under your login and you can delete them at any time.",
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
    a: "PDF, DOCX, and TXT, up to 5 MB. Text is extracted in your browser before it is analysed. If your file is a scanned image, paste the text instead.",
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

const FEATURES = [
  { icon: "📄", title: "AI Resume Enhancement", desc: "Rewrite bullet points, add strong action verbs, quantify impact — all with Groq AI." },
  { icon: "🎯", title: "Job Match Analyzer", desc: "Paste a job description and see your keyword match score instantly." },
  { icon: "🗺️", title: "Learning Roadmaps", desc: "6–10 step career plans with YouTube videos and course links per step." },
  { icon: "🎤", title: "Mock Interview Coach", desc: "AI-generated questions + STAR-based feedback. Type or use voice." },
  { icon: "✉️", title: "Cover Letter Generator", desc: "Tailored to every job in seconds. Tone selection included." },
  { icon: "💬", title: "Communication Coach", desc: "Analyze and rewrite emails, Slack messages, and presentations." },
  { icon: "🔍", title: "Remote Job Search", desc: "Search Remotive jobs + daily email alerts. No more manual searching." },
  { icon: "🎓", title: "English Learning", desc: "Lessons, quizzes, and AI conversation practice for professionals." },
  { icon: "🏆", title: "Certificates", desc: "Complete a roadmap and download a shareable PDF certificate." },
];

const STATS = [
  { value: "Free", label: "No signup to try" },
  { value: "20s", label: "To your score" },
  { value: "25+", label: "Career tools" },
  { value: "₹30", label: "Pro, per month" },
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

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Most resumes are rejected by software before a human reads them. Upload yours and see
              exactly what an ATS sees — in 20 seconds. Then fix it with AI resume rewriting, mock
              interviews, job matching, and 25+ other career tools.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="#ats"
                event="signup_cta_clicked"
                source="hero_primary"
                className="rounded-xl bg-brand-gradient px-7 py-3.5 text-center text-base font-semibold text-white shadow-md transition hover:opacity-90 hover:shadow-glow-sm"
              >
                Check my resume — free ↓
              </TrackedLink>
              <Link
                href="#pricing"
                className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-center text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                See what&apos;s included
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-4 gap-3 border-t border-slate-200 pt-8">
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

      {/* ── Feature grid ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Everything you need
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            9 career tools in one platform
          </h2>
          <p className="mt-3 text-slate-500">From resume to interview-ready — all AI-powered, all in one place.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
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

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "ATS Score", value: "↑ 34 pts" },
                { label: "PDF ready", value: "< 1 min" },
                { label: "AI model", value: "Groq LLM" },
                { label: "Pro plan", value: "₹30/mo" },
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
