"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Check, Star } from "lucide-react";
import type { DsaMode, DsaProblem } from "@/lib/dsa/types";
import type { Island } from "@/lib/dsa/curriculum";
import { getProblems, PROBLEM_GOAL } from "@/components/dsa/problems/registry";
import { GuidedProblem } from "@/components/dsa/GuidedProblem";
import { BitSays } from "@/components/dsa/Mascot";
import { cn } from "@/lib/utils";

const DIFF: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

type Filter = "all" | "easy" | "medium" | "hard";

export function PracticeClient({
  island,
  mode,
  initialSolvedIds,
}: {
  island: Island;
  mode: DsaMode;
  initialSolvedIds: string[];
}) {
  const curated = useMemo(() => getProblems(island.slug), [island.slug]);
  const [solved, setSolved] = useState<Set<string>>(new Set(initialSolvedIds));
  const [active, setActive] = useState<DsaProblem | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const shown = curated.filter((p) => filter === "all" || p.difficulty === filter);
  const solvedCount = solved.size;
  const pct = Math.min(100, Math.round((solvedCount / PROBLEM_GOAL) * 100));

  function handleSolved(problem: DsaProblem) {
    return (stars: number) => {
      setSolved((s) => new Set(s).add(problem.id));
      fetch("/api/dsa/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, topic: island.slug, stars }),
      }).catch(() => {});
    };
  }

  async function generate() {
    setGenLoading(true);
    setGenError(null);
    try {
      const res = await fetch("/api/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "problem", topic: island.techName, difficulty: "medium" }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || d.error) throw new Error(d.error || "generation failed");
      const problem: DsaProblem = {
        id: `${island.slug}:ai:${Date.now()}`,
        topic: island.slug,
        title: d.title ?? "AI Challenge",
        difficulty: ["easy", "medium", "hard"].includes(d.difficulty) ? d.difficulty : "medium",
        statement: d.description ?? "",
        examples: Array.isArray(d.examples) ? d.examples.map((e: { input?: string; output?: string; explanation?: string }) => ({ input: e.input ?? "", output: e.output ?? "", note: e.explanation })) : [],
        hints: Array.isArray(d.hints) ? d.hints : [],
        approach: d.modelExplanation ?? "Think about which pattern from this island fits, then build it step by step.",
        pythonCode: typeof d.modelSolution === "string" ? d.modelSolution.split("\n") : [],
        complexity: { time: d.timeComplexityTarget ?? "—", space: d.spaceComplexityTarget ?? "—" },
        takeaway: (d.modelExplanation ?? "").split(/[.!?]/)[0] || "Practice makes the pattern automatic.",
        ai: true,
      };
      setActive(problem);
    } catch {
      setGenError("Bit couldn't generate a challenge right now — try again in a moment. 🤖");
    } finally {
      setGenLoading(false);
    }
  }

  if (active) {
    return (
      <div className="mx-auto max-w-3xl">
        <button onClick={() => setActive(null)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> All problems
        </button>
        <GuidedProblem problem={active} mode={mode} onSolved={handleSolved(active)} onClose={() => setActive(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/dsa/${island.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> {island.kidName} lesson
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">{island.kidName} — Practice 💪</h1>
        <p className="mt-1 text-sm font-semibold text-brand-600">{island.techName}</p>
      </div>

      {/* Progress toward the goal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
          <span>Problems solved</span>
          <span>{solvedCount} / {PROBLEM_GOAL}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">{curated.length} guided problems below + unlimited AI challenges to reach {PROBLEM_GOAL}.</p>
      </div>

      <BitSays mood="happy">
        Each problem teaches you the <b>pattern</b>, not just the answer — predict the approach, peek at hints only if you need them, then watch it solved. Fewer hints = more stars! ⭐
      </BitSays>

      {/* AI generator */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
        <Sparkles className="h-5 w-5 text-brand-500" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">Want a fresh challenge?</p>
          <p className="text-xs text-slate-500">Bit will invent a brand-new {island.techName} problem just for you.</p>
        </div>
        <button onClick={generate} disabled={genLoading} className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50">
          {genLoading ? "Thinking…" : "New AI challenge"}
        </button>
      </div>
      {genError && <p className="text-sm font-medium text-amber-600">{genError}</p>}

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "easy", "medium", "hard"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("rounded-xl px-3 py-1.5 text-sm font-semibold capitalize transition", filter === f ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
            {f}
          </button>
        ))}
      </div>

      {/* Problem list */}
      <div className="space-y-2">
        {shown.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            No curated problems here yet — try a fresh AI challenge above! 🤖
          </p>
        ) : (
          shown.map((p) => {
            const done = solved.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                  {done ? <Check className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                </span>
                <span className="flex-1 font-bold text-slate-800">{p.title}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", DIFF[p.difficulty])}>{p.difficulty}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
