"use client";

import { useRef, useState, useCallback } from "react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { VideoCard } from "@/components/VideoCard";
import { youtubeLink, freeCourseLink, freeYouTubeLink, paidCourseLink } from "@/lib/roadmapLinks";
import type { RoadmapRow, RoadmapStep, VideoResult } from "@/lib/types";
import { CertificateDownloadButton } from "@/components/CertificateDownloadButton";
import { Award, ChevronDown, ChevronUp, Video, ExternalLink } from "lucide-react";

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct === 100 ? "bg-emerald-500" : pct >= 60 ? "bg-brand-500" : pct >= 30 ? "bg-amber-400" : "bg-slate-300";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Progress</span>
        <span className={`font-bold ${pct === 100 ? "text-emerald-600" : "text-brand-600"}`}>{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LinkButton({ href, icon, label, tone }: { href: string; icon: React.ReactNode; label: string; tone: "red" | "green" | "orange" }) {
  const tones = {
    red: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    orange: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
  };
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${tones[tone]}`}>
      {icon}{label}
    </a>
  );
}

function StepVideos({ query, lang }: { query: string; lang?: string }) {
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<VideoResult[] | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function loadVideos() {
    if (videos !== null) { setOpen(!open); return; }
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch(`/api/videos?q=${encodeURIComponent(query)}&lang=${lang || "en"}`);
      const data = await res.json();
      setVideos(data.videos || []);
      setFallbackUrl(data.fallbackUrl || null);
    } catch {
      setVideos([]);
      setFallbackUrl(youtubeLink(query));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button onClick={loadVideos}
        className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition">
        <Video className="h-3.5 w-3.5" />
        Best Videos
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-3">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Spinner className="h-3.5 w-3.5" /> Loading videos…
            </div>
          )}
          {!loading && videos && videos.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {videos.slice(0, 4).map((v) => <VideoCard key={v.videoId} video={v} />)}
            </div>
          )}
          {!loading && videos && videos.length === 0 && fallbackUrl && (
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-600 underline">
              Search on YouTube <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function StepCard({ step, index, onToggle, lang, langLabel }: { step: RoadmapStep; index: number; onToggle: (i: number) => void; lang?: string; langLabel?: string }) {
  return (
    <div className={`group relative flex gap-4 rounded-2xl border p-5 transition-all duration-200 ${
      step.done ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm"
    }`}>
      <button type="button" onClick={() => onToggle(index)} aria-label={step.done ? "Mark not done" : "Mark done"}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
          step.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white hover:border-brand-400 group-hover:border-brand-400"
        }`}>
        {step.done && (
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <h3 className={`font-semibold leading-snug transition-colors ${step.done ? "text-slate-400 line-through" : "text-slate-900"}`}>
            {step.title}
          </h3>
          {step.description && (
            <p className={`mt-1 text-sm leading-relaxed ${step.done ? "text-slate-400" : "text-slate-600"}`}>{step.description}</p>
          )}
        </div>

        {step.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {step.skills.map((skill) => (
              <Badge key={skill} variant={step.done ? "secondary" : "outline"} className="text-[11px]">{skill}</Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {langLabel && lang !== "en" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
              🌐 {langLabel}
            </span>
          )}
          {step.youtubeQuery && (
            <LinkButton href={youtubeLink(step.youtubeQuery, lang)} tone="red" label="YouTube"
              icon={<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 00-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" /></svg>}
            />
          )}
          {step.freeCourseQuery && (
            <>
              <LinkButton href={freeCourseLink(step.freeCourseQuery, lang)} tone="green" label="Free Course"
                icon={<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /></svg>}
              />
              <LinkButton href={freeYouTubeLink(step.freeCourseQuery, lang)} tone="red" label="Free on YT"
                icon={<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 00-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" /></svg>}
              />
            </>
          )}
          {step.paidCourseQuery && (
            <LinkButton href={paidCourseLink(step.paidCourseQuery, lang)} tone="orange" label="Paid Course"
              icon={<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138z" /></svg>}
            />
          )}
        </div>

        {/* Video panel per step */}
        {step.youtubeQuery && !step.done && (
          <StepVideos query={step.youtubeQuery} lang={lang} />
        )}
      </div>

      <span className="absolute right-4 top-4 text-3xl font-black text-slate-100 select-none group-hover:text-slate-200">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

const DEBOUNCE_MS = 900;

export function RoadmapRenderer({
  initialRoadmap,
  userName,
  lang,
}: {
  initialRoadmap: RoadmapRow;
  userName?: string;
  lang?: string;
}) {
  const [steps, setSteps] = useState<RoadmapStep[]>(initialRoadmap.content.steps.map((s) => ({ ...s })));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canPersist = !!initialRoadmap.id;
  const totalSteps = steps.length;
  const doneCount = steps.filter((s) => s.done).length;
  const pct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  const isComplete = pct === 100;

  const persistSteps = useCallback(async (updatedSteps: RoadmapStep[]) => {
    if (!canPersist) return;
    setSaveError(null);
    const updatedContent = { ...initialRoadmap.content, steps: updatedSteps };
    try {
      const res = await fetch(`/api/roadmap/${initialRoadmap.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: updatedContent }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError((d as { error?: string }).error ?? "Could not save progress.");
      }
    } catch {
      setSaveError("Could not save progress — check your connection.");
    } finally {
      setSaving(false);
    }
  }, [canPersist, initialRoadmap]);

  function toggleStep(index: number) {
    const updated = steps.map((s, i) => (i === index ? { ...s, done: !s.done } : s));
    setSteps(updated);
    if (!canPersist) return;
    setSaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persistSteps(updated), DEBOUNCE_MS);
  }

  const { topic, summary, estimatedWeeks } = initialRoadmap.content;
  // Prefer lang from content (saved at generation time), fall back to prop
  const effectiveLang = initialRoadmap.content.lang || lang || "en";
  const effectiveLangLabel = initialRoadmap.content.langLabel || "";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 w-full bg-brand-gradient" />
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{topic}</h2>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                  {estimatedWeeks} weeks
                </span>
                {effectiveLangLabel && effectiveLang !== "en" && (
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                    🌐 {effectiveLangLabel}
                  </span>
                )}
              </div>
              {summary && <p className="mt-2 text-sm leading-relaxed text-slate-600">{summary}</p>}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
              {saving ? (
                <><Spinner className="h-3.5 w-3.5" /><span>Saving…</span></>
              ) : (
                <><svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>{canPersist ? "Auto-saved" : "Not saved"}</span></>
              )}
            </div>
          </div>

          <div className="mt-5">
            <ProgressBar pct={pct} />
            <p className="mt-1.5 text-xs text-slate-500">
              {doneCount} of {totalSteps} steps completed
              {isComplete && " 🎉 — great work!"}
            </p>
          </div>

          {/* Certificate download on 100% */}
          {isComplete && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 border border-emerald-200">
              <Award className="h-6 w-6 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">Congratulations! You&apos;ve completed this roadmap.</p>
                <p className="text-xs text-emerald-700">Download your completion certificate.</p>
              </div>
              <CertificateDownloadButton
                userName={userName || "Learner"}
                topic={topic}
              />
            </div>
          )}
        </div>
      </div>

      {saveError && <Alert tone="error">{saveError}</Alert>}

      <div className="space-y-3">
        {steps.map((step, i) => (
          <StepCard key={i} step={step} index={i} onToggle={toggleStep} lang={effectiveLang} langLabel={effectiveLangLabel} />
        ))}
      </div>

      {!canPersist && (
        <Alert tone="warning">Progress tracking is unavailable because this roadmap could not be saved.</Alert>
      )}
    </div>
  );
}
