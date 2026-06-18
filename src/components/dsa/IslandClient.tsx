"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2, VolumeX, Code2, Star, Type, Sparkles } from "lucide-react";
import type { DsaMode } from "@/lib/dsa/types";
import type { Island } from "@/lib/dsa/curriculum";
import { getTopicModule } from "@/components/dsa/topics/registry";
import { ModeSwitch } from "@/components/dsa/ModeSwitch";
import { Visualizer } from "@/components/dsa/Visualizer";
import { Tutor } from "@/components/dsa/Tutor";
import { PlateStacker } from "@/components/dsa/games/PlateStacker";
import { Bit, BitSays } from "@/components/dsa/Mascot";
import { Confetti } from "@/components/dsa/Confetti";
import { useReadAloud } from "@/components/dsa/useReadAloud";
import { CONFIDENCE_TO_QUALITY } from "@/lib/dsa/srs";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "story", label: "Story", emoji: "📖" },
  { id: "see", label: "See it", emoji: "👀" },
  { id: "try", label: "Try it", emoji: "🎮" },
  { id: "code", label: "Code", emoji: "💻" },
  { id: "recall", label: "Master it", emoji: "⭐" },
];

export function IslandClient({
  island,
  initialMode,
  initialStars,
}: {
  island: Island;
  initialMode: DsaMode;
  initialStars: number;
}) {
  const module = getTopicModule(island.slug);
  const [mode, setModeState] = useState<DsaMode>(initialMode);
  const [showCodeBeginner, setShowCodeBeginner] = useState(false);
  const [easyRead, setEasyRead] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const [quizMe, setQuizMe] = useState(false);
  const [gameStars, setGameStars] = useState(0);
  const readAloud = useReadAloud({ defaultEnabled: initialMode === "kid" });

  // Persist mode to the profile (and remember which level the learner likes).
  const setMode = (m: DsaMode) => {
    setModeState(m);
    if (m === "kid") readAloud.setEnabled(true);
    fetch("/api/dsa/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: m }),
    }).catch(() => {});
    try {
      localStorage.setItem("dsa_mode", m);
    } catch {}
  };

  if (!module) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <BitSays mood="think" size="lg">
          This island is still being built — check back soon! 🛠️
        </BitSays>
        <Link href="/dsa" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Back to the map
        </Link>
      </div>
    );
  }

  const demo = module.demos[demoIdx];
  const steps = demo.buildSteps();
  const codeVisible = mode === "interview" || (mode === "beginner" && showCodeBeginner);

  return (
    <div
      className={cn("pb-24", easyRead && "tracking-wide [word-spacing:0.1em]")}
      style={easyRead ? { lineHeight: 1.9 } : undefined}
    >
      {/* Sticky control bar */}
      <div className="sticky top-[57px] z-30 -mx-4 mb-6 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:top-[60px]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3">
          <Link
            href="/dsa"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Map
          </Link>
          <ModeSwitch value={mode} onChange={setMode} />
          <div className="ml-auto flex items-center gap-1.5">
            {readAloud.supported && (
              <button
                onClick={readAloud.toggle}
                aria-pressed={readAloud.enabled}
                title="Read aloud"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition",
                  readAloud.enabled ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500",
                )}
              >
                {readAloud.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={() => setEasyRead((e) => !e)}
              aria-pressed={easyRead}
              title="Easy-read spacing"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition",
                easyRead ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500",
              )}
            >
              <Type className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Section quick-nav */}
        <div className="mx-auto mt-2 flex max-w-4xl gap-1.5 overflow-x-auto">
          {SECTIONS.filter((s) => s.id !== "code" || mode !== "kid").map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-brand-100 hover:text-brand-700"
            >
              {s.emoji} {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-12">
        {/* Header */}
        <header className="text-center">
          <div className={cn("mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br text-4xl shadow-lg", island.gradient)}>
            {island.emoji}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">{island.kidName}</h1>
          <p className="mt-1 text-sm font-semibold text-brand-600">{island.techName}</p>
          {initialStars > 0 && (
            <div className="mt-2 inline-flex items-center gap-0.5">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={cn("h-4 w-4", s <= initialStars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")}
                />
              ))}
              <span className="ml-1 text-xs font-semibold text-slate-400">best so far</span>
            </div>
          )}
        </header>

        {/* 1. STORY */}
        <Section id="story" emoji="📖" title="The Story">
          <StoryLayer mode={mode} lines={module.lesson.story} readAloud={readAloud} techName={island.techName} />
        </Section>

        {/* 2. SEE IT */}
        <Section id="see" emoji="👀" title="See it move">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {module.demos.map((d, i) => (
                <button
                  key={d.key}
                  onClick={() => setDemoIdx(i)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-sm font-bold transition",
                    i === demoIdx ? "bg-brand-gradient text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {d.emoji} {d.label}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={quizMe}
                onChange={(e) => setQuizMe(e.target.checked)}
                className="h-4 w-4 accent-brand-500"
              />
              <Sparkles className="h-4 w-4 text-amber-500" /> Quiz me
            </label>
          </div>
          <Visualizer
            key={demo.key}
            steps={steps}
            pythonCode={demo.pythonCode}
            renderState={(state, highlight) => <module.StructureView state={state} highlight={highlight} mode={mode} />}
            mode={mode}
            codeVisible={codeVisible}
            quizEnabled={quizMe}
            readAloud={readAloud}
          />
        </Section>

        {/* 3. TRY IT */}
        <Section id="try" emoji="🎮" title="Your turn — try it!">
          <BitSays mood="happy" className="mb-4">
            Now you build it! Stack the plates so the top one is the last you added.
          </BitSays>
          <PlateStacker onWin={(s) => setGameStars((g) => Math.max(g, s))} />
        </Section>

        {/* 4. CODE */}
        {mode !== "kid" && (
          <Section id="code" emoji="💻" title="The real code">
            <CodeLayer
              mode={mode}
              module={module}
              showCodeBeginner={showCodeBeginner}
              onShowCode={() => setShowCodeBeginner(true)}
            />
          </Section>
        )}

        {/* 5. MASTER IT */}
        <Section id="recall" emoji="⭐" title="Master it">
          <RecallCheck island={island} module={module} gameStars={gameStars} />
        </Section>

        {/* Tutor */}
        <Tutor topic={island.techName} mode={mode} />
      </div>
    </div>
  );
}



// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  id,
  emoji,
  title,
  children,
}: {
  id: string;
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-36">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
        <span className="text-2xl">{emoji}</span> {title}
      </h2>
      {children}
    </section>
  );
}

// ── Story layer ──────────────────────────────────────────────────────────────
function StoryLayer({
  mode,
  lines,
  readAloud,
  techName,
}: {
  mode: DsaMode;
  lines: string[];
  readAloud: ReturnType<typeof useReadAloud>;
  techName: string;
}) {
  // Auto-read the whole story once when arriving in kid mode with voice on.
  const readOnce = useRef(false);
  useEffect(() => {
    if (mode === "kid" && readAloud.enabled && !readOnce.current) {
      readOnce.current = true;
      readAloud.speak(lines.join(" "));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const big = mode === "kid";
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-b from-brand-50/60 to-white p-5">
        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              {big && <span className="mt-0.5 text-lg">{["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][i] ?? "•"}</span>}
              <p
                className={cn("leading-relaxed text-slate-700", big ? "text-lg font-medium" : "text-base")}
                dangerouslySetInnerHTML={{ __html: line }}
              />
            </div>
          ))}
        </div>
        {readAloud.supported && (
          <button
            onClick={() => readAloud.speak(lines.join(" "), true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-100 px-3 py-2 text-sm font-bold text-brand-700 hover:bg-brand-200"
          >
            <Volume2 className="h-4 w-4" /> Read the story to me
          </button>
        )}
      </div>
      <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-bold text-white">
        🎓 Grown-ups call this: {techName}
      </div>
    </div>
  );
}

// ── Code layer ───────────────────────────────────────────────────────────────
function CodeLayer({
  mode,
  module,
  showCodeBeginner,
  onShowCode,
}: {
  mode: DsaMode;
  module: NonNullable<ReturnType<typeof getTopicModule>>;
  showCodeBeginner: boolean;
  onShowCode: () => void;
}) {
  const visible = mode === "interview" || showCodeBeginner;
  const { lesson } = module;

  if (!visible) {
    return (
      <button
        onClick={onShowCode}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-white px-4 py-6 text-sm font-bold text-brand-600 hover:bg-brand-50"
      >
        <Code2 className="h-4 w-4" /> Show me the code
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {lesson.steps && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <ul className="space-y-2">
            {lesson.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="font-bold text-brand-500">{i + 1}.</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {module.demos.map((d) => (
        <div key={d.key} className="overflow-hidden rounded-2xl bg-slate-900">
          <div className="border-b border-white/10 px-4 py-2 font-mono text-xs text-slate-400">
            {d.emoji} {d.label}.py
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-relaxed text-slate-200">
            {d.pythonCode.map((l, i) => (
              <div key={i}>
                <span className="mr-3 select-none text-slate-600">{String(i + 1).padStart(2, " ")}</span>
                {l || " "}
              </div>
            ))}
          </pre>
        </div>
      ))}

      {mode === "interview" && lesson.complexity && (
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard title="⏱️ Complexity" tone="brand">
            <p><b>Time:</b> {lesson.complexity.time}</p>
            <p><b>Space:</b> {lesson.complexity.space}</p>
            {lesson.complexity.note && <p className="mt-1 text-slate-500">{lesson.complexity.note}</p>}
          </InfoCard>
          {lesson.edgeCases && (
            <InfoCard title="⚠️ Edge cases" tone="amber">
              <ul className="list-disc space-y-1 pl-4">
                {lesson.edgeCases.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </InfoCard>
          )}
        </div>
      )}

      {mode === "interview" && lesson.interviewTips && (
        <InfoCard title="🎤 Interview tips" tone="emerald">
          <ul className="list-disc space-y-1 pl-4">
            {lesson.interviewTips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </InfoCard>
      )}
    </div>
  );
}

function InfoCard({ title, tone, children }: { title: string; tone: "brand" | "amber" | "emerald"; children: React.ReactNode }) {
  const map = {
    brand: "border-brand-100 bg-brand-50/50",
    amber: "border-amber-100 bg-amber-50/50",
    emerald: "border-emerald-100 bg-emerald-50/50",
  };
  return (
    <div className={cn("rounded-2xl border p-4 text-sm text-slate-700", map[tone])}>
      <h4 className="mb-2 font-bold text-slate-800">{title}</h4>
      {children}
    </div>
  );
}

// ── Recall check (active recall + SRS + mastery) ─────────────────────────────
const CONFIDENCE = [
  { key: "again", label: "I forgot", emoji: "😅" },
  { key: "hard", label: "Tricky", emoji: "🤔" },
  { key: "good", label: "I knew it", emoji: "😎" },
  { key: "easy", label: "Too easy!", emoji: "🌟" },
];

function RecallCheck({
  island,
  module,
  gameStars,
}: {
  island: Island;
  module: NonNullable<ReturnType<typeof getTopicModule>>;
  gameStars: number;
}) {
  const questions = module.recall;
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [firstTryAllCorrect, setFirstTryAllCorrect] = useState(true);
  const [phase, setPhase] = useState<"quiz" | "confidence" | "done">("quiz");
  const [stars, setStars] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const q = questions[idx];
  const options = q.options ?? ["True", "False"];

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    const isCorrect = typeof q.answer === "boolean" ? opt === (q.answer ? "True" : "False") : opt === q.answer;
    if (isCorrect) setCorrectCount((c) => c + 1);
    else setFirstTryAllCorrect(false);
  }

  function next() {
    setPicked(null);
    if (idx + 1 < questions.length) setIdx(idx + 1);
    else setPhase("confidence");
  }

  async function finish(confidenceKey: string) {
    // Stars: 1 for finishing, +1 if all recall correct first try, +1 if the game was aced.
    let earned = 1;
    if (firstTryAllCorrect) earned++;
    if (gameStars >= 3) earned++;
    earned = Math.min(3, earned);
    setStars(earned);
    setPhase("done");
    setCelebrate(true);

    const quality = CONFIDENCE_TO_QUALITY[confidenceKey] ?? 3;
    // Write one SRS item per recall fact + mark the island mastered.
    await Promise.all([
      ...questions.map((_, i) =>
        fetch("/api/dsa/srs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: `${island.slug}:recall:${i}`, item_type: "recall", quality }),
        }).catch(() => {}),
      ),
      fetch("/api/dsa/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: island.slug, stars: earned }),
      }).catch(() => {}),
    ]);
  }

  if (phase === "done") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 text-center">
        <Confetti fire={celebrate} />
        <Bit mood="cheer" size="xl" className="mx-auto" />
        <h3 className="mt-3 text-2xl font-extrabold text-slate-900">Island complete! 🎉</h3>
        <div className="my-3 flex justify-center gap-1">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={cn("h-9 w-9", s <= stars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")}
            />
          ))}
        </div>
        <p className="text-sm font-medium text-slate-600">
          You earned the <b>“Stack Master”</b> sticker 🏆 and unlocked the next island.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/dsa"
            className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90"
          >
            Back to the map →
          </Link>
          <button
            onClick={() => {
              setIdx(0);
              setPicked(null);
              setCorrectCount(0);
              setFirstTryAllCorrect(true);
              setPhase("quiz");
              setCelebrate(false);
            }}
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200"
          >
            Try again for 3 ⭐
          </button>
        </div>
      </div>
    );
  }

  if (phase === "confidence") {
    return (
      <div className="rounded-3xl border border-brand-100 bg-white p-6 text-center">
        <BitSays mood="happy" className="mb-4 justify-center">
          You got {correctCount}/{questions.length}! How well do you feel you know this?
        </BitSays>
        <div className="flex flex-wrap justify-center gap-2">
          {CONFIDENCE.map((c) => (
            <button
              key={c.key}
              onClick={() => finish(c.key)}
              className="flex flex-col items-center gap-1 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50"
            >
              <span className="text-2xl">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">This sets when we&apos;ll remind you to review (spaced repetition).</p>
      </div>
    );
  }

  // quiz phase
  const isCorrect = (opt: string) =>
    typeof q.answer === "boolean" ? opt === (q.answer ? "True" : "False") : opt === q.answer;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>Question {idx + 1} of {questions.length}</span>
        <span>{correctCount} correct</span>
      </div>
      <p className="mb-4 text-lg font-bold text-slate-800">{q.question}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const chosen = picked === opt;
          const showResult = picked !== null;
          const good = isCorrect(opt);
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={picked !== null}
              className={cn(
                "rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition",
                !showResult && "border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50",
                showResult && good && "border-emerald-400 bg-emerald-50 text-emerald-700",
                showResult && chosen && !good && "border-amber-400 bg-amber-50 text-amber-700",
                showResult && !chosen && !good && "border-slate-200 bg-white text-slate-400",
              )}
            >
              {opt} {showResult && good && "✓"}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4">
          <BitSays mood={isCorrect(picked) ? "cheer" : "oops"}>
            {isCorrect(picked) ? "Yes! " : "Almost! Let's look again 🙂 "}
            {q.explain}
          </BitSays>
          <button
            onClick={next}
            className="mt-3 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90"
          >
            {idx + 1 < questions.length ? "Next question →" : "Finish →"}
          </button>
        </div>
      )}
    </div>
  );
}
