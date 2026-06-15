import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AtsChecker } from "@/components/AtsChecker";
import { PricingSection } from "@/components/PricingSection";
import { createClient } from "@/lib/supabase/server";

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
  { value: "Free", label: "ATS score check" },
  { value: "Groq AI", label: "Powered by" },
  { value: "9+", label: "Career tools" },
  { value: "PDF", label: "Instant export" },
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
              Your complete{" "}
              <span className="text-gradient">AI career platform</span>{" "}
              <br className="hidden sm:block" />
              in one place.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Resume enhancement, ATS scoring, mock interviews, job matching, learning roadmaps,
              cover letters, and more — all powered by AI, free to start.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-xl bg-brand-gradient px-7 py-3.5 text-center text-base font-semibold text-white shadow-md transition hover:opacity-90 hover:shadow-glow-sm"
              >
                Start free — no card needed
              </Link>
              <Link
                href="#ats"
                className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-center text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Try the ATS checker
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
                <Link href="/signup" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow transition hover:bg-brand-50">
                  Start free
                </Link>
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

      <PricingSection isLoggedIn={!!user} />

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
            <Link href="/signup" className="rounded-xl bg-brand-gradient px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:opacity-90 hover:shadow-glow-sm">
              Create free account
            </Link>
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
