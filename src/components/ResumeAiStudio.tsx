"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { TemplatePicker } from "@/components/TemplatePicker";
import { AtsScoreRing } from "@/components/AtsScoreRing";
import {
  Sparkles, Send, Undo2, RotateCcw, Lock,
  ArrowRight, Target, CheckCircle2, History,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { VoiceInstructionButton } from "@/components/VoiceInstructionButton";

/**
 * The AI Resume Studio — everything that happens AFTER a resume has been
 * built or uploaded and enhanced once. Three things live here, all working
 * on the same live resume text so "download" always reflects the latest
 * version:
 *
 *   1. Chat-style prompt editing ("add a Projects section", "make this more
 *      formal") — a Pro feature, since every edit is its own AI call.
 *   2. Paste-a-job-description auto-tailor, with a before/after ATS-fit score.
 *   3. Template + accent color + PDF download (unchanged, just fed the
 *      current edited text instead of the original enhance output).
 *
 * Free users see the panel with a lock overlay rather than it disappearing —
 * gating that's *visible* is what converts; gating that's invisible just
 * looks like a feature that doesn't exist.
 */

type ChatMessage = { role: "user" | "assistant"; content: string };
type HistoryEntry = { text: string; atsScore: number | null; label: string };

const SUGGESTIONS = [
  "Make my summary punchier",
  "Add a Projects section",
  "Use a more formal tone",
  "Tighten the bullet points",
  "Make this more ATS-friendly",
  "Emphasize leadership experience",
];

/** A handful of style-only requests ("make it blue") never need an AI call — resolve them instantly and for free. */
const COLOR_WORDS: Record<string, string> = {
  indigo: "#4338ca", navy: "#1e3a5f", blue: "#1d4ed8", teal: "#0d9488",
  green: "#047857", emerald: "#047857", red: "#9b1c1c", crimson: "#9b1c1c",
  maroon: "#9b1c1c", purple: "#6d28d9", violet: "#6d28d9", amber: "#b45309",
  orange: "#b45309", gold: "#b45309", slate: "#334155", gray: "#334155", grey: "#334155",
};

function detectColorIntent(instruction: string): { hex: string; name: string } | null {
  const lower = instruction.toLowerCase();
  const mentionsStyle = /\b(colou?r|accent|theme)\b/.test(lower);
  if (!mentionsStyle) return null;
  for (const [name, hex] of Object.entries(COLOR_WORDS)) {
    if (lower.includes(name)) return { hex, name };
  }
  return null;
}

function ScoreBar({ label, score, tone }: { label: string; score: number; tone: "before" | "after" }) {
  const color = tone === "after" ? "text-green-600" : "text-amber-600";
  const bar = score >= 75 ? "bg-green-500" : score >= 55 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className={`font-bold ${color}`}>{score}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full transition-all ${bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function ResumeAiStudio({
  initialText,
  initialAtsScore,
  resumeId,
  isPro,
  name,
  targetRole,
  email,
  phone,
  location,
  linkedin,
  portfolio,
  fileBaseName,
}: {
  initialText: string;
  initialAtsScore: number | null;
  resumeId?: string;
  isPro: boolean;
  name: string;
  targetRole: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  fileBaseName?: string;
}) {
  const [text, setText] = useState(initialText);
  const [atsScore, setAtsScore] = useState<number | null>(initialAtsScore);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [instruction, setInstruction] = useState("");
  const [editing, setEditing] = useState(false);

  const [jobDescription, setJobDescription] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const [tailorInfo, setTailorInfo] = useState<{
    atsScoreBefore: number; atsScoreAfter: number; matchedKeywords: string[]; addedKeywords: string[];
  } | null>(null);

  const [accentOverride, setAccentOverride] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const { t } = useLanguage();

  function pushHistory(label: string) {
    setHistory((h) => [...h, { text, atsScore, label }]);
  }

  function undo() {
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setText(last.text);
      setAtsScore(last.atsScore);
      return h.slice(0, -1);
    });
    setTailorInfo(null);
  }

  function resetToOriginal() {
    setText(initialText);
    setAtsScore(initialAtsScore);
    setHistory([]);
    setTailorInfo(null);
    setMessages([]);
  }

  async function callResumeEdit(payload: Record<string, unknown>) {
    const res = await fetch("/api/resume-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText: text, resumeId, ...payload }),
    });
    const data = await res.json();
    if (res.status === 403 && data?.upgrade) {
      setUpgradeNeeded(true);
      throw new Error(data.error || "This is a Pro feature.");
    }
    if (!res.ok) throw new Error(data?.message || data?.error || "Something went wrong.");
    return data;
  }

  async function sendInstruction(overrideText?: string) {
    const instr = (overrideText ?? instruction).trim();
    if (!instr || editing) return;
    setError(null);
    setUpgradeNeeded(false);

    // Pure styling requests ("make the accent blue") are instant and free —
    // no reason to spend an AI call rewriting the resume for a color change.
    const colorIntent = detectColorIntent(instr);
    if (colorIntent) {
      setAccentOverride(colorIntent.hex);
      setMessages((m) => [
        ...m,
        { role: "user", content: instr },
        { role: "assistant", content: t("studio_color_applied", { color: colorIntent.name }) },
      ]);
      setInstruction("");
      return;
    }

    setEditing(true);
    setMessages((m) => [...m, { role: "user", content: instr }]);
    try {
      const data = await callResumeEdit({ action: "edit", instruction: instr });
      pushHistory(instr.slice(0, 60));
      setText(data.updatedResume);
      setAtsScore(data.atsScore ?? atsScore);
      setMessages((m) => [...m, { role: "assistant", content: data.changeSummary || "Updated." }]);
      setInstruction("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not apply that edit.";
      setError(msg);
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setEditing(false);
    }
  }

  async function tailorToJd() {
    const jd = jobDescription.trim();
    if (jd.length < 30 || tailoring) return;
    setError(null);
    setUpgradeNeeded(false);
    setTailoring(true);
    try {
      const data = await callResumeEdit({ action: "tailor_jd", jobDescription: jd });
      pushHistory("Tailored to job description");
      setText(data.updatedResume);
      setAtsScore(data.atsScoreAfter ?? atsScore);
      setTailorInfo({
        atsScoreBefore: data.atsScoreBefore,
        atsScoreAfter: data.atsScoreAfter,
        matchedKeywords: data.matchedKeywords || [],
        addedKeywords: data.addedKeywords || [],
      });
      setMessages((m) => [...m, { role: "assistant", content: data.changeSummary || "Tailored to the job description." }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not tailor your resume to this job description.");
    } finally {
      setTailoring(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="flat" padding="lg">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Sparkles className="h-5 w-5 text-brand-500" /> {t("studio_title")}
          </h3>
          {history.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={undo}>
                <Undo2 className="h-3.5 w-3.5" /> {t("studio_undo")}
              </Button>
              <Button variant="ghost" size="sm" onClick={resetToOriginal}>
                <RotateCcw className="h-3.5 w-3.5" /> {t("studio_reset")}
              </Button>
            </div>
          )}
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {t("studio_subtitle")}
        </p>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card variant="muted" padding="md" className="flex flex-col items-center justify-center">
            <AtsScoreRing score={atsScore ?? 0} size={110} />
            {history.length > 0 && <p className="mt-2 text-xs text-slate-400">{t("studio_edits_applied", { count: history.length })}</p>}
          </Card>

          <div className="relative lg:col-span-2">
            {!isPro && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/85 backdrop-blur-[2px] px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Lock className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{t("studio_locked_title")}</p>
                <p className="max-w-xs text-xs text-slate-500">{t("studio_locked_body")}</p>
                <a href="/billing" className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600">
                  {t("studio_upgrade_cta")}
                </a>
              </div>
            )}

            <Card variant="muted" padding="md" className={!isPro ? "pointer-events-none select-none opacity-60" : undefined}>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                <Sparkles className="h-4 w-4 text-brand-500" /> {t("studio_chat_title")}
              </div>

              {messages.length > 0 && (
                <div className="mb-3 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <span
                        className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs leading-relaxed ${
                          m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {m.content}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInstruction(s)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !editing) sendInstruction(); }}
                  placeholder={t("studio_chat_placeholder")}
                  className="min-w-[12rem] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <VoiceInstructionButton
                  disabled={editing}
                  onConfirmed={(spokenText) => {
                    // Auto-run once the user confirms by voice — no typing or click needed.
                    sendInstruction(spokenText);
                  }}
                />
                <Button onClick={() => sendInstruction()} loading={editing} disabled={!instruction.trim()}>
                  <Send className="h-4 w-4" /> {editing ? t("studio_applying") : t("studio_send")}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {upgradeNeeded && (
          <p className="mt-2 text-sm text-slate-600">
            <a href="/billing" className="font-semibold text-brand-600 hover:text-brand-700">{t("studio_upgrade_cta")}</a>{t("studio_upgrade_needed_suffix")}
          </p>
        )}
      </Card>

      {/* Job-description tailoring */}
      <Card variant="flat" padding="lg" className="relative overflow-hidden">
        <div className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Target className="h-5 w-5 text-brand-500" /> {t("studio_tailor_title")}
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {t("studio_tailor_body")}
        </p>

        {!isPro && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/85 backdrop-blur-[2px] px-4 text-center">
            <Lock className="h-6 w-6 text-amber-600" />
            <p className="text-sm font-semibold text-slate-800">{t("studio_jd_locked")}</p>
            <a href="/billing" className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600">
              {t("studio_upgrade_cta")}
            </a>
          </div>
        )}

        <div className={!isPro ? "pointer-events-none select-none opacity-60" : undefined}>
          <Textarea
            rows={6}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder={t("studio_tailor_placeholder")}
          />
          <Button onClick={() => tailorToJd()} loading={tailoring} disabled={jobDescription.trim().length < 30} className="mt-3 w-full sm:w-auto">
            <Target className="h-4 w-4" /> {tailoring ? t("studio_tailoring") : t("studio_tailor_button")}
          </Button>

          {tailorInfo && (
            <div className="mt-5 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <ScoreBar label={t("studio_before")} score={tailorInfo.atsScoreBefore} tone="before" />
                <ArrowRight className="hidden h-5 w-5 shrink-0 text-brand-400 sm:block" />
                <ScoreBar label={t("studio_after")} score={tailorInfo.atsScoreAfter} tone="after" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {tailorInfo.matchedKeywords.length > 0 && (
                  <Card variant="success" padding="sm">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">{t("studio_matched_keywords")}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorInfo.matchedKeywords.map((k) => (
                        <span key={k} className="rounded-full border border-green-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-green-800">{k}</span>
                      ))}
                    </div>
                  </Card>
                )}
                {tailorInfo.addedKeywords.length > 0 && (
                  <Card variant="warning" padding="sm">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">{t("studio_added_keywords")}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorInfo.addedKeywords.map((k) => (
                        <span key={k} className="rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-amber-800">{k}</span>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Live resume preview */}
      <Card variant="flat" padding="lg">
        <div className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <History className="h-5 w-5 text-slate-400" /> {t("studio_current_text")}
        </div>
        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
          {text || "(No resume text yet.)"}
        </pre>
      </Card>

      {/* Template, color & download */}
      <Card variant="flat" padding="lg">
        <div className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CheckCircle2 className="h-5 w-5 text-green-500" /> {t("studio_template_title")}
        </div>
        <p className="mb-5 text-sm text-slate-500">{t("studio_template_body")}</p>
        <TemplatePicker
          isPro={isPro}
          fileBaseName={fileBaseName}
          accentOverride={accentOverride}
          onAccentChange={setAccentOverride}
          baseData={{
            name,
            targetRole,
            email,
            phone,
            location,
            linkedin,
            portfolio,
            enhancedText: text,
            atsScore,
          }}
        />
      </Card>
    </div>
  );
}
