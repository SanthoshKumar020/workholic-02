"use client";

import { useState, useEffect } from "react";
import { Loader2, Zap, BookOpen, ChevronDown, ChevronUp, CheckCircle, XCircle, Trophy, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Bit, BitSays } from "@/components/dsa/Mascot";
import { Confetti } from "@/components/dsa/Confetti";
import { useReadAloud } from "@/components/dsa/useReadAloud";

interface Lesson {
  title: string;
  tagline: string;
  likeIm5: string;
  concept: string;
  formulas: { name: string; formula: string; note: string }[];
  tricks: { name: string; shortcut: string; example: string }[];
  workedExamples: { question: string; steps: string[]; answer: string }[];
  examTips: string[];
  keyPoints: string[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: string;
}

// ── Collapsible worked example ────────────────────────────────────────────────

function WorkedExample({ ex, index }: { ex: Lesson["workedExamples"][0]; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition">
        <span className="font-medium text-slate-800 text-sm">Example {index + 1}: {ex.question}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Step-by-step solution</p>
          <ol className="space-y-1.5">
            {(ex.steps ?? []).map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
            <span className="text-sm font-semibold text-green-800">Answer: {ex.answer}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function Quiz({ topicId, topicTitle }: { topicId: string; topicTitle: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(0); // confetti trigger

  async function loadQuiz() {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setDone(false);
    try {
      const res = await fetch("/api/aptitude/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, topicTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load quiz.");
      setQuestions(data.questions ?? []);
      setAnswers(new Array(data.questions?.length ?? 5).fill(null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load quiz.");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    const newAnswers = [...answers];
    newAnswers[current] = idx;
    setAnswers(newAnswers);
    if (idx === questions[current]?.correctIndex) setBurst((b) => b + 1);
  }

  function next() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setDone(true);
      const finalScore = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
      if (finalScore / questions.length >= 0.6) setBurst((b) => b + 1);
      // Save completion to localStorage
      try {
        const stored: string[] = JSON.parse(localStorage.getItem("aptitude_completed") ?? "[]");
        if (!stored.includes(topicId)) {
          localStorage.setItem("aptitude_completed", JSON.stringify([...stored, topicId]));
        }
      } catch { /* ignore */ }
    }
  }

  const score = done ? answers.filter((a, i) => a === questions[i]?.correctIndex).length : 0;
  const q = questions[current];

  if (!questions.length && !loading && !error) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="mb-4 text-slate-500">Ready to test what you learned?</p>
        <Button onClick={loadQuiz} size="lg">
          <Zap className="h-4 w-4" /> Start Practice Quiz (5 questions)
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm text-slate-500">Generating your quiz questions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        {error} <button type="button" onClick={loadQuiz} className="ml-2 underline">Try again</button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-5">
        <Confetti key={burst} fire={burst > 0} />
        <Bit mood={pct >= 60 ? "cheer" : "happy"} size="lg" className="mx-auto" />
        <Trophy className={`mx-auto h-12 w-12 ${pct >= 80 ? "text-amber-400" : pct >= 60 ? "text-brand-400" : "text-slate-300"}`} />
        <div>
          <p className="text-3xl font-extrabold text-slate-900">{score}/{questions.length}</p>
          <p className="mt-1 text-slate-500">
            {pct === 100 ? "Perfect score! 🎉" : pct >= 80 ? "Excellent work! 🌟" : pct >= 60 ? "Good effort — keep going!" : "Nice try! Review and have another go 🙂"}
          </p>
        </div>

        {/* Per-question review */}
        <div className="text-left space-y-3">
          {questions.map((qn, i) => {
            const correct = answers[i] === qn.correctIndex;
            return (
              <div key={i} className={`rounded-xl border p-3 ${correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-start gap-2">
                  {correct
                    ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                  <div>
                    <p className="text-sm font-medium text-slate-800">{qn.question}</p>
                    {!correct && (
                      <p className="mt-0.5 text-xs text-red-700">
                        Your answer: {qn.options[answers[i] ?? 0]} — Correct: {qn.options[qn.correctIndex]}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-600">{qn.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={loadQuiz}
          className="flex items-center gap-2 mx-auto rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
          <RotateCcw className="h-4 w-4" /> New Quiz
        </button>
      </div>
    );
  }

  const LETTERS = ["A", "B", "C", "D"];
  const DIFF_COLOR: Record<string, string> = { easy: "text-green-600", medium: "text-amber-600", hard: "text-red-600" };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <Confetti key={burst} fire={burst > 0} />
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-slate-100">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${((current + (selected !== null ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      <div className="p-6 space-y-5">
        {/* Question header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Question {current + 1} of {questions.length}
          </span>
          {q.difficulty && (
            <span className={`text-xs font-bold capitalize ${DIFF_COLOR[q.difficulty] ?? "text-slate-500"}`}>
              {q.difficulty}
            </span>
          )}
        </div>

        {/* Question */}
        <p className="text-base font-semibold text-slate-900 leading-relaxed">{q.question}</p>

        {/* Options */}
        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            let cls = "border-slate-200 bg-white text-slate-800 hover:border-brand-400 hover:bg-brand-50";
            if (selected !== null) {
              if (i === q.correctIndex) cls = "border-green-400 bg-green-50 text-green-800 font-semibold";
              else if (i === selected) cls = "border-red-400 bg-red-50 text-red-700";
              else cls = "border-slate-100 bg-slate-50 text-slate-400";
            }
            return (
              <button key={i} type="button" onClick={() => selectAnswer(i)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${cls}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  selected !== null && i === q.correctIndex ? "bg-green-500 text-white"
                  : selected !== null && i === selected ? "bg-red-400 text-white"
                  : "bg-slate-100 text-slate-500"
                }`}>{LETTERS[i]}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation (after answering) */}
        {selected !== null && (
          <div className={`rounded-xl border p-4 ${selected === q.correctIndex ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <div className="flex items-start gap-2">
              {selected === q.correctIndex
                ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">
                  {selected === q.correctIndex ? "Nailed it! 🎉" : `Almost! The answer is ${q.options[q.correctIndex]} 🙂`}
                </p>
                <p className="text-sm text-slate-600">{q.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Next button */}
        {selected !== null && (
          <Button onClick={next} className="w-full">
            {current < questions.length - 1 ? "Next Question →" : "See Results"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main lesson component ─────────────────────────────────────────────────────

export function AptitudeLessonClient({ topicId, topicTitle }: { topicId: string; topicTitle: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const readAloud = useReadAloud({ defaultEnabled: false });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/aptitude/lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, topicTitle }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load lesson.");
        setLesson(data.lesson);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load lesson.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [topicId, topicTitle]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-400" />
        <div>
          <p className="font-semibold text-slate-700">Preparing your lesson…</p>
          <p className="mt-1 text-sm text-slate-400">Our AI tutor is writing the best explanation for you. Takes ~10 seconds.</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-sm text-red-700">
        {error ?? "Could not load lesson."}
        <button type="button" onClick={() => window.location.reload()} className="ml-2 underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mascot greeting */}
      <BitSays mood="wave">
        Hi, I&apos;m Bit! 🤖 Let&apos;s learn <b>{lesson.title}</b> together — start with the simple idea, then try the quiz. You&apos;ve got this!
      </BitSays>

      {/* Tagline */}
      <p className="text-slate-500 italic">{lesson.tagline}</p>

      {/* Like I'm 5 */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">👶</span>
          <p className="text-sm font-bold text-blue-800">Explain like I&apos;m 5</p>
          {readAloud.supported && (
            <button
              onClick={() => readAloud.speak(`${lesson.likeIm5}. ${lesson.concept}`, true)}
              aria-label="Read aloud"
              className="ml-auto rounded-full p-1.5 text-blue-600 hover:bg-blue-100"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-blue-900 leading-relaxed">{lesson.likeIm5}</p>
      </div>

      {/* Concept */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-500" />
          <p className="text-sm font-bold text-slate-700">The Concept</p>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{lesson.concept}</p>
      </div>

      {/* Formulas */}
      {lesson.formulas?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-700">📐 Key Formulas</p>
          {lesson.formulas.map((f, i) => (
            <div key={i} className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-1">{f.name}</p>
              <p className="font-mono text-base font-bold text-green-900">{f.formula}</p>
              {f.note && <p className="mt-1 text-xs text-green-700">{f.note}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Speed tricks */}
      {lesson.tricks?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-700">⚡ Speed Tricks & Shortcuts</p>
          {lesson.tricks.map((t, i) => (
            <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500 font-bold text-sm shrink-0">#{i + 1}</span>
                <div>
                  <p className="font-bold text-amber-900 text-sm">{t.name}</p>
                  <p className="mt-0.5 text-sm text-amber-800">{t.shortcut}</p>
                  {t.example && (
                    <p className="mt-1.5 rounded-lg bg-white/70 border border-amber-100 px-2.5 py-1.5 text-xs font-mono text-amber-900">
                      Example: {t.example}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Worked examples */}
      {lesson.workedExamples?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-700">✏️ Worked Examples</p>
          {lesson.workedExamples.map((ex, i) => (
            <WorkedExample key={i} ex={ex} index={i} />
          ))}
        </div>
      )}

      {/* Exam tips */}
      {lesson.examTips?.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="mb-3 text-sm font-bold text-red-800">🎯 Exam Tips (SSC · Banking · CAT)</p>
          <ul className="space-y-1.5">
            {lesson.examTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-900">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key points */}
      {lesson.keyPoints?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="mb-3 text-sm font-bold text-slate-700">📌 Quick Revision — Remember These</p>
          <ul className="space-y-1.5">
            {lesson.keyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">{i + 1}</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quiz section */}
      <div className="border-t border-slate-200 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Practice Quiz</h2>
            <p className="text-sm text-slate-400 mt-0.5">5 questions · AI-generated · exam style</p>
          </div>
          {!showQuiz && (
            <Button onClick={() => setShowQuiz(true)}>
              <Zap className="h-4 w-4" /> Take Quiz
            </Button>
          )}
        </div>
        {showQuiz && <Quiz topicId={topicId} topicTitle={topicTitle} />}
      </div>
    </div>
  );
}
