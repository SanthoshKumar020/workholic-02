"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, RotateCcw,
  Lightbulb, Copy, Check, Eye, X, Code2,
} from "lucide-react";

const TOPICS = [
  { id: "Arrays",                  emoji: "📦", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: "Strings",                 emoji: "🔤", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { id: "Linked Lists",            emoji: "🔗", color: "bg-cyan-50 border-cyan-200 text-cyan-700" },
  { id: "Stacks & Queues",         emoji: "📚", color: "bg-orange-50 border-orange-200 text-orange-700" },
  { id: "Trees",                   emoji: "🌳", color: "bg-green-50 border-green-200 text-green-700" },
  { id: "Graphs",                  emoji: "🕸️", color: "bg-red-50 border-red-200 text-red-700" },
  { id: "Dynamic Programming",     emoji: "⚡", color: "bg-amber-50 border-amber-200 text-amber-700" },
  { id: "Sorting & Searching",     emoji: "🔍", color: "bg-teal-50 border-teal-200 text-teal-700" },
  { id: "Recursion & Backtracking",emoji: "🔄", color: "bg-violet-50 border-violet-200 text-violet-700" },
  { id: "Hash Maps",               emoji: "🗺️", color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  { id: "Two Pointers",            emoji: "👆", color: "bg-slate-50 border-slate-200 text-slate-700" },
  { id: "Sliding Window",          emoji: "🪟", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { id: "Binary Search",           emoji: "🎯", color: "bg-rose-50 border-rose-200 text-rose-700" },
  { id: "Bit Manipulation",        emoji: "💡", color: "bg-pink-50 border-pink-200 text-pink-700" },
];

const DIFF_CONFIG: Record<string, { color: string; bg: string; ring: string }> = {
  easy:   { color: "text-green-700", bg: "bg-green-100", ring: "ring-green-400" },
  medium: { color: "text-amber-700", bg: "bg-amber-100", ring: "ring-amber-400" },
  hard:   { color: "text-red-700",   bg: "bg-red-100",   ring: "ring-red-400" },
};

const LANGUAGES = ["Python", "JavaScript", "Java", "C++"];

interface Problem {
  title: string; difficulty: string; topic: string; description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string[]; hints: string[];
  timeComplexityTarget: string; spaceComplexityTarget: string;
  modelSolution?: string; modelExplanation?: string;
}
interface Feedback {
  approachCorrect: boolean; solutionCorrect: boolean;
  timeComplexity: string; spaceComplexity: string; complexityFeedback: string;
  approachFeedback: string; codeQuality: string; optimizedApproach: string;
  modelSolution: string;
  optimizations: string[]; strengths: string[]; interviewTips: string[];
}

function CopyBtn({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 transition ${small ? "text-[11px]" : "text-xs"} text-slate-400 hover:text-slate-100 hover:border-slate-500`}>
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function InlineCopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function DSAPracticeClient() {
  const [phase, setPhase] = useState<"setup" | "problem" | "feedback">("setup");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [revealedHints, setRevealedHints] = useState(0);
  const [showConstraints, setShowConstraints] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [language, setLanguage] = useState("Python");
  const [userSolution, setUserSolution] = useState("");
  const [userApproach, setUserApproach] = useState("");

  async function getProblem() {
    if (!selectedTopic) return;
    setLoading(true);
    setError(null);
    setShowReveal(false);
    try {
      const res = await fetch("/api/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "problem", topic: selectedTopic, difficulty }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setProblem(d);
      setRevealedHints(0);
      setUserSolution("");
      setUserApproach("");
      setShowConstraints(false);
      setPhase("problem");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate problem.");
    } finally {
      setLoading(false);
    }
  }

  async function getFeedback() {
    if (!problem) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "feedback",
          problem: { title: problem.title, description: problem.description, timeComplexityTarget: problem.timeComplexityTarget, spaceComplexityTarget: problem.spaceComplexityTarget },
          userSolution,
          userApproach,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setFeedback(d);
      setPhase("feedback");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get feedback.");
    } finally {
      setLoading(false);
    }
  }

  function reset() { setPhase("setup"); setProblem(null); setFeedback(null); setError(null); setShowReveal(false); }

  // ── SETUP ──────────────────────────────────────────────────────────────────

  if (phase === "setup") return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 font-bold text-slate-900">Choose a Topic</h3>
        <p className="mb-4 text-sm text-slate-500">Pick the data structure or algorithm you want to practice.</p>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {TOPICS.map((t) => (
            <button key={t.id} type="button" onClick={() => setSelectedTopic(t.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                selectedTopic === t.id
                  ? "border-slate-900 bg-slate-900 text-white shadow-md scale-[1.02]"
                  : `${t.color} hover:opacity-80 hover:scale-[1.01]`
              }`}>
              <span className="text-base">{t.emoji}</span>
              <span className="text-xs font-semibold leading-tight">{t.id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-bold text-slate-900">Difficulty</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["easy", "medium", "hard"] as const).map((d) => {
            const cfg = DIFF_CONFIG[d];
            const active = difficulty === d;
            return (
              <button key={d} type="button" onClick={() => setDifficulty(d)}
                className={`rounded-xl border py-3 text-sm font-bold capitalize transition ${
                  active ? `${cfg.bg} ${cfg.color} border-current ring-2 ${cfg.ring}` : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                }`}>
                {d === "easy" ? "🟢" : d === "medium" ? "🟡" : "🔴"} {d}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Button onClick={getProblem} loading={loading} disabled={!selectedTopic} className="w-full" size="lg">
        <Code2 className="h-5 w-5" />
        {loading ? "Generating problem…" : selectedTopic ? `Get ${difficulty} ${selectedTopic} problem` : "Select a topic first"}
      </Button>
    </div>
  );

  // ── PROBLEM ────────────────────────────────────────────────────────────────

  if (phase === "problem" && problem) {
    const diff = DIFF_CONFIG[problem.difficulty] ?? DIFF_CONFIG.medium;
    return (
      <div className="space-y-4">
        {/* Problem card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900">{problem.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold capitalize ${diff.bg} ${diff.color}`}>
                    {problem.difficulty}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-600">
                    {problem.topic}
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700 font-mono">
                    ⏱ {problem.timeComplexityTarget}
                  </span>
                  <span className="rounded-full bg-purple-50 px-3 py-0.5 text-xs font-semibold text-purple-700 font-mono">
                    💾 {problem.spaceComplexityTarget}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-5 py-4">
            <p className="text-sm text-slate-700 leading-relaxed">{problem.description}</p>
          </div>

          {/* Examples — always visible */}
          <div className="border-t border-slate-100 px-5 pb-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Examples</h4>
            <div className="space-y-3">
              {problem.examples.map((ex, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="space-y-1 font-mono text-xs">
                    <p><span className="font-bold text-slate-500">Input:</span> <span className="text-slate-800">{ex.input}</span></p>
                    <p><span className="font-bold text-slate-500">Output:</span> <span className="text-slate-800">{ex.output}</span></p>
                    {ex.explanation && <p className="text-slate-400 pt-0.5">{ex.explanation}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Constraints — collapsible */}
          <div className="border-t border-slate-100">
            <button type="button" onClick={() => setShowConstraints((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-400 hover:bg-slate-50 transition">
              Constraints
              {showConstraints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showConstraints && (
              <div className="border-t border-slate-100 px-5 pb-3 pt-2">
                {problem.constraints.map((c, i) => (
                  <p key={i} className="font-mono text-xs text-slate-600">• {c}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hints */}
        {problem.hints.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-800">Hints ({revealedHints}/{problem.hints.length})</span>
              </div>
              {revealedHints < problem.hints.length && (
                <button type="button" onClick={() => setRevealedHints((n) => n + 1)}
                  className="rounded-lg bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-200 transition">
                  Hint {revealedHints + 1} →
                </button>
              )}
            </div>
            {revealedHints === 0
              ? <p className="text-xs text-amber-600">Stuck? Reveal hints one at a time.</p>
              : (
                <ol className="mt-2 space-y-1.5 list-none">
                  {problem.hints.slice(0, revealedHints).map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold">{i + 1}</span>
                      {h}
                    </li>
                  ))}
                </ol>
              )}
          </div>
        )}

        {/* Code editor */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <div className="flex gap-1.5">
              {LANGUAGES.map((lang) => (
                <button key={lang} type="button" onClick={() => setLanguage(lang)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    language === lang
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}>
                  {lang}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {userSolution && <InlineCopyBtn text={userSolution} />}
            </div>
          </div>

          {/* Code area */}
          <div className="relative bg-slate-950">
            <div className="absolute left-0 top-0 bottom-0 w-10 border-r border-slate-800 bg-slate-900 flex flex-col items-end pr-2 pt-3 pointer-events-none">
              {Array.from({ length: Math.max(12, userSolution.split("\n").length) }).map((_, i) => (
                <span key={i} className="block font-mono text-[11px] leading-[1.625rem] text-slate-600">{i + 1}</span>
              ))}
            </div>
            <textarea
              value={userSolution}
              onChange={(e) => setUserSolution(e.target.value)}
              placeholder={`# Write your ${language} solution here…\n# Explain your approach in the box below before submitting`}
              rows={14}
              spellCheck={false}
              className="w-full resize-none bg-transparent pl-12 pr-4 py-3 font-mono text-sm text-green-400 focus:outline-none leading-[1.625rem] placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Approach */}
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50/40 p-4 shadow-sm">
          <label className="mb-1 block text-sm font-bold text-slate-800">Explain your approach</label>
          <p className="mb-2 text-xs text-slate-500">Interviewers score you on this. Write what your algorithm does, not just the code.</p>
          <textarea rows={3} value={userApproach} onChange={(e) => setUserApproach(e.target.value)}
            placeholder="e.g. Use a two-pointer approach. Left pointer starts at 0, right pointer at the end. Move left right if sum is too small, move right left if sum is too big…"
            className="w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none" />
        </div>

        {error && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={getFeedback} loading={loading} disabled={!userSolution.trim() && !userApproach.trim()} className="flex-1" size="lg">
            <CheckCircle className="h-4 w-4" />
            {loading ? "Evaluating…" : "Submit for Feedback"}
          </Button>

          {problem.modelSolution && (
            <Button onClick={() => setShowReveal(true)} variant="secondary" className="px-4" title="Reveal answer">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Reveal Answer</span>
            </Button>
          )}

          <Button onClick={reset} variant="outline" className="px-4" title="New problem">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Reveal answer panel */}
        {showReveal && problem.modelSolution && (
          <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-400" />
                <span className="text-sm font-bold text-white">Model Answer</span>
              </div>
              <div className="flex items-center gap-2">
                <CopyBtn text={problem.modelSolution} />
                <button type="button" onClick={() => setShowReveal(false)}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <pre className="overflow-x-auto bg-slate-950 px-5 py-4 font-mono text-sm text-green-400 whitespace-pre-wrap leading-relaxed">
              {problem.modelSolution}
            </pre>
            {problem.modelExplanation && (
              <div className="border-t border-slate-100 bg-green-50 px-5 py-3">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Explanation</p>
                <p className="text-sm text-slate-700 leading-relaxed">{problem.modelExplanation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── FEEDBACK ───────────────────────────────────────────────────────────────

  if (phase === "feedback" && feedback && problem) {
    const diff = DIFF_CONFIG[problem.difficulty] ?? DIFF_CONFIG.medium;
    return (
      <div className="space-y-4">
        {/* Problem header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Problem</p>
            <p className="font-bold text-slate-900 truncate">{problem.title}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${diff.bg} ${diff.color}`}>{problem.difficulty}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{problem.topic}</span>
          </div>
        </div>

        {/* Verdict banners */}
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Approach", ok: feedback.approachCorrect, detail: feedback.approachCorrect ? "Solid reasoning" : "Needs rethinking" },
            { label: "Solution", ok: feedback.solutionCorrect, detail: feedback.solutionCorrect ? "Code is correct" : "Has issues" },
          ].map((b) => (
            <div key={b.label} className={`flex items-center gap-3 rounded-2xl border p-4 ${b.ok ? "border-green-200 bg-green-50" : "border-red-100 bg-red-50"}`}>
              {b.ok
                ? <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100"><AlertCircle className="h-5 w-5 text-red-500" /></div>}
              <div>
                <p className="text-xs text-slate-500">{b.label}</p>
                <p className={`font-bold ${b.ok ? "text-green-700" : "text-red-600"}`}>{b.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Complexity */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-900">Complexity Analysis</h3>
          <div className="grid gap-3 sm:grid-cols-2 mb-3">
            {[
              { label: "Time Complexity", yours: feedback.timeComplexity, target: problem.timeComplexityTarget },
              { label: "Space Complexity", yours: feedback.spaceComplexity, target: problem.spaceComplexityTarget },
            ].map((c) => {
              const matches = c.yours === c.target;
              return (
                <div key={c.label} className={`rounded-xl border px-3 py-2.5 ${matches ? "border-green-100 bg-green-50" : "border-amber-100 bg-amber-50"}`}>
                  <p className="text-xs font-bold text-slate-500">{c.label}</p>
                  <p className={`font-mono text-xl font-extrabold ${matches ? "text-green-700" : "text-amber-700"}`}>{c.yours}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Target: <span className="font-semibold text-brand-600">{c.target}</span></p>
                </div>
              );
            })}
          </div>
          <p className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-700">{feedback.complexityFeedback}</p>
        </div>

        {/* Feedback sections */}
        <div className="space-y-3">
          {[
            { title: "Approach Feedback", text: feedback.approachFeedback, accent: "border-l-blue-400", bg: "bg-white" },
            { title: "Code Quality",      text: feedback.codeQuality,      accent: "border-l-slate-400", bg: "bg-white" },
            { title: "Optimal Approach",  text: feedback.optimizedApproach, accent: "border-l-brand-400", bg: "bg-brand-50" },
          ].map((s) => (
            <div key={s.title} className={`rounded-xl border border-slate-100 border-l-4 ${s.accent} ${s.bg} px-4 py-3`}>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{s.title}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        {/* Model solution */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-green-400" />
              <span className="text-sm font-bold text-white">Model Solution</span>
            </div>
            <CopyBtn text={feedback.modelSolution} />
          </div>
          <pre className="overflow-x-auto bg-slate-950 px-5 py-4 font-mono text-sm text-green-400 whitespace-pre-wrap leading-relaxed">
            {feedback.modelSolution}
          </pre>
        </div>

        {/* Three columns */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: "Optimizations", icon: "⚡", items: feedback.optimizations, bg: "bg-amber-50 border-amber-100", color: "text-amber-700" },
            { title: "Strengths",     icon: "✅", items: feedback.strengths,      bg: "bg-green-50 border-green-100",  color: "text-green-700" },
            { title: "Interview Tips",icon: "🎯", items: feedback.interviewTips,  bg: "bg-blue-50 border-blue-100",    color: "text-blue-700"  },
          ].map((s) => (
            <div key={s.title} className={`rounded-2xl border p-4 ${s.bg}`}>
              <p className={`mb-2 text-xs font-bold uppercase tracking-wide ${s.color}`}>{s.icon} {s.title}</p>
              <ul className="space-y-1.5">
                {s.items?.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                    <span className="mt-0.5 shrink-0 text-slate-400">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={reset} variant="outline" className="flex-1">
            <RotateCcw className="h-4 w-4" /> New Problem
          </Button>
          <Button onClick={() => { setFeedback(null); setShowReveal(false); setPhase("problem"); }} className="flex-1">
            Back to Problem
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
