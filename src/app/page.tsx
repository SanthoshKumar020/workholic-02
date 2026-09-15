import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AtsChecker } from "@/components/AtsChecker";
import { PricingSection } from "@/components/PricingSection";
import { Testimonials } from "@/components/Testimonials";
import { EmailCapture } from "@/components/EmailCapture";
import { TrackedLink } from "@/components/TrackedLink";
import { Reveal } from "@/components/landing/Reveal";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { ToolMarquee } from "@/components/landing/ToolMarquee";
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
    q: "What happens to my resume file?",
    a: "Your file never leaves your device. The text is extracted in your browser, and only that text is sent to our server to be analysed, then returned to you. If you are not logged in we do not store it at all — it exists only for the length of the request. If you have an account, saved resumes are private to your login and you can delete them at any time. The analysis runs on Groq, which processes outside India; we never sell your data or share it with advertisers or course partners.",
  },
  {
    q: "How much does ZENVY Pro cost?",
    a: "ZENVY Student is ₹299, paid once, for 90 days — there is no subscription and nothing renews. It gives you 50 AI actions and 10 mock interviews a month across all 21 tools, plus every resume template, the career mentor, job alerts and the salary coach. The free plan stays free forever.",
  },
  {
    q: "Will this guarantee me a job?",
    a: "No, and be sceptical of any tool that claims otherwise. ZENVY improves how your resume is written and parsed, and helps you prepare for interviews. Hiring decisions are still made by people.",
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

const STATS = [
  { value: "No signup", label: "to get your score" },
  { value: "~20s", label: "from upload to result" },
  { value: "21 tools", label: "one login, one platform" },
  { value: "₹299", label: "once, for 90 days" },
];

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="zdark">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="zdark-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-[-320px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[#5e6ad2]/20 blur-[140px]"
          aria-hidden
        />
        <div className="relative mx-auto grid grid-cols-1 max-w-6xl items-center gap-8 px-4 pb-14 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4 lg:pb-24 lg:pt-24">
          <div>
            <Reveal>
              <span className="zdark-pill font-mono">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                llama-3.3-70b · live
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="zdark-display mt-6 text-[clamp(2.6rem,6.5vw,4.6rem)]">
                Check your resume&apos;s{" "}
                <span className="zdark-gradient-text">ATS score</span>
                <br />
                free — no signup.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="zdark-body mt-6 max-w-xl text-[clamp(1rem,2vw,1.15rem)]">
                Most resumes are rejected by software before a human ever reads
                them. Upload yours and see exactly what an applicant tracking
                system sees — in about 20 seconds, with no account and no card.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <TrackedLink
                  href="#ats"
                  event="signup_cta_clicked"
                  source="hero_primary"
                  className="zdark-btn-primary px-8 py-4 text-center text-[15px]"
                >
                  Check my resume — free ↓
                </TrackedLink>
                <Link href="/interview" className="zdark-btn-ghost px-8 py-4 text-center text-[15px]">
                  Try a mock interview
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <dl className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-white/[0.07] pt-8 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <dd className="order-1 text-xl font-semibold tracking-tight text-white">{s.value}</dd>
                    <dt className="order-2 mt-1 text-xs text-[#62666d]">{s.label}</dt>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={200} className="relative">
            <HeroVisual />
          </Reveal>
        </div>

        {/* Tool marquee */}
        <div className="relative mx-auto max-w-6xl px-4 pb-12">
          <ToolMarquee />
        </div>
      </section>

      {/* ── ATS checker ─────────────────────────────────────────── */}
      <section id="ats" className="relative scroll-mt-24 px-4 pb-20">
        <div className="mx-auto max-w-3xl">
          <Reveal className="mb-8 text-center">
            <span className="zdark-pill font-mono">01 · the hook</span>
            <h2 className="zdark-display mt-4 text-[clamp(1.7rem,4vw,2.5rem)]">
              Drop your resume. Get the truth.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-2xl bg-gradient-to-b from-[#828fff]/40 via-white/[0.07] to-transparent p-px shadow-glow-indigo">
              <AtsChecker />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Tool grid ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="zdark-pill font-mono">02 · the platform</span>
          <h2 className="zdark-display mt-4 text-[clamp(1.7rem,4vw,2.5rem)]">
            {TOOL_COUNT} career tools. One login.
          </h2>
          <p className="zdark-body mt-3">
            From the first draft of your resume to the salary conversation.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_GROUPS.map((group, gi) => (
            <Reveal key={group.label} delay={gi * 90} className="h-full">
              <div className="zdark-card flex h-full flex-col p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xl">
                  {group.icon}
                </span>
                <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-white">{group.label}</h3>
                <p className="mt-1 text-[13px] text-[#62666d]">{group.blurb}</p>
                <ul className="mt-4 flex-1 space-y-1">
                  {group.tools.map((tool) => (
                    <li key={tool.name}>
                      <Link
                        href={tool.href}
                        className="group/item flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#d0d6e0] transition hover:bg-white/[0.05] hover:text-white"
                      >
                        <span className="h-1 w-1 shrink-0 rounded-full bg-[#62666d] transition group-hover/item:bg-[#828fff]" />
                        <span className="font-medium">{tool.name}</span>
                        <span className="ml-auto text-[#62666d] opacity-0 transition group-hover/item:opacity-100">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Highlight strip ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-[#5e6ad2]/30 bg-gradient-to-br from-[#5e6ad2]/25 via-[#141527] to-[#08090a] px-6 py-12 sm:px-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7170ff]/25 blur-3xl" aria-hidden />
            <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="zdark-display text-[clamp(1.5rem,3.5vw,2rem)]">
                  Your resume — polished, ATS-optimised, ready.
                </h2>
                <p className="zdark-body mt-3 text-[15px]">
                  AI rewrite with stronger verbs and quantified impact, 7
                  templates, one-click PDF export.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <TrackedLink
                    href="/signup"
                    event="signup_cta_clicked"
                    source="highlight_strip"
                    className="zdark-btn-primary px-5 py-2.5 text-sm"
                  >
                    Start free
                  </TrackedLink>
                  <Link href="/#pricing" className="zdark-btn-ghost px-5 py-2.5 text-sm">
                    See pricing
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "To your score", value: "~20s" },
                  { label: "PDF export", value: "< 1 min" },
                  { label: "Signup to try", value: "None" },
                  { label: "Built in", value: "India 🇮🇳" },
                ].map((b) => (
                  <div key={b.label} className="zdark-card px-4 py-5 text-center">
                    <span className="text-2xl font-semibold tracking-tight text-white">{b.value}</span>
                    <span className="mt-1 block text-xs text-[#8a8f98]">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <Testimonials />

      <EmailCapture />

      <PricingSection isLoggedIn={!!user} />

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="zdark-pill font-mono">03 · faq</span>
          <h2 className="zdark-display mt-4 text-[clamp(1.7rem,4vw,2.5rem)]">
            Questions people ask before trying it
          </h2>
        </Reveal>

        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i * 60, 240)}>
              <details className="zdark-faq group rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 transition">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-white [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="shrink-0 text-[#828fff] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#8a8f98]">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#141527] to-[#0a0b10] px-6 py-14 text-center sm:py-16">
            <div className="zdark-grid absolute inset-0 opacity-60" aria-hidden />
            <div className="absolute left-1/2 top-0 h-48 w-[480px] -translate-x-1/2 rounded-full bg-[#5e6ad2]/25 blur-[100px]" aria-hidden />
            <h2 className="zdark-display relative text-[clamp(1.8rem,4.5vw,2.8rem)]">
              Your next job starts here.
            </h2>
            <p className="zdark-body relative mx-auto mt-3 max-w-md text-[15px]">
              Free forever to start. Student is ₹299 once, for 90 days — one
              interview going well is worth a hundred times this.
            </p>
            <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <TrackedLink
                href="/signup"
                event="signup_cta_clicked"
                source="footer_cta"
                className="zdark-btn-primary w-full px-8 py-3.5 text-[15px] sm:w-auto"
              >
                Create free account
              </TrackedLink>
              <Link href="/#ats" className="zdark-btn-ghost w-full px-8 py-3.5 text-[15px] sm:w-auto">
                Try ATS checker first
              </Link>
            </div>
            <p className="relative mt-6 font-mono text-[11px] uppercase tracking-widest text-[#62666d]">
              No card required · Built in India 🇮🇳
            </p>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
