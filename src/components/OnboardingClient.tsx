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

export function OnboardingClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [targetRole, setTargetRole] = useState(profile.target_role || "");
  const [language, setLanguage] = useState(profile.preferred_language || "en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
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
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white font-bold text-sm">RB</div>
          <span className="font-bold text-slate-900">HYRISE</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Let&apos;s personalise your experience</h1>
        <p className="mt-2 text-sm text-slate-500">This takes 30 seconds and helps us tailor recommendations just for you.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <Input
            label="What role are you targeting?"
            placeholder="e.g. Software Engineer, Data Analyst, Product Manager"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Preferred language for learning content</label>
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
            Get started →
          </Button>
        </form>
      </div>
    </div>
  );
}
