"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Mic, Square, RotateCcw, Play, CheckCircle, AlertCircle, Timer } from "lucide-react";
import { PlanUsageBadge, UpgradeWall } from "@/components/ui/PlanUsageBadge";

const CATEGORIES = [
  { key: "Technology",        emoji: "💻", color: "border-blue-200 bg-blue-50 text-blue-700" },
  { key: "Business & Economy",emoji: "📈", color: "border-green-200 bg-green-50 text-green-700" },
  { key: "Social Issues",     emoji: "🤝", color: "border-purple-200 bg-purple-50 text-purple-700" },
  { key: "Current Affairs",   emoji: "🌍", color: "border-amber-200 bg-amber-50 text-amber-700" },
  { key: "Environment",       emoji: "🌿", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { key: "Abstract",          emoji: "🧩", color: "border-rose-200 bg-rose-50 text-rose-700" },
];

interface GDTopic { topic: string; category: string; context: string; keyAngles: string[]; }
interface GDFeedback {
  overallScore: number;
  fluency: { score: number; feedback: string };
  structure: { score: number; feedback: string };
  content: { score: number; feedback: string };
  fillerWordCount: number;
  strengths: string[];
  improvements: string[];
  modelOpening: string;
  modelResponse: string;
}

type Phase = "setup" | "topic" | "speaking" | "review" | "feedback";

const SCORE_COLOR = (s: number) =>
  s >= 80 ? "text-green-600" : s >= 65 ? "text-blue-600" : s >= 50 ? "text-amber-600" : "text-red-500";
const SCORE_BAR = (s: number) =>
  s >= 80 ? "bg-green-500" : s >= 65 ? "bg-blue-500" : s >= 50 ? "bg-amber-500" : "bg-red-400";

function ScoreBar({ label, score, feedback }: { label: string; score: number; feedback: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className={`text-sm font-bold ${SCORE_COLOR(score)}`}>{score}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${SCORE_BAR(score)} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{feedback}</p>
    </div>
  );
}

export function GDPracticeClient({
  freeUsed = 0, freeLimit = 5, isPro = false,
}: {
  freeUsed?: number; freeLimit?: number; isPro?: boolean;
} = {}) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState<GDTopic | null>(null);
  const [feedback, setFeedback] = useState<GDFeedback | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [usedCount, setUsedCount] = useState(freeUsed);
  const exhausted = !isPro && usedCount >= freeLimit;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const MAX_SECONDS = 120;

  useEffect(() => {
    setSpeechSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }, []);

  useEffect(() => {
    if (phase === "speaking") {
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e >= MAX_SECONDS) { stopRecording(); return e; }
          return e + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    setPhase("review");
  }, []);

  async function getTopic() {
    if (!category) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "topic", category }),
      });
      const d = await res.json();
      if (res.status === 403 && d.error === "free_limit_reached") { setLimitReached(true); return; }
      if (!res.ok) throw new Error(d.error);
      setTopic(d);
      setUsedCount(c => c + 1);
      setTranscript("");
      setInterimTranscript("");
      setElapsed(0);
      setPhase("topic");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate topic.");
    } finally {
      setLoading(false);
    }
  }

  function startRecording() {
    setElapsed(0);
    setTranscript("");
    setInterimTranscript("");

    // Audio recording via MediaRecorder
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const mr = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mr.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          setAudioUrl(URL.createObjectURL(blob));
          stream.getTracks().forEach((t) => t.stop());
        };
        mr.start();
        mediaRecorderRef.current = mr;
      }).catch(() => {});
    }

    // Speech recognition runs silently — transcript is used only for AI feedback
    if (speechSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      let finalText = "";
      rec.onresult = (e: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
          else interim += e.results[i][0].transcript;
        }
        setTranscript(finalText);
        setInterimTranscript(interim);
      };
      rec.onerror = () => {};
      recognitionRef.current = rec;
      rec.start();
    }

    setPhase("speaking");
  }

  async function getFeedback() {
    const text = (transcript + interimTranscript).trim();
    if (!text || !topic) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feedback", topic: topic.topic, transcript: text }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setFeedback(d);
      setPhase("feedback");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not evaluate response.");
    } finally {
      setLoading(false);
    }
  }

  function reRecord() {
    setTranscript("");
    setInterimTranscript("");
    setElapsed(0);
    startRecording();
  }

  function reset() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setPhase("setup");
    setTopic(null);
    setFeedback(null);
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }

  const timerPct = Math.min((elapsed / MAX_SECONDS) * 100, 100);
  const timerDisplay = `${Math.floor((MAX_SECONDS - elapsed) / 60).toString().padStart(2, "0")}:${((MAX_SECONDS - elapsed) % 60).toString().padStart(2, "0")}`;

  // ── Setup ──────────────────────────────────────────────────────────────────

  if (phase === "setup") return (
    <div className="space-y-5">
      {!isPro && (
        <PlanUsageBadge used={usedCount} limit={freeLimit} feature="GD practice" />
      )}
      {limitReached && <UpgradeWall limit={freeLimit} feature="GD practice" />}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">Choose a Category</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button key={c.key} type="button" onClick={() => setCategory(c.key)}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left font-semibold transition ${
                category === c.key ? "border-slate-900 bg-slate-900 text-white" : `${c.color} hover:opacity-80`
              }`}>
              <span className="text-xl">{c.emoji}</span>
              <span className="text-sm">{c.key}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-xs font-semibold text-blue-800">🎤 Voice Practice</p>
        <p className="mt-0.5 text-xs text-blue-600">You&apos;ll get 2 minutes to speak. After recording, play it back and get AI feedback.</p>
      </div>

      {error && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button onClick={getTopic} loading={loading} disabled={!category || exhausted || limitReached} className="w-full" size="lg">
        Get GD Topic
      </Button>
    </div>
  );

  // ── Topic ──────────────────────────────────────────────────────────────────

  if (phase === "topic" && topic) return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">{topic.category}</span>
          <span className="text-xs text-slate-400">2 min response</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 leading-snug">{topic.topic}</h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Background</p>
        <p className="text-sm text-slate-700 leading-relaxed">{topic.context}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Key angles to consider</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {topic.keyAngles.map((a, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-sm text-slate-700">
              <span className="shrink-0 font-bold text-brand-500">{i + 1}.</span> {a}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={startRecording} className="flex-1" size="lg">
          <Mic className="h-4 w-4" /> Start Speaking (2 min)
        </Button>
        <Button onClick={() => setPhase("setup")} variant="outline" className="px-4">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // ── Speaking ───────────────────────────────────────────────────────────────

  if (phase === "speaking") return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Topic</p>
        <p className="font-semibold text-slate-900">{topic?.topic}</p>
      </div>

      {/* Timer */}
      <div className="overflow-hidden rounded-2xl border-2 border-red-200 bg-red-50 p-5 shadow-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Timer className="h-4 w-4 text-red-500" />
          <span className="text-xs font-bold uppercase tracking-wide text-red-600">Time Remaining</span>
        </div>
        <p className="text-4xl font-extrabold font-mono text-red-700">{timerDisplay}</p>
        <div className="mt-3 h-2 w-full rounded-full bg-red-100">
          <div className="h-2 rounded-full bg-red-500 transition-all" style={{ width: `${timerPct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs font-semibold text-red-600">Recording</span>
        </div>
      </div>

      <Button onClick={stopRecording} variant="outline" size="lg" className="w-full border-red-200 text-red-600 hover:bg-red-50">
        <Square className="h-4 w-4" /> Stop Recording
      </Button>
    </div>
  );

  // ── Review ─────────────────────────────────────────────────────────────────

  if (phase === "review") {
    const fullText = (transcript + interimTranscript).trim();
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Topic</p>
          <p className="font-semibold text-slate-900">{topic?.topic}</p>
        </div>

        {/* Audio playback */}
        {audioUrl ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-brand-500" />
                <span className="text-sm font-semibold text-slate-700">Your Recording</span>
              </div>
              <span className="text-xs text-slate-400">{elapsed}s{wordCount > 0 ? ` · ${wordCount} words` : ""}</span>
            </div>
            <audio src={audioUrl} controls className="w-full rounded-xl" />
          </div>
        ) : (
          /* Fallback textarea if audio capture failed */
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-slate-700">Type your response</p>
            <textarea rows={6} value={fullText} onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type your response here…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none"
            />
          </div>
        )}

        {!fullText && audioUrl && (
          <p className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            Speech detection wasn&apos;t available — AI feedback requires voice detection. Try Chrome or Edge for best results.
          </p>
        )}

        {error && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex gap-3">
          <Button onClick={getFeedback} loading={loading} disabled={!fullText} className="flex-1" size="lg">
            Get Feedback
          </Button>
          <Button onClick={reRecord} variant="outline" className="flex-1">
            <Mic className="h-4 w-4" /> Re-record
          </Button>
        </div>
      </div>
    );
  }

  // ── Feedback ───────────────────────────────────────────────────────────────

  if (phase === "feedback" && feedback) return (
    <div className="space-y-4">
      {/* Overall score */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Overall Score</p>
        <span className={`text-6xl font-extrabold ${SCORE_COLOR(feedback.overallScore)}`}>{feedback.overallScore}</span>
        <p className="text-sm text-slate-500 mt-1">
          {feedback.overallScore >= 80 ? "Excellent performance" : feedback.overallScore >= 65 ? "Good performance" : feedback.overallScore >= 50 ? "Average — room to improve" : "Needs significant work"}
        </p>
        {feedback.fillerWordCount > 0 && (
          <p className="mt-2 text-xs text-amber-600">~{feedback.fillerWordCount} filler words detected</p>
        )}
      </div>

      {/* Audio playback in feedback phase */}
      {audioUrl && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Play className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-semibold text-slate-700">Your Recording</span>
          </div>
          <audio src={audioUrl} controls className="w-full rounded-xl" />
        </div>
      )}

      {/* 3 dimensions */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900">Dimension Scores</h3>
        <ScoreBar label="Fluency" score={feedback.fluency.score} feedback={feedback.fluency.feedback} />
        <ScoreBar label="Structure" score={feedback.structure.score} feedback={feedback.structure.feedback} />
        <ScoreBar label="Content" score={feedback.content.score} feedback={feedback.content.feedback} />
      </div>

      {/* Strengths & improvements */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">Strengths</p>
          <ul className="space-y-1.5">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">Improvements</p>
          <ul className="space-y-1.5">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Model responses */}
      <div className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-50 p-5 shadow-sm">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">Model Opening Line</p>
        <p className="text-sm text-slate-700 italic">&ldquo;{feedback.modelOpening}&rdquo;</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">How a High Scorer Would Structure It</p>
        <p className="text-sm text-slate-700 leading-relaxed">{feedback.modelResponse}</p>
      </div>

      <Button onClick={reset} variant="outline" className="w-full">
        <RotateCcw className="h-4 w-4" /> Practice Another Topic
      </Button>
    </div>
  );

  return null;
}
