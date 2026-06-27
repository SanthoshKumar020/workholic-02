"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Profile } from "@/lib/types";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

const GOALS = [
  {
    icon: "📄",
    title: "Check my ATS score",
    desc: "Upload your resume and see how ATS systems read it",
    href: "/#ats",
  },
  {
    icon: "🎤",
    title: "Practice for interviews",
    desc: "AI mock interview with question types tuned to your role",
    href: "/interview",
  },
  {
    icon: "🔨",
    title: "Build my resume",
    desc: "Start from scratch or enhance what you already have",
    href: "/builder",
  },
  {
    icon: "🎯",
    title: "Find jobs matching my profile",
    desc: "Search remote jobs and get daily email alerts",
    href: "/jobs",
  },
  {
    icon: "🗺️",
    title: "Learn a new skill",
    desc: "Structured roadmaps with curated resources",
    href: "/domains",
  },
  {
    icon: "✉️",
    title: "Write a cover letter",
    desc: "Generate a tailored cover letter for any job",
    href: "/outreach",
  },
];

export function OnboardingClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [targetRole, setTargetRole] = useState(profile.target_role || "");
  const [language, setLanguage] = useState(profile.preferred_language || "en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: err } = await supabase
        .from("profiles")
        .update({ target_role: targetRole.trim() || null, preferred_language: language })
        .eq("id", profile.id);
      if (err) throw err;
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleGoal(href: string) {
    router.push(href);
  }

  return (
    <div className="w-full max-w-lg animate-fade-in">
      {step === 1 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white font-bold text-sm">H</div>
            <span className="font-bold text-slate-900">HYRISE</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Let&apos;s personalise your experience</h1>
          <p className="mt-2 text-sm text-slate-500">30 seconds — helps us tailor recommendations for you.</p>

          <form onSubmit={handleProfileSave} className="mt-6 space-y-5">
            <Input
              label="What role are you targeting?"
              placeholder="e.g. Software Engineer, Data Analyst, Product Manager"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Preferred language for learning content
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLanguage(l.code)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      language === l.code
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" loading={saving} className="w-full" size="lg">
              Continue →
            </Button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-2 text-center">
            <span className="text-3xl">🎉</span>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Welcome, {profile.full_name?.split(" ")[0] || "there"}!
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              What do you want to do first today?
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {GOALS.map((g) => (
              <button
                key={g.href}
                type="button"
                onClick={() => handleGoal(g.href)}
                className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50 hover:shadow-sm"
              >
                <span className="text-2xl">{g.icon}</span>
                <p className="mt-2 font-semibold text-slate-900 text-sm group-hover:text-brand-700">
                  {g.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{g.desc}</p>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-5 w-full text-center text-xs text-slate-400 hover:text-slate-600"
          >
            Skip — take me to the dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
