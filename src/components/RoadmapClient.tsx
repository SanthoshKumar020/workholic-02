"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { RoadmapRenderer } from "@/components/RoadmapRenderer";
import type { RoadmapRow } from "@/lib/types";
import { PlanUsageBadge, UpgradeWall } from "@/components/ui/PlanUsageBadge";

// ── Language catalogue ────────────────────────────────────────────────────────
const CONTENT_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ta", label: "Tamil", flag: "🇮🇳" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "te", label: "Telugu", flag: "🇮🇳" },
  { code: "kn", label: "Kannada", flag: "🇮🇳" },
  { code: "ml", label: "Malayalam", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", flag: "🇮🇳" },
  { code: "bn", label: "Bengali", flag: "🇮🇳" },
  { code: "gu", label: "Gujarati", flag: "🇮🇳" },
  { code: "pa", label: "Punjabi", flag: "🇮🇳" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "zh", label: "Mandarin", flag: "🇨🇳" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷" },
];

// ── Topic categories ──────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    label: "🎯 Skills & Roles",
    topics: [
      "Data Analyst", "Frontend Developer", "Backend Developer", "Full Stack Developer",
      "DevOps Engineer", "Product Manager", "UI/UX Designer", "Cybersecurity Analyst",
      "Cloud AWS", "Machine Learning Engineer", "Digital Marketing", "SEO",
    ],
  },
  {
    label: "💻 Programming",
    topics: [
      "Python", "JavaScript", "TypeScript", "Java", "C++", "Go (Golang)",
      "Rust", "Kotlin", "Swift", "PHP", "Ruby", "SQL", "R", "Dart (Flutter)",
    ],
  },
  {
    label: "🌍 Languages",
    topics: [
      "English speaking", "Spanish language", "French language", "German language",
      "Japanese language", "Mandarin Chinese", "Korean language", "Arabic language",
    ],
  },
];

const ALL_SUGGESTIONS = CATEGORIES.flatMap((c) => c.topics.slice(0, 4));

interface GenerateResponse {
  roadmap?: RoadmapRow;
  warning?: string;
  error?: string;
}

export function RoadmapClient({
  freeUsed = 0,
  freeLimit = 3,
  isPro = false,
}: {
  freeUsed?: number;
  freeLimit?: number;
  isPro?: boolean;
}) {
  const [topic, setTopic] = useState("");
  const [lang, setLang] = useState("en");
  const [activeCategory, setActiveCategory] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapRow | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [usedCount, setUsedCount] = useState(freeUsed);
  const exhausted = !isPro && usedCount >= freeLimit;

  async function generate(overrideTopic?: string) {
    const trimmed = (overrideTopic ?? topic).trim();
    if (trimmed.length < 2) {
      setError("Please enter a skill, role, or language to generate a roadmap.");
      return;
    }
    setError(null);
    setWarning(null);
    setLoading(true);
    try {
      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed, lang }),
      });
      const data: GenerateResponse = await res.json();
      if (res.status === 403 && data.error === "free_limit_reached") {
        setLimitReached(true);
        setLoading(false);
        return;
      }
      if (!res.ok || !data.roadmap) throw new Error(data.error ?? "Roadmap generation failed.");
      if (data.warning) setWarning(data.warning);
      setRoadmap(data.roadmap);
      setUsedCount(c => c + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setRoadmap(null);
    setError(null);
    setWarning(null);
    setTopic("");
  }

  const selectedLang = CONTENT_LANGUAGES.find((l) => l.code === lang) || CONTENT_LANGUAGES[0];

  // ── Result view ────────────────────────────────────────────────────────────
  if (roadmap) {
    return (
      <div className="space-y-4">
        {warning && <Alert tone="warning">{warning}</Alert>}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Checkboxes are saved automatically as you complete steps.
          </p>
          <Button variant="secondary" size="sm" onClick={reset}>← New roadmap</Button>
        </div>
        <RoadmapRenderer initialRoadmap={roadmap} />
      </div>
    );
  }

  // ── Input view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {!isPro && (
        <PlanUsageBadge used={usedCount} limit={freeLimit} feature="roadmap" />
      )}
      {limitReached && <UpgradeWall limit={freeLimit} feature="roadmap" />}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="h-1 w-full bg-brand-gradient" />
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">What do you want to learn?</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose a topic and select the language for YouTube videos, free certificates, and paid courses.
            </p>
          </div>

          {/* Topic input */}
          <div className="flex gap-3">
            <Input
              name="topic"
              placeholder="e.g. Python, Data Analyst, Spanish…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={() => generate()} loading={loading} disabled={exhausted || limitReached} size="lg" className="shrink-0">
              {loading ? "Generating…" : "Generate"}
            </Button>
          </div>

          {/* Language selector */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              🌐 Content language — videos, free &amp; paid courses will be in:
            </p>
            <div className="flex flex-wrap gap-2">
              {CONTENT_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  disabled={loading}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                    lang === l.code
                      ? "border-brand-500 bg-brand-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  } disabled:opacity-50`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
            {lang !== "en" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-400">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-100 text-[10px] dark:bg-violet-900/40">✓</span>
                YouTube videos, Free courses &amp; Paid courses will be searched in <strong>{selectedLang.label}</strong>
              </p>
            )}
          </div>

          {/* Topic category quick-picks */}
          <div>
            <div className="mb-2 flex gap-2">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setActiveCategory(i)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    activeCategory === i
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES[activeCategory].topics.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setTopic(s); generate(s); }}
                  disabled={loading || exhausted || limitReached}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-brand-900/30 dark:hover:text-brand-400"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          {loading && (
            <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-4 dark:bg-brand-900/20">
              <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
              <div>
                <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">
                  Building your roadmap for &ldquo;{topic}&rdquo; in {selectedLang.label}…
                </p>
                <p className="mt-0.5 text-xs text-brand-600 dark:text-brand-500">
                  This usually takes 15–45 seconds. Please don&apos;t close the page.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: "🌐", title: "Your language", desc: `All YouTube videos, free certificates, and paid courses are found in your chosen language — currently ${selectedLang.flag} ${selectedLang.label}.` },
            { icon: "📚", title: "3 resource types per step", desc: "YouTube tutorials, free certificate courses (Coursera), and paid courses (Udemy) — all language-matched." },
            { icon: "✅", title: "Track progress", desc: "Tick steps as you finish them. Progress is auto-saved. Earn a certificate when you hit 100%." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
