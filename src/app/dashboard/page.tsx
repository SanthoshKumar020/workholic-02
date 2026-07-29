import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DashboardClient } from "@/components/DashboardClient";
import { ProHistoryGate } from "@/components/ui/ProHistoryGate";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isPro } from "@/lib/plan";
import { StreakWidget } from "@/components/StreakWidget";
import type { Resume } from "@/lib/types";
import {
  FileText, Briefcase, Map, Mic, MessageSquare, BookOpen, Search, Lock, Sparkles, Brain, Bot, DollarSign,
  Eye, Target, Share2, Code2, Users, Building2, Compass, Terminal, ClipboardList, ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — HYRISE" };

/**
 * Tools grouped by the job-hunt stage they belong to.
 *
 * This was previously one flat grid of 20 cards, which reads as a wall and
 * gives no sense of where to start. Grouping also surfaced that `/tracker` was
 * unreachable for signed-in users — it appeared in neither this list nor the
 * navbar, so the only link to it was on the logged-out landing page.
 */
const TOOL_GROUPS = [
  {
    title: "Your resume",
    hint: "Start here — everything else builds on it",
    tools: [
      { href: "/builder",        icon: FileText, label: "Resume Builder",    desc: "Enhance & export PDF",               free: true  },
      { href: "/match",          icon: Search,   label: "Job Match",         desc: "ATS keyword analysis",               free: true  },
      { href: "/tailor",         icon: Target,   label: "Company Tailoring", desc: "Resume + cover letter per posting",  free: false },
      { href: "/recruiter-scan", icon: Eye,      label: "Recruiter Scan",    desc: "6-second scan + callback likelihood",free: false },
      { href: "/cover-letter",   icon: FileText, label: "Cover Letter",      desc: "AI-tailored letters",                free: false },
    ],
  },
  {
    title: "Applying",
    hint: "Find roles and stay on top of them",
    tools: [
      { href: "/jobs",              icon: Briefcase, label: "Job Search",        desc: "AI job match + daily alerts",         free: false },
      { href: "/tracker",           icon: ClipboardList, label: "Application Tracker", desc: "Every application + follow-ups", free: true  },
      { href: "/outreach",          icon: Share2,    label: "Outreach Generator",desc: "LinkedIn DM · cold email · referral", free: true  },
      { href: "/profile-optimizer", icon: Sparkles,  label: "Profile Optimizer", desc: "LinkedIn & Naukri content",           free: false },
    ],
  },
  {
    title: "Interview prep",
    hint: "Practise before it counts",
    tools: [
      { href: "/interview",    icon: Mic,        label: "Mock Interview",    desc: "AI feedback on answers",                    free: true  },
      { href: "/company-prep", icon: Building2,  label: "Company Prep",      desc: "Google · Amazon · Flipkart · 12 companies", free: true  },
      { href: "/gd",           icon: Users,      label: "GD Practice",       desc: "AI-scored group discussion (voice)",        free: true  },
      { href: "/salary",       icon: DollarSign, label: "Salary Coach",      desc: "Market data, scripts & role-play",          free: false },
    ],
  },
  {
    title: "Skills & learning",
    hint: "Close the gaps the job description exposed",
    tools: [
      { href: "/dsa",            icon: Code2,          label: "DSA Adventure",    desc: "Gamified A→Z · visualizers · practice", free: true  },
      { href: "/dsa/playground", icon: Terminal,       label: "Code Playground",  desc: "Run Python right in your browser",      free: true  },
      { href: "/aptitude",       icon: Brain,          label: "Aptitude Prep",    desc: "Speed tricks, lessons & quizzes",       free: true  },
      { href: "/domains",        icon: Compass,        label: "Learning Domains", desc: "Roadmaps to master any field A→Z",      free: true  },
      { href: "/roadmap",        icon: Map,            label: "Learning Roadmap", desc: "Step-by-step career plan",              free: true  },
      { href: "/english",        icon: BookOpen,       label: "English Learning", desc: "Lessons, quizzes & chat",               free: true  },
      { href: "/communication",  icon: MessageSquare,  label: "Comm Coach",       desc: "Improve your writing",                  free: false },
      { href: "/mentor",         icon: Bot,            label: "AI Career Mentor", desc: "Weekly plan · memory · check-in",       free: false },
    ],
  },
];

/**
 * A dashboard should answer "what do I do next?", not just list everything.
 * Derived from data already fetched on this page — no extra queries.
 */
function nextAction(resumeCount: number, topScore: number | null, sessions: number) {
  if (resumeCount === 0) {
    return {
      title: "Start with your resume",
      body: "Upload it once and every other tool here can use it — matching, tailoring, interview questions.",
      cta: "Build my resume",
      href: "/builder",
    };
  }
  if (topScore !== null && topScore < 75) {
    return {
      title: `Your best resume scores ${topScore}/100`,
      body: "Under 75 means an ATS may filter it before a human reads it. Tailoring it to a specific job usually adds 15–25 points.",
      cta: "Tailor it to a job",
      href: "/tailor",
    };
  }
  if (sessions === 0) {
    return {
      title: "Your resume is in good shape — now practise",
      body: "A mock interview takes about 10 minutes and tells you exactly where you ramble.",
      cta: "Start a mock interview",
      href: "/interview",
    };
  }
  return {
    title: "Keep your applications moving",
    body: "Most offers come from following up. Track where each application stands so none go cold.",
    cta: "Open the tracker",
    href: "/tracker",
  };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const pro = isPro(profile?.plan);

  const { data } = await supabase
    .from("resumes")
    .select("*")
    .order("created_at", { ascending: false });

  const resumes = (data as Resume[]) ?? [];

  const scores = resumes
    .map((r) => r.ats_score)
    .filter((s): s is number => typeof s === "number");
  const topScore = scores.length > 0 ? Math.max(...scores) : null;

  // Interview sessions count for the welcome message
  const { count: sessionCount } = await supabase
    .from("interview_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile?.id ?? "");

  const suggestion = nextAction(resumes.length, topScore, sessionCount ?? 0);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-brand-gradient p-7 text-white shadow-md sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Welcome back{profile?.target_role ? `, future ${profile.target_role}` : ""}!
                </h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pro ? "bg-white/20 text-white" : "bg-black/20 text-white/90"}`}>
                  {pro ? "PRO" : "FREE"}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-white/80">
                {resumes.length} {resumes.length === 1 ? "resume" : "resumes"} · {sessionCount ?? 0} interview sessions · Powered by Swache Technologies
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!pro && (
                <Link href="/billing" className="rounded-xl bg-white/95 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-white">
                  Upgrade to Pro
                </Link>
              )}
              <Link href="/builder" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50">
                + New resume
              </Link>
            </div>
          </div>
        </div>

        {/* Streak / XP widget */}
        {profile && (
          <StreakWidget
            xp={profile.xp ?? 0}
            streak={profile.streak ?? 0}
            plan={profile.plan}
          />
        )}

        {/* Next action — the one thing worth doing today */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-500">
                Suggested next step
              </p>
              <h2 className="mt-1.5 text-lg font-bold text-slate-900">{suggestion.title}</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
                {suggestion.body}
              </p>
            </div>
            <Link
              href={suggestion.href}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              {suggestion.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Tools, grouped by job-hunt stage */}
        {TOOL_GROUPS.map((group) => (
          <section key={group.title} className="mt-10">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold text-slate-900">{group.title}</h2>
              <p className="text-sm text-slate-400">{group.hint}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((tool) => {
                const locked = !tool.free && !pro;
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.href}
                    href={locked ? "/billing" : tool.href}
                    className={`group relative rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      locked ? "border-slate-200 bg-white/60" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div
                      className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${
                        locked
                          ? "bg-slate-100 text-slate-400"
                          : "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className={`font-semibold ${locked ? "text-slate-500" : "text-slate-900"}`}>
                      {tool.label}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">{tool.desc}</p>
                    {locked && (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        <Lock className="h-3 w-3" />
                        Pro
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {/* Resumes section */}
        <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">Your resumes</h2>
        {pro ? (
          <DashboardClient resumes={resumes} isPro={pro} />
        ) : (
          <ProHistoryGate
            title="Resume history is a Pro feature"
            blurb="Your enhanced resumes are saved securely. Upgrade to Pro to view, manage, and re-download your full resume history anytime."
          />
        )}
      </main>
      <Footer />
    </>
  );
}
