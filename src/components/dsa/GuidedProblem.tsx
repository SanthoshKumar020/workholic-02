"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Lightbulb, Star, X, Code2 } from "lucide-react";
import type { DsaMode, DsaProblem } from "@/lib/dsa/types";
import { Visualizer } from "@/components/dsa/Visualizer";
import { CodeRunner } from "@/components/dsa/CodeRunner";
import { Bit, BitSays } from "@/components/dsa/Mascot";
import { Confetti } from "@/components/dsa/Confetti";
import { useReadAloud } from "@/components/dsa/useReadAloud";
import { CONFIDENCE_TO_QUALITY } from "@/lib/dsa/srs";
import { cn } from "@/lib/utils";

const DIFF: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

const CONFIDENCE = [
  { key: "again", label: "Still fuzzy", emoji: "😅" },
  { key: "hard", label: "Tricky", emoji: "🤔" },
  { key: "good", label: "Got it", emoji: "😎" },
  { key: "easy", label: "Easy!", emoji: "🌟" },
];

export function GuidedProblem({
  problem,
  mode,
  onSolved,
  onClose,
}: {
  problem: DsaProblem;
  mode: DsaMode;
  onSolved: (stars: number) => void;
  onClose?: () => void;
}) {
  const stages = useMemo(() => {
    const s: string[] = ["read"];
    if (problem.approachQuiz) s.push("predict");
    s.push("hints");
    if (problem.code) s.push("code");
    if (problem.walkthrough) s.push("walk");
    s.push("solution", "recall");
    return s;
  }, [problem]);

  const [stageIdx, setStageIdx] = useState(0);
  const [predictPick, setPredictPick] = useState<string | null>(null);
  const [predictWrong, setPredictWrong] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [codePassed, setCodePassed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const readAloud = useReadAloud({ defaultEnabled: mode === "kid" });

  const stage = stages[stageIdx];
  const next = () => setStageIdx((i) => Math.min(stages.length - 1, i + 1));

  function answerPredict(opt: string) {
    if (predictPick) return;
    setPredictPick(opt);
    if (opt !== problem.approachQuiz!.answer) setPredictWrong(true);
  }

  async function finish(confidenceKey: string) {
    // Writing working code yourself = full marks; otherwise dock for wrong
    // prediction or leaning on lots of hints.
    const penalty = (predictWrong ? 1 : 0) + (hintsShown >= 2 ? 1 : 0);
    const stars = codePassed ? 3 : Math.max(1, 3 - penalty);
    setEarnedStars(stars);
    setSolved(true);
    const quality = CONFIDENCE_TO_QUALITY[confidenceKey] ?? 3;
    // The pattern takeaway becomes a spaced-repetition card.
    fetch("/api/dsa/srs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: `${problem.id}:takeaway`, item_type: "pattern", quality }),
    }).catch(() => {});
    onSolved(stars);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <Confetti fire={solved} />

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", DIFF[problem.difficulty])}>{problem.difficulty}</span>
            {problem.ai && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">AI challenge</span>}
          </div>
          <h3 className="mt-1 text-lg font-extrabold text-slate-900">{problem.title}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="mb-5 flex items-center gap-1.5">
        {stages.map((s, i) => (
          <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= stageIdx ? "bg-brand-500" : "bg-slate-200")} />
        ))}
      </div>

      {/* ── READ ── */}
      {stage === "read" && (
        <div className="space-y-4">
          <BitSays mood="happy">Let&apos;s solve this together — I&apos;ll guide you, not just hand you the answer. 🙂</BitSays>
          <p className="text-[15px] leading-relaxed text-slate-700">{problem.statement}</p>
          <div className="space-y-2">
            {problem.examples.map((ex, i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-600">
                <div><span className="font-bold text-slate-400">Input:</span> {ex.input}</div>
                <div><span className="font-bold text-slate-400">Output:</span> {ex.output}</div>
                {ex.note && <div className="text-slate-400">// {ex.note}</div>}
              </div>
            ))}
          </div>
          <PrimaryBtn onClick={next}>{problem.approachQuiz ? "Predict the approach" : "Start solving"}</PrimaryBtn>
        </div>
      )}

      {/* ── PREDICT THE TECHNIQUE ── */}
      {stage === "predict" && problem.approachQuiz && (
        <div className="space-y-4">
          <BitSays mood="think">{problem.approachQuiz.prompt}</BitSays>
          <div className="grid gap-2 sm:grid-cols-2">
            {problem.approachQuiz.options.map((opt) => {
              const picked = predictPick === opt;
              const show = predictPick !== null;
              const good = opt === problem.approachQuiz!.answer;
              return (
                <button
                  key={opt}
                  onClick={() => answerPredict(opt)}
                  disabled={predictPick !== null}
                  className={cn(
                    "rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition",
                    !show && "border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50",
                    show && good && "border-emerald-400 bg-emerald-50 text-emerald-700",
                    show && picked && !good && "border-amber-400 bg-amber-50 text-amber-700",
                    show && !picked && !good && "border-slate-200 bg-white text-slate-400",
                  )}
                >
                  {opt} {show && good && "✓"}
                </button>
              );
            })}
          </div>
          {predictPick && (
            <>
              <BitSays mood={predictWrong ? "oops" : "cheer"}>
                {predictWrong ? "Almost! Let's look again 🙂 " : "Spot on! "}
                {problem.approachQuiz.explain}
              </BitSays>
              <PrimaryBtn onClick={next}>Continue</PrimaryBtn>
            </>
          )}
        </div>
      )}

      {/* ── HINT LADDER ── */}
      {stage === "hints" && (
        <div className="space-y-4">
          <BitSays mood="happy">Try it in your head first. Stuck? Reveal hints one at a time — fewer hints = more stars! ⭐</BitSays>
          <div className="space-y-2">
            {problem.hints.slice(0, hintsShown).map((h, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-slate-700">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span><b>Hint {i + 1}:</b> {h}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {hintsShown < problem.hints.length && (
              <button onClick={() => setHintsShown((n) => n + 1)} className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-200">
                <Lightbulb className="h-4 w-4" /> {hintsShown === 0 ? "Show a hint" : "Need another hint"}
              </button>
            )}
            <PrimaryBtn onClick={next}>{problem.walkthrough ? "Watch the walkthrough" : "See the solution"}</PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── WRITE CODE & RUN ── */}
      {stage === "code" && problem.code && (
        <div className="space-y-4">
          <BitSays mood={codePassed ? "cheer" : "happy"}>
            {codePassed ? "All tests pass — you wrote it yourself! 🌟 That's a 3-star solve." : "Your turn — write the function and hit Run. It runs right here in your browser. Pass all tests for 3 stars!"}
          </BitSays>
          <CodeRunner starter={problem.code.starter} functionName={problem.code.functionName} tests={problem.code.tests} onAllPass={() => setCodePassed(true)} />
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={next}>{codePassed ? "Continue" : problem.walkthrough ? "Show me the walkthrough" : "Show me the solution"}</PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── ANIMATED WALKTHROUGH ── */}
      {stage === "walk" && problem.walkthrough && (
        <div className="space-y-4">
          <BitSays mood="happy">Watch how the two pointers move — then we&apos;ll read the code.</BitSays>
          <Visualizer
            steps={problem.walkthrough.buildSteps()}
            pythonCode={problem.walkthrough.pythonCode}
            renderState={(state, highlight) => {
              const SV = problem.walkthrough!.StructureView;
              return <SV state={state} highlight={highlight} mode={mode} />;
            }}
            mode={mode === "kid" ? "beginner" : mode}
            readAloud={readAloud}
          />
          <PrimaryBtn onClick={next}>See the full solution</PrimaryBtn>
        </div>
      )}

      {/* ── SOLUTION ── */}
      {stage === "solution" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 text-sm text-slate-700">
            <h4 className="mb-1 flex items-center gap-1.5 font-bold text-slate-800">💡 The approach</h4>
            {problem.approach}
          </div>
          <div className="overflow-hidden rounded-2xl bg-slate-900">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2 font-mono text-xs text-slate-400">
              <Code2 className="h-3.5 w-3.5" /> solution.py
            </div>
            <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-relaxed text-slate-200">
              {problem.pythonCode.map((l, i) => (
                <div key={i}>
                  <span className="mr-3 select-none text-slate-600">{String(i + 1).padStart(2, " ")}</span>
                  {l || " "}
                </div>
              ))}
            </pre>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold">
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-brand-700">⏱️ Time {problem.complexity.time}</span>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-sky-700">💾 Space {problem.complexity.space}</span>
          </div>
          <PrimaryBtn onClick={next}>I&apos;ve got it</PrimaryBtn>
        </div>
      )}

      {/* ── RECALL / SOLVED ── */}
      {stage === "recall" && !solved && (
        <div className="space-y-4 text-center">
          <BitSays mood="happy" className="justify-center">Remember this: <b>{problem.takeaway}</b></BitSays>
          <p className="text-sm font-semibold text-slate-500">How well do you feel you understand it?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {CONFIDENCE.map((c) => (
              <button key={c.key} onClick={() => finish(c.key)} className="flex flex-col items-center gap-1 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50">
                <span className="text-2xl">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {solved && (
        <div className="space-y-3 py-4 text-center">
          <Bit mood="cheer" size="xl" className="mx-auto" />
          <h3 className="text-2xl font-extrabold text-slate-900">Solved! 🎉</h3>
          <div className="flex justify-center gap-1">
            {[1, 2, 3].map((s) => (
              <Star key={s} className={cn("h-8 w-8", s <= earnedStars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
            ))}
          </div>
          <p className="text-sm font-medium text-slate-600">{problem.takeaway}</p>
          {onClose && <PrimaryBtn onClick={onClose}>Back to problems</PrimaryBtn>}
        </div>
      )}
    </div>
  );
}

function PrimaryBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90">
      {children} <ArrowRight className="h-4 w-4" />
    </button>
  );
}
