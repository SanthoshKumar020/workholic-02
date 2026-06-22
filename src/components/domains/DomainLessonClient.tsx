"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Volume2, VolumeX, Loader2, Star, BookOpen, Lightbulb, Briefcase, Globe } from "lucide-react";
import type { DsaMode } from "@/lib/dsa/types";
import type { DomainLesson } from "@/lib/domains/types";
import { ModeSwitch } from "@/components/dsa/ModeSwitch";
import { Bit, BitSays } from "@/components/dsa/Mascot";
import { Confetti } from "@/components/dsa/Confetti";
import { useReadAloud } from "@/components/dsa/useReadAloud";
import { DiagramView } from "@/components/domains/DiagramView";
import { BarChart } from "@/components/domains/BarChart";
import { CONFIDENCE_TO_QUALITY } from "@/lib/dsa/srs";
import { cn } from "@/lib/utils";

const CONFIDENCE = [
  { key: "again", label: "Still fuzzy", emoji: "😅" },
  { key: "hard", label: "Tricky", emoji: "🤔" },
  { key: "good", label: "Got it", emoji: "😎" },
  { key: "easy", label: "Easy!", emoji: "🌟" },
];

export function DomainLessonClient({
  domainSlug,
  domainName,
  topicSlug,
  topicTitle,
  index,
  total,
  nextTopicSlug,
  initialMode,
}: {
  domainSlug: string;
  domainName: string;
  topicSlug: string;
  topicTitle: string;
  index: number;
  total: number;
  nextTopicSlug: string | null;
  initialMode: DsaMode;
}) {
  const [mode, setModeState] = useState<DsaMode>(initialMode);
  const [lesson, setLesson] = useState<DomainLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const readAloud = useReadAloud({ defaultEnabled: initialMode === "kid" });

  // Quiz + completion state
  const [phase, setPhase] = useState<"learn" | "quiz" | "confidence" | "done">("learn");
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [burst, setBurst] = useState(0);
  const [stars, setStars] = useState(0);
  const [savedQuality, setSavedQuality] = useState(4);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const setMode = (m: DsaMode) => {
    setModeState(m);
    if (m === "kid") readAloud.setEnabled(true);
    fetch("/api/dsa/mode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: m }) }).catch(() => {});
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLesson(null);
    setPhase("learn");
    setQIdx(0);
    setPicked(null);
    setCorrect(0);
    try {
      const res = await fetch("/api/domains/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainSlug, topic: topicSlug, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load lesson.");
      setLesson(data.lesson);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this lesson.");
    } finally {
      setLoading(false);
    }
  }, [domainSlug, topicSlug, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const quiz = lesson?.quiz ?? [];

  function answer(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === quiz[qIdx].correctIndex) {
      setCorrect((c) => c + 1);
      setBurst((b) => b + 1);
    }
  }

  function nextQuestion() {
    setPicked(null);
    if (qIdx + 1 < quiz.length) setQIdx(qIdx + 1);
    else setPhase("confidence");
  }

  // Records mastery (so the next topic unlocks) and schedules SRS cards.
  // Surfaces failures instead of swallowing them, so a missing migration is visible.
  const saveCompletion = useCallback(
    async (earned: number, quality: number) => {
      setSaving(true);
      try {
        const res = await fetch("/api/domains/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: domainSlug, topic: topicSlug, stars: earned }),
        });
        if (!res.ok) {
          setSaveError(true);
          return false;
        }
        setSaveError(false);
        // SRS cards are best-effort and don't block unlocking.
        quiz.forEach((_, i) =>
          fetch("/api/dsa/srs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item_id: `domain:${domainSlug}:${topicSlug}:q${i}`, item_type: "concept", quality }),
          }).catch(() => {}),
        );
        return true;
      } catch {
        setSaveError(true);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [domainSlug, topicSlug, quiz],
  );

  async function finish(confidenceKey: string) {
    const score = quiz.length ? correct / quiz.length : 1;
    const earned = score === 1 ? 3 : score >= 0.6 ? 2 : 1;
    const quality = CONFIDENCE_TO_QUALITY[confidenceKey] ?? 3;
    setStars(earned);
    setSavedQuality(quality);
    setPhase("done");
    setBurst((b) => b + 1);
    await saveCompletion(earned, quality);
  }

  return (
    <div>
      <Confetti key={burst} fire={burst > 0} />

      {/* Control bar */}
      <div className="sticky top-[57px] z-30 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:top-[60px]">
        <Link href={`/domains/${domainSlug}`} className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> {domainName}
        </Link>
        <ModeSwitch value={mode} onChange={setMode} />
        {readAloud.supported && (
          <button onClick={readAloud.toggle} aria-pressed={readAloud.enabled} className={cn("ml-auto flex h-9 w-9 items-center justify-center rounded-xl transition", readAloud.enabled ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500")}>
            {readAloud.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-brand-600">Topic {index + 1} of {total}</p>
        <h1 className="mb-6 text-3xl font-extrabold text-slate-900">{topicTitle}</h1>

        {loading && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Bit mood="think" size="lg" />
            <Loader2 className="h-7 w-7 animate-spin text-brand-400" />
            <p className="text-sm text-slate-500">Bit is preparing your lesson… (~10s)</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            <BitSays mood="oops" className="justify-center">{error}</BitSays>
            <button onClick={load} className="mt-4 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">Try again</button>
          </div>
        )}

        {lesson && !loading && phase === "learn" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50/60 to-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span>
                <p className="text-sm font-bold text-brand-700">The big idea</p>
                {readAloud.supported && (
                  <button onClick={() => readAloud.speak(`${lesson.analogy}. ${lesson.concept}`, true)} aria-label="Read aloud" className="ml-auto rounded-full p-1.5 text-brand-600 hover:bg-brand-100">
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-[15px] font-medium leading-relaxed text-slate-700">{lesson.analogy}</p>
            </div>

            <Card icon={<BookOpen className="h-4 w-4" />} title="What it is">
              <p className="leading-relaxed">{lesson.concept}</p>
            </Card>

            {lesson.diagram && lesson.diagram.nodes?.length > 0 && <DiagramView spec={lesson.diagram} />}
            {lesson.chart && lesson.chart.data?.length > 0 && <BarChart spec={lesson.chart} />}

            {lesson.steps?.length > 0 && (
              <Card icon={<ArrowRight className="h-4 w-4" />} title="How it works">
                <ol className="space-y-2">
                  {lesson.steps.map((s, i) => (
                    <li key={i} className="flex gap-2"><span className="font-bold text-brand-500">{i + 1}.</span> {s}</li>
                  ))}
                </ol>
              </Card>
            )}

            {lesson.keyPoints?.length > 0 && (
              <Card icon={<Lightbulb className="h-4 w-4" />} title="Remember these">
                <ul className="space-y-1.5">
                  {lesson.keyPoints.map((k, i) => (
                    <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" /> {k}</li>
                  ))}
                </ul>
              </Card>
            )}

            {lesson.realWorld && (
              <Card icon={<Globe className="h-4 w-4" />} title="In the real world" tone="emerald">
                <p>{lesson.realWorld}</p>
              </Card>
            )}

            {mode === "interview" && lesson.interviewTips && lesson.interviewTips.length > 0 && (
              <Card icon={<Briefcase className="h-4 w-4" />} title="Interview tips" tone="amber">
                <ul className="space-y-1.5">
                  {lesson.interviewTips.map((t, i) => (
                    <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" /> {t}</li>
                  ))}
                </ul>
              </Card>
            )}

            {quiz.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
                <BitSays mood="happy" className="mb-3 justify-center">Ready to lock it in? Ace the quiz to master this topic! 🎯</BitSays>
                <button onClick={() => setPhase("quiz")} className="rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">
                  Start quiz ({quiz.length} questions) →
                </button>
              </div>
            )}
          </div>
        )}

        {lesson && phase === "quiz" && quiz[qIdx] && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex justify-between text-xs font-bold text-slate-400">
              <span>Question {qIdx + 1} of {quiz.length}</span>
              <span>{correct} correct</span>
            </div>
            <p className="mb-4 text-lg font-semibold text-slate-900">{quiz[qIdx].question}</p>
            <div className="space-y-2">
              {quiz[qIdx].options.map((opt, i) => {
                const show = picked !== null;
                const good = i === quiz[qIdx].correctIndex;
                const chosen = i === picked;
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={picked !== null}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition",
                      !show && "border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50",
                      show && good && "border-emerald-400 bg-emerald-50 text-emerald-800",
                      show && chosen && !good && "border-amber-400 bg-amber-50 text-amber-700",
                      show && !chosen && !good && "border-slate-100 bg-slate-50 text-slate-400",
                    )}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{["A", "B", "C", "D"][i]}</span>
                    {opt} {show && good && "✓"}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="mt-4">
                <BitSays mood={picked === quiz[qIdx].correctIndex ? "cheer" : "oops"}>
                  {picked === quiz[qIdx].correctIndex ? "Nailed it! 🎉 " : "Almost! Let's look again 🙂 "}
                  {quiz[qIdx].explanation}
                </BitSays>
                <button onClick={nextQuestion} className="mt-3 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">
                  {qIdx + 1 < quiz.length ? "Next question →" : "Finish →"}
                </button>
              </div>
            )}
          </div>
        )}

        {phase === "confidence" && (
          <div className="rounded-2xl border border-brand-100 bg-white p-6 text-center">
            <BitSays mood="happy" className="mb-4 justify-center">You scored {correct}/{quiz.length}! How well do you know it now?</BitSays>
            <div className="flex flex-wrap justify-center gap-2">
              {CONFIDENCE.map((c) => (
                <button key={c.key} onClick={() => finish(c.key)} className="flex flex-col items-center gap-1 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50">
                  <span className="text-2xl">{c.emoji}</span>{c.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">Sets when we&apos;ll resurface this in Daily Practice (spaced repetition).</p>
          </div>
        )}

        {phase === "done" && (
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 text-center">
            <Bit mood="cheer" size="xl" className="mx-auto" />
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Topic mastered! 🎉</h2>
            <div className="my-3 flex justify-center gap-1">
              {[1, 2, 3].map((s) => (
                <Star key={s} className={cn("h-9 w-9", s <= stars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
              ))}
            </div>
            {saveError ? (
              <div className="mx-auto mt-4 max-w-md rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Couldn&apos;t save your progress 😕</p>
                <p className="mt-1">
                  The next topic unlocks once this is saved. If this keeps happening, the database table is missing —
                  run the <code className="rounded bg-amber-100 px-1">006_domains.sql</code> migration.
                </p>
                <button
                  onClick={() => saveCompletion(stars, savedQuality)}
                  disabled={saving}
                  className="mt-3 rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-md hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Retry save"}
                </button>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {saving && <span className="text-sm font-medium text-slate-400">Saving your progress…</span>}
                {!saving && nextTopicSlug && (
                  <Link href={`/domains/${domainSlug}/${nextTopicSlug}`} className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">
                    Next topic →
                  </Link>
                )}
                {!saving && !nextTopicSlug && (
                  <Link href={`/domains/${domainSlug}`} className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">
                    🏆 Domain complete — back to roadmap
                  </Link>
                )}
                <Link href={`/domains/${domainSlug}`} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200">
                  Back to roadmap
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ icon, title, tone = "slate", children }: { icon: React.ReactNode; title: string; tone?: "slate" | "emerald" | "amber"; children: React.ReactNode }) {
  const map = { slate: "border-slate-200 bg-white", emerald: "border-emerald-100 bg-emerald-50/50", amber: "border-amber-100 bg-amber-50/50" };
  return (
    <div className={cn("rounded-2xl border p-5 text-sm text-slate-700", map[tone])}>
      <div className="mb-2 flex items-center gap-2 font-bold text-slate-800">{icon} {title}</div>
      {children}
    </div>
  );
}
