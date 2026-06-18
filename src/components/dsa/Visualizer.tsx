"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { DsaMode, Step } from "@/lib/dsa/types";
import type { ReadAloud } from "@/components/dsa/useReadAloud";
import { Bit } from "@/components/dsa/Mascot";
import { cn } from "@/lib/utils";

interface VisualizerProps {
  steps: Step[];
  pythonCode: string[];
  /** Draws the data structure for a given snapshot. */
  renderState: (state: unknown, highlight: Step["highlight"]) => ReactNode;
  mode: DsaMode;
  /** Override the code panel visibility. Defaults to (mode !== "kid"). */
  codeVisible?: boolean;
  /** Show predict-the-next-step checkpoints when a step carries a quiz. */
  quizEnabled?: boolean;
  /** Shared read-aloud controller, so the speaker toggle is unified across the lesson. */
  readAloud?: ReadAloud;
  onComplete?: () => void;
}

const SPEEDS = [
  { label: "0.5×", ms: 2200 },
  { label: "1×", ms: 1300 },
  { label: "1.5×", ms: 850 },
  { label: "2×", ms: 550 },
];

export function Visualizer({
  steps,
  pythonCode,
  renderState,
  mode,
  codeVisible,
  quizEnabled = false,
  readAloud,
  onComplete,
}: VisualizerProps) {
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [answered, setAnswered] = useState<Record<number, boolean>>({});
  const [quizFeedback, setQuizFeedback] = useState<null | { correct: boolean }>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showCode = codeVisible ?? mode !== "kid";

  const step = steps[cur];
  const last = steps.length - 1;
  const narration = mode === "kid" ? step.kidNarration ?? step.narration : step.narration;

  // Operation counters up to the current step.
  const counts = useMemo(() => {
    const c = { compare: 0, swap: 0, op: 0 };
    for (let i = 0; i <= cur; i++) {
      const a = steps[i].action;
      if (a === "compare") c.compare++;
      else if (a === "swap") c.swap++;
      else if (a !== "done" && a !== "start") c.op++;
    }
    return c;
  }, [cur, steps]);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const speakStep = useCallback(
    (text: string) => readAloud?.speak(text),
    [readAloud],
  );

  // Read the narration aloud whenever the step changes (if auto-read is on).
  useEffect(() => {
    speakStep(narration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);

  // Autoplay loop. Pauses on a fresh, unanswered quiz checkpoint.
  useEffect(() => {
    if (!playing) return;
    if (cur >= last) {
      setPlaying(false);
      onComplete?.();
      return;
    }
    const next = cur + 1;
    const nextQuiz = quizEnabled && steps[next].quiz && !answered[next];
    timer.current = setTimeout(() => {
      setCur(next);
      if (nextQuiz) setPlaying(false);
    }, SPEEDS[speedIdx].ms);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, cur, speedIdx, quizEnabled, answered]);

  const goTo = useCallback(
    (i: number) => {
      stop();
      setPlaying(false);
      setQuizFeedback(null);
      setCur(Math.max(0, Math.min(last, i)));
    },
    [last, stop],
  );

  const restart = useCallback(() => {
    setAnswered({});
    goTo(0);
  }, [goTo]);

  const togglePlay = useCallback(() => {
    if (cur >= last) {
      restart();
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [cur, last, restart]);

  // Keyboard transport.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(cur + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(cur - 1);
    } else if (e.key === " ") {
      e.preventDefault();
      togglePlay();
    }
  };

  const activeQuiz = quizEnabled && step.quiz && !answered[cur] ? step.quiz : null;

  const answerQuiz = (choice: boolean | string) => {
    if (!step.quiz) return;
    const correct = choice === step.quiz.answer;
    setQuizFeedback({ correct });
    if (correct) {
      setAnswered((a) => ({ ...a, [cur]: true }));
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label="Animation player. Use arrow keys to step, space to play or pause."
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:p-6"
    >
      <div className={cn("grid gap-4", showCode && "lg:grid-cols-2")}>
        {/* Structure stage */}
        <div className="relative flex min-h-[260px] flex-col rounded-2xl bg-gradient-to-b from-slate-50 to-brand-50/40 p-4">
          <div className="flex flex-1 items-center justify-center">
            {renderState(step.state, step.highlight)}
          </div>

          {/* Quiz overlay (predict the next step) */}
          {activeQuiz && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/95 p-5 text-center backdrop-blur-sm">
              <Bit mood="think" size="md" />
              <p className="text-base font-bold text-slate-800">{activeQuiz.prompt}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {typeof activeQuiz.answer === "boolean" ? (
                  <>
                    <QuizBtn onClick={() => answerQuiz(true)}>Yes 👍</QuizBtn>
                    <QuizBtn onClick={() => answerQuiz(false)}>No 👎</QuizBtn>
                  </>
                ) : (
                  (activeQuiz.options ?? []).map((opt) => (
                    <QuizBtn key={opt} onClick={() => answerQuiz(opt)}>
                      {opt}
                    </QuizBtn>
                  ))
                )}
              </div>
              {quizFeedback && (
                <div
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-semibold",
                    quizFeedback.correct ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                  )}
                >
                  {quizFeedback.correct ? (
                    "Nailed it! 🎉"
                  ) : (
                    <span>
                      Almost! Let&apos;s look again 🙂{" "}
                      {activeQuiz.hint && <span className="font-normal">{activeQuiz.hint}</span>}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code panel (hidden in Kid mode) */}
        {showCode && (
          <div className="overflow-hidden rounded-2xl bg-slate-900 text-[13px] leading-relaxed">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 font-mono text-xs text-slate-400">solution.py</span>
            </div>
            <pre className="overflow-x-auto p-3 font-mono">
              {pythonCode.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex rounded px-2 transition-colors",
                    i === step.codeLine ? "bg-brand-500/30 ring-1 ring-brand-400" : "",
                  )}
                >
                  <span className="mr-3 w-5 select-none text-right text-slate-600">{i + 1}</span>
                  <span className={cn(i === step.codeLine ? "text-white" : "text-slate-300")}>
                    {line || " "}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        )}
      </div>

      {/* Narration */}
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3">
        <Bit mood={step.action === "done" ? "cheer" : "happy"} size="sm" className="shrink-0" />
        <p
          className="text-sm font-medium leading-relaxed text-slate-700"
          // narration is authored content (our topic modules), safe to render.
          dangerouslySetInnerHTML={{ __html: narration }}
        />
        {readAloud?.supported && (
          <button
            onClick={() => readAloud.speak(narration, true)}
            aria-label="Read this aloud"
            className="ml-auto shrink-0 rounded-full p-1.5 text-brand-600 hover:bg-brand-100"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Transport */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <TransportBtn label="Restart" onClick={restart}>
            <RotateCcw className="h-4 w-4" />
          </TransportBtn>
          <TransportBtn label="Step back" onClick={() => goTo(cur - 1)} disabled={cur === 0}>
            <SkipBack className="h-4 w-4" />
          </TransportBtn>
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-white shadow-md transition hover:opacity-90 active:scale-95"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
          </button>
          <TransportBtn label="Step forward" onClick={() => goTo(cur + 1)} disabled={cur >= last}>
            <SkipForward className="h-4 w-4" />
          </TransportBtn>
        </div>

        {/* Progress */}
        <div className="flex flex-1 items-center gap-2">
          <input
            type="range"
            min={0}
            max={last}
            value={cur}
            onChange={(e) => goTo(Number(e.target.value))}
            aria-label="Scrub through steps"
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500"
          />
          <span className="w-14 shrink-0 text-right text-xs font-semibold text-slate-500">
            {cur + 1}/{steps.length}
          </span>
        </div>

        {/* Speed */}
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          Speed
          <select
            value={speedIdx}
            onChange={(e) => setSpeedIdx(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700"
          >
            {SPEEDS.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {readAloud?.supported && (
          <button
            onClick={readAloud.toggle}
            aria-pressed={readAloud.enabled}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
              readAloud.enabled ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500",
            )}
          >
            {readAloud.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {readAloud.enabled ? "Voice on" : "Voice off"}
          </button>
        )}
      </div>

      {/* Counters */}
      {(counts.compare > 0 || counts.swap > 0 || counts.op > 0) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          {counts.op > 0 && <Counter color="brand">{counts.op} operations</Counter>}
          {counts.compare > 0 && <Counter color="sky">{counts.compare} comparisons</Counter>}
          {counts.swap > 0 && <Counter color="amber">{counts.swap} swaps</Counter>}
        </div>
      )}
    </div>
  );
}

function QuizBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50 active:scale-95"
    >
      {children}
    </button>
  );
}

function TransportBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Counter({ children, color }: { children: ReactNode; color: "brand" | "sky" | "amber" }) {
  const map = {
    brand: "bg-brand-100 text-brand-700",
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return <span className={cn("rounded-full px-2.5 py-1", map[color])}>{children}</span>;
}
