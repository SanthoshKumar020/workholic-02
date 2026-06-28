"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import {
  Mic, MicOff, Volume2, VolumeX, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, Trophy, RotateCcw, Play, Square,
  Loader2, Building2, User, Timer,
} from "lucide-react";
import { PlanUsageBadge, UpgradeWall } from "@/components/ui/PlanUsageBadge";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { shareText, SITE_URL } from "@/lib/share";

// ── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Scientist", "ML Engineer", "DevOps Engineer", "Product Manager", "UI/UX Designer",
  "Data Analyst", "QA Engineer", "Solutions Architect", "Engineering Manager",
  "Business Analyst", "Marketing Manager", "Sales Executive", "HR Manager",
];

const COMPANIES = [
  "Google", "Amazon", "Microsoft", "Meta", "Apple", "Flipkart", "Infosys",
  "TCS", "Wipro", "Accenture", "Deloitte", "Swiggy", "Zomato", "Razorpay",
  "CRED", "Meesho", "PhonePe", "Paytm", "Ola", "Uber",
];

const FILLER_WORDS = [
  "um", "uh", "like", "you know", "basically", "actually", "literally",
  "i mean", "kind of", "sort of", "right", "okay so", "so yeah", "anyway",
];

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  A: { color: "text-green-600",  bg: "bg-green-50  border-green-200",  label: "Excellent" },
  B: { color: "text-blue-600",   bg: "bg-blue-50   border-blue-200",   label: "Good" },
  C: { color: "text-amber-600",  bg: "bg-amber-50  border-amber-200",  label: "Average" },
  D: { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", label: "Needs Work" },
  F: { color: "text-red-600",    bg: "bg-red-50    border-red-200",    label: "Poor" },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Question { id: string; text: string; type: string; category: string; hint: string; followUp?: string; }
interface AnswerRecord {
  question: string; transcript: string; duration: number; wpm: number;
  fillerCount: number; fillerWords: string[];
}
interface Competency { name: string; score: number; feedback: string; }
interface ReportAnswer { question: string; score: number; pacing: string; strengths: string[]; improvements: string[]; modelAnswer: string; }
interface Report {
  overallScore: number; grade: string; headline: string;
  competencies: Competency[];
  answers: ReportAnswer[];
  fillerWordSummary: string;
  summary: { strengths: string[]; areasToImprove: string[]; nextSteps: string[] };
}

type Phase = "setup" | "loading" | "interviewing" | "generating_report" | "report";
type InterviewState = "ai_speaking" | "ready" | "recording" | "done_answer";

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectFillers(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const fw of FILLER_WORDS) {
    const re = new RegExp(`\\b${fw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    if (re.test(lower)) found.push(fw);
  }
  return found;
}

function countFillers(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const fw of FILLER_WORDS) {
    const re = new RegExp(`\\b${fw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    count += (lower.match(re) ?? []).length;
  }
  return count;
}

function wpmLabel(wpm: number): { label: string; color: string } {
  if (wpm < 110) return { label: "Too slow", color: "text-amber-600" };
  if (wpm <= 170) return { label: "Good pace", color: "text-green-600" };
  if (wpm <= 200) return { label: "Slightly fast", color: "text-amber-600" };
  return { label: "Too fast", color: "text-red-600" };
}

function ScoreBar({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const color = score >= 80 ? "bg-green-500" : score >= 65 ? "bg-blue-500" : score >= 50 ? "bg-amber-500" : "bg-red-400";
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={`w-full rounded-full bg-slate-100 ${h}`}>
      <div className={`${h} rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
    </div>
  );
}

// ── Setup Screen ──────────────────────────────────────────────────────────────

function SetupScreen({ targetRole, onStart, loading }: {
  targetRole: string;
  onStart: (cfg: { role: string; company: string; interviewType: string; level: string; count: number }) => void;
  loading: boolean;
}) {
  const [role, setRole] = useState(targetRole);
  const [company, setCompany] = useState("");
  const [interviewType, setInterviewType] = useState("mixed");
  const [level, setLevel] = useState("mid");
  const [count, setCount] = useState(8);

  const TYPES = [
    { key: "mixed",         label: "Mixed",          desc: "Behavioral + Technical + HR" },
    { key: "behavioral",    label: "Behavioral",      desc: "STAR-format, past experience" },
    { key: "technical",     label: "Technical",       desc: "Coding, systems, tools" },
    { key: "hr",            label: "HR / Culture",    desc: "Motivation, goals, fit" },
    { key: "system_design", label: "System Design",   desc: "Architecture & scale" },
  ];
  const LEVELS = [
    { key: "junior", label: "Junior (0-2 yrs)" },
    { key: "mid",    label: "Mid (2-5 yrs)" },
    { key: "senior", label: "Senior (5+ yrs)" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-5 text-white">
        <h2 className="text-lg font-bold">Configure Your Interview</h2>
        <p className="mt-0.5 text-sm text-slate-300">Voice interview · live transcription · full report card</p>
      </div>
      <div className="p-6 space-y-5">
        <Combobox label="Role *" placeholder="e.g. Software Engineer" options={ROLES} value={role} onChange={setRole} allowCustom />
        <Combobox label="Company (optional)" placeholder="e.g. Google, Amazon, Flipkart…" options={COMPANIES} value={company} onChange={setCompany} allowCustom />

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Interview Type</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {TYPES.map((t) => (
              <button key={t.key} type="button" onClick={() => setInterviewType(t.key)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${interviewType === t.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                <span className="block font-semibold">{t.label}</span>
                <span className={`text-xs ${interviewType === t.key ? "text-slate-300" : "text-slate-400"}`}>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Experience Level</p>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button key={l.key} type="button" onClick={() => setLevel(l.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${level === l.key ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Questions</p>
            <div className="flex gap-2">
              {[5, 8, 10].map((n) => (
                <button key={n} type="button" onClick={() => setCount(n)}
                  className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition ${count === n ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-800">🎤 Voice Interview</p>
          <p className="mt-0.5 text-xs text-blue-600">AI interviewer speaks each question aloud. Your answer is transcribed live. Works best in Chrome/Edge.</p>
        </div>

        <Button size="lg" onClick={() => onStart({ role, company, interviewType, level, count })}
          loading={loading} disabled={!role.trim()} className="w-full">
          <Play className="h-4 w-4" />
          {loading ? "Generating question bank…" : "Start Interview"}
        </Button>
      </div>
    </div>
  );
}

// ── Interview Screen ──────────────────────────────────────────────────────────

function InterviewScreen({
  questions, role, company, onComplete,
}: {
  questions: Question[];
  role: string;
  company: string;
  onComplete: (answers: AnswerRecord[]) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [state, setState] = useState<InterviewState>("ai_speaking");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [recordingStart, setRecordingStart] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSpeakingRef = useRef(false);

  const currentQ = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;

  useEffect(() => {
    setSpeechSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setTtsSupported("speechSynthesis" in window);
  }, []);

  // Speak a question via TTS
  const speakQuestion = useCallback((text: string, onEnd: () => void) => {
    if (!("speechSynthesis" in window)) { onEnd(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes("female"))
      || voices.find((v) => v.lang === "en-US")
      || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => { isSpeakingRef.current = false; onEnd(); };
    utterance.onerror = () => { isSpeakingRef.current = false; onEnd(); };
    isSpeakingRef.current = true;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Speak current question when it changes
  useEffect(() => {
    if (!currentQ) return;
    setState("ai_speaking");
    setTranscript("");
    setInterimTranscript("");
    const intro = currentIdx === 0
      ? `Hello! I'm Alex, your interviewer today. Let's get started. ${currentQ.text}`
      : `Great. Next question. ${currentQ.text}`;
    speakQuestion(intro, () => setState("ready"));
    return () => { window.speechSynthesis?.cancel(); };
  }, [currentIdx, currentQ, speakQuestion]);

  // Timer
  useEffect(() => {
    if (state === "recording") {
      setRecordingStart(Date.now());
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  function startRecording() {
    if (!speechSupported) { setState("recording"); return; }
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
    rec.onerror = () => setState("ready");
    recognitionRef.current = rec;
    rec.start();
    setState("recording");
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setState("done_answer");
  }

  function submitAnswer() {
    const duration = Math.max(1, Math.floor((Date.now() - recordingStart) / 1000));
    const fullText = (transcript + interimTranscript).trim();
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    const wpm = Math.round((wordCount / duration) * 60);
    const fillerWords = detectFillers(fullText);
    const fillerCount = countFillers(fullText);

    const record: AnswerRecord = {
      question: currentQ.text,
      transcript: fullText,
      duration,
      wpm,
      fillerCount,
      fillerWords,
    };

    const newAnswers = [...answers, record];
    setAnswers(newAnswers);
    setTranscript("");
    setInterimTranscript("");

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      onComplete(newAnswers);
    }
  }

  function skipQuestion() {
    const record: AnswerRecord = {
      question: currentQ.text, transcript: "(skipped)", duration: 0, wpm: 0, fillerCount: 0, fillerWords: [],
    };
    const newAnswers = [...answers, record];
    setAnswers(newAnswers);
    if (currentIdx < questions.length - 1) setCurrentIdx((i) => i + 1);
    else onComplete(newAnswers);
  }

  function stopTTS() { window.speechSynthesis?.cancel(); isSpeakingRef.current = false; setState("ready"); }

  const TYPE_COLOR: Record<string, string> = {
    behavioral: "bg-blue-100 text-blue-700",
    technical: "bg-purple-100 text-purple-700",
    hr: "bg-green-100 text-green-700",
    system_design: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-full bg-slate-100 h-2">
          <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="shrink-0 text-xs font-semibold text-slate-500">
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      {/* Interviewer card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-900 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white ${state === "ai_speaking" ? "ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-900" : ""}`}>
              AX
              {state === "ai_speaking" && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white">Alex — Senior Interviewer</p>
              <p className="text-xs text-slate-400">{company || "Top Tech Company"} · {role}</p>
            </div>
          </div>
          {state === "ai_speaking" && (
            <button type="button" onClick={stopTTS} className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-300 hover:text-white transition">
              <VolumeX className="h-3.5 w-3.5" /> Skip
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Type + category badge */}
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${TYPE_COLOR[currentQ.type] ?? "bg-slate-100 text-slate-600"}`}>
              {currentQ.type.replace("_", " ")}
            </span>
            {currentQ.category && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                {currentQ.category}
              </span>
            )}
          </div>

          {/* Question */}
          <p className="text-lg font-semibold text-slate-900 leading-snug">{currentQ.text}</p>

          {/* Hint */}
          {currentQ.hint && state !== "ai_speaking" && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
              <span className="text-sm">💡</span>
              <p className="text-xs text-amber-800">{currentQ.hint}</p>
            </div>
          )}

          {/* AI speaking indicator */}
          {state === "ai_speaking" && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
              <Volume2 className="h-4 w-4 text-brand-400 animate-pulse" />
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-1 rounded-full bg-brand-400 animate-bounce"
                    style={{ height: `${12 + (i % 3) * 8}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="text-sm text-slate-500">Alex is speaking…</span>
            </div>
          )}
        </div>
      </div>

      {/* Answer area */}
      {(state === "ready" || state === "recording" || state === "done_answer") && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Your Answer</span>
            </div>
            {state === "recording" && (
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="flex items-center gap-1 text-xs font-mono text-red-600">
                  <Timer className="h-3 w-3" />
                  {Math.floor(elapsed / 60).toString().padStart(2, "0")}:{(elapsed % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            {/* Live transcript */}
            <div className="min-h-[80px] rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 leading-relaxed">
              {transcript && <span>{transcript}</span>}
              {interimTranscript && <span className="text-slate-400 italic">{interimTranscript}</span>}
              {!transcript && !interimTranscript && (
                <span className="text-slate-300">
                  {state === "recording" ? "Listening… speak your answer" : speechSupported ? "Press Start Recording to begin" : "Type your answer below"}
                </span>
              )}
            </div>

            {/* Text fallback for non-supported browsers */}
            {!speechSupported && state === "recording" && (
              <textarea rows={4} value={transcript} onChange={(e) => setTranscript(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="Type your answer here…" autoFocus />
            )}

            {/* Filler word live counter */}
            {state === "recording" && transcript && (
              <div className="flex flex-wrap gap-2 text-xs">
                {detectFillers(transcript + interimTranscript).map((fw) => (
                  <span key={fw} className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 font-medium text-red-600">
                    "{fw}" detected
                  </span>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {state === "ready" && (
                <>
                  <Button onClick={startRecording} className="flex-1">
                    <Mic className="h-4 w-4" />
                    {speechSupported ? "Start Recording" : "Type Answer"}
                  </Button>
                  <button type="button" onClick={skipQuestion}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition">
                    Skip
                  </button>
                </>
              )}
              {state === "recording" && (
                <Button onClick={stopRecording} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                  <Square className="h-4 w-4" /> Stop Recording
                </Button>
              )}
              {state === "done_answer" && (
                <Button onClick={submitAnswer} className="flex-1">
                  <CheckCircle className="h-4 w-4" />
                  {currentIdx < questions.length - 1 ? "Submit & Next Question" : "Submit & See Report"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question navigator */}
      <div className="flex gap-1.5 flex-wrap">
        {questions.map((_, i) => (
          <div key={i} className={`h-2 w-6 rounded-full transition ${
            i < currentIdx ? "bg-green-400" : i === currentIdx ? "bg-brand-500" : "bg-slate-200"
          }`} />
        ))}
      </div>
    </div>
  );
}

// ── Report Card ───────────────────────────────────────────────────────────────

function ReportCard({ report, onRetry }: { report: Report; onRetry: () => void }) {
  const [openAnswer, setOpenAnswer] = useState<number | null>(0);
  const grade = GRADE_CONFIG[report.grade] ?? GRADE_CONFIG["C"];

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className={`overflow-hidden rounded-2xl border ${grade.bg} shadow-sm`}>
        <div className="p-6 text-center">
          <Trophy className={`mx-auto mb-2 h-10 w-10 ${grade.color}`} />
          <div className="flex items-center justify-center gap-3">
            <span className={`text-6xl font-extrabold ${grade.color}`}>{report.overallScore}</span>
            <div className="text-left">
              <p className={`text-2xl font-bold ${grade.color}`}>{report.grade}</p>
              <p className="text-sm text-slate-500">{grade.label}</p>
            </div>
          </div>
          <p className="mt-2 text-slate-600 font-medium">{report.headline}</p>
        </div>
      </div>

      {/* Competencies */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">Competency Scores</h3>
        <div className="space-y-3.5">
          {report.competencies.map((c, i) => (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                <span className={`text-sm font-bold ${c.score >= 80 ? "text-green-600" : c.score >= 65 ? "text-blue-600" : c.score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                  {c.score}
                </span>
              </div>
              <ScoreBar score={c.score} />
              <p className="mt-1 text-xs text-slate-500">{c.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filler word summary */}
      {report.fillerWordSummary && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold text-amber-700 mb-0.5">🗣️ Filler Words</p>
          <p className="text-sm text-amber-800">{report.fillerWordSummary}</p>
        </div>
      )}

      {/* Per-answer breakdown */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900">Answer-by-Answer Analysis</h3>
        {report.answers.map((ans, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={() => setOpenAnswer(openAnswer === i ? null : i)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  ans.score >= 75 ? "bg-green-100 text-green-700" : ans.score >= 55 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"
                }`}>{ans.score}</span>
                <p className="text-sm font-semibold text-slate-800 truncate">{ans.question}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {ans.pacing && (
                  <span className={`text-[11px] font-bold ${wpmLabel(0).color}`}>{ans.pacing}</span>
                )}
                {openAnswer === i ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {openAnswer === i && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-3">
                <ScoreBar score={ans.score} />

                {ans.strengths?.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-bold text-green-700 uppercase tracking-wide">Strengths</p>
                    <ul className="space-y-1">
                      {ans.strengths.map((s, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-sm text-slate-700">
                          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ans.improvements?.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-bold text-amber-700 uppercase tracking-wide">Improvements</p>
                    <ul className="space-y-1">
                      {ans.improvements.map((s, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-sm text-slate-700">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ans.modelAnswer && (
                  <div>
                    <p className="mb-1.5 text-xs font-bold text-brand-700 uppercase tracking-wide">Model Answer</p>
                    <p className="rounded-xl bg-brand-50 border border-brand-100 px-3 py-2.5 text-sm text-slate-700 leading-relaxed italic">
                      &ldquo;{ans.modelAnswer}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900">Overall Summary</h3>

        <div>
          <p className="mb-2 text-xs font-bold text-green-700 uppercase tracking-wide">Top Strengths</p>
          {report.summary.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <p className="text-sm text-slate-700">{s}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-red-600 uppercase tracking-wide">Areas to Improve</p>
          {report.summary.areasToImprove.map((s, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-sm text-slate-700">{s}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
          <p className="mb-2 text-xs font-bold text-brand-700 uppercase tracking-wide">Next Steps</p>
          {report.summary.nextSteps.map((s, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-200 text-[9px] font-bold text-brand-800">{i + 1}</span>
              <p className="text-sm text-slate-700">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onRetry} variant="outline" className="flex-1">
          <RotateCcw className="h-4 w-4" /> Start Another Interview
        </Button>
        <WhatsAppShareButton
          text={shareText.interview(report.overallScore, report.grade)}
          url={SITE_URL}
        />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function InterviewClient({
  plan, targetRole, sessionsToday,
  freeUsed = 0, freeLimit = 3, isPro = false,
}: {
  plan: string; targetRole: string; sessionsToday: number;
  freeUsed?: number; freeLimit?: number; isPro?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState<{ role: string; company: string; interviewType: string; level: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [usedCount, setUsedCount] = useState(freeUsed);
  const exhausted = !isPro && usedCount >= freeLimit;

  async function handleStart(cfg: { role: string; company: string; interviewType: string; level: string; count: number }) {
    setError(null);
    setConfig(cfg);
    setPhase("loading");
    try {
      const res = await fetch("/api/interview/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (res.status === 403 && data.error === "free_limit_reached") {
        setLimitReached(true);
        setPhase("setup");
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions ?? []);
      setUsedCount(c => c + 1);
      setPhase("interviewing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load questions.");
      setPhase("setup");
    }
  }

  async function handleComplete(answers: AnswerRecord[]) {
    setPhase("generating_report");
    try {
      const res = await fetch("/api/interview/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReport(data.report);
      setPhase("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate report.");
      setPhase("interviewing");
    }
  }

  function reset() {
    setPhase("setup");
    setQuestions([]);
    setReport(null);
    setConfig(null);
    setError(null);
    window.speechSynthesis?.cancel();
  }

  if (phase === "setup") return (
    <div className="space-y-4">
      {!isPro && (
        <PlanUsageBadge used={usedCount} limit={freeLimit} feature="mock interview" />
      )}
      {(exhausted || limitReached) && <UpgradeWall limit={freeLimit} feature="mock interview" />}
      {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      {!exhausted && !limitReached && (
        <SetupScreen targetRole={targetRole} onStart={handleStart} loading={false} />
      )}
    </div>
  );

  if (phase === "loading") return (
    <div className="flex flex-col items-center gap-4 py-24">
      <Loader2 className="h-10 w-10 animate-spin text-brand-400" />
      <p className="font-semibold text-slate-700">Building your question bank…</p>
      <p className="text-sm text-slate-400">{config?.company ? `Tailored for ${config.company} · ` : ""}{config?.role} · {config?.level} level</p>
    </div>
  );

  if (phase === "interviewing" && questions.length > 0) return (
    <div>
      {error && <p className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      <InterviewScreen questions={questions} role={config?.role ?? ""} company={config?.company ?? ""} onComplete={handleComplete} />
    </div>
  );

  if (phase === "generating_report") return (
    <div className="flex flex-col items-center gap-4 py-24">
      <Loader2 className="h-10 w-10 animate-spin text-brand-400" />
      <p className="font-semibold text-slate-700">Generating your interview report card…</p>
      <p className="text-sm text-slate-400">Analysing transcripts, scoring competencies, writing model answers…</p>
    </div>
  );

  if (phase === "report" && report) return <ReportCard report={report} onRetry={reset} />;

  return null;
}
