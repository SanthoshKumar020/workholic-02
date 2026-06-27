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
  Eye, Target, Share2, Code2, Users, Building2, Compass, Terminal,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — HYRISE" };

const TOOLS = [
  { href: "/builder",    icon: FileText,   label: "Resume Builder",    desc: "Enhance & export PDF",              free: true  },
  { href: "/match",      icon: Search,     label: "Job Match",          desc: "ATS keyword analysis",              free: true  },
  { href: "/aptitude",   icon: Brain,      label: "Aptitude Prep",      desc: "Speed tricks, lessons & quizzes",   free: true  },
  { href: "/domains",    icon: Compass,    label: "Learning Domains",   desc: "Roadmaps to master any field A→Z",  free: true  },
  { href: "/roadmap",    icon: Map,        label: "Learning Roadmap",   desc: "Step-by-step career plan",          free: true  },
  { href: "/interview",  icon: Mic,        label: "Mock Interview",     desc: "AI feedback on answers",            free: true  },
  { href: "/english",    icon: BookOpen,   label: "English Learning",   desc: "Lessons, quizzes & chat",           free: true  },
  { href: "/outreach",   icon: Share2,     label: "Outreach Generator", desc: "LinkedIn DM · cold email · referral",free: true  },
  { href: "/dsa",        icon: Code2,      label: "DSA Adventure",      desc: "Gamified A→Z · visualizers · code practice", free: true },
  { href: "/dsa/playground", icon: Terminal, label: "Code Playground",  desc: "Run Python right in your browser",  free: true  },
  { href: "/gd",           icon: Users,      label: "GD Practice",        desc: "AI-scored group discussion (voice)",free: true  },
  { href: "/company-prep", icon: Building2,  label: "Company Interview Prep", desc: "Google · Amazon · Flipkart · 12 companies", free: true },
  { href: "/mentor",     icon: Bot,        label: "AI Career Mentor",   desc: "Weekly plan · memory · check-in",  free: false },
  { href: "/profile-optimizer", icon: Sparkles, label: "Profile Optimizer", desc: "LinkedIn & Naukri content",   free: false },
  { href: "/jobs",       icon: Briefcase,  label: "Job Search",         desc: "AI job match + daily alerts",       free: false },
  { href: "/cover-letter", icon: FileText, label: "Cover Letter",       desc: "AI-tailored letters",               free: false },
  { href: "/communication", icon: MessageSquare, label: "Comm Coach",   desc: "Improve your writing",              free: false },
  { href: "/salary",         icon: DollarSign, label: "Salary Coach",      desc: "Market data, scripts & role-play", free: false },
  { href: "/recruiter-scan", icon: Eye,        label: "Recruiter Scan",    desc: "6-second scan + callback likelihood",free: false },
  { href: "/tailor",         icon: Target,     label: "Company Tailoring", desc: "Resume + cover letter per posting", free: false },
];

export default async function DashboardPage() {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const pro = isPro(profile?.plan);

  const { data } = await supabase
    .from("resumes")
    .select("*")
    .order("created_at", { ascending: false });

  const resumes = (data as Resume[]) ?? [];

  // Interview sessions count for the welcome message
  const { count: sessionCount } = await supabase
    .from("interview_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile?.id ?? "");

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back{profile?.target_role ? `, future ${profile.target_role}` : ""}!
            </h1>
            <p className="mt-1 text-slate-600">
              {pro ? "✨ Pro plan" : "Free plan"} · {resumes.length} {resumes.length === 1 ? "resume" : "resumes"} · {sessionCount ?? 0} interview sessions
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!pro && (
              <Link href="/billing" className="rounded-xl border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition">
                Upgrade to Pro
              </Link>
            )}
            <Link href="/builder" className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition">
              + New resume
            </Link>
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

        {/* Tool cards grid */}
        <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">All tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const locked = !tool.free && !pro;
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={locked ? "/billing" : tool.href}
                className={`group relative rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  locked ? "border-slate-200 bg-white/60 opacity-70" : "border-slate-200 bg-white"
                }`}
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  locked ? "bg-slate-100 text-slate-400" : "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-slate-900">{tool.label}</p>
                <p className="mt-0.5 text-sm text-slate-500">{tool.desc}</p>
                {locked && (
                  <div className="absolute right-3 top-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

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
