"use client";
import { useState, useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Mic, MicOff, Send, RefreshCw } from "lucide-react";
import type { ChatMessage, EnglishLesson, EnglishQuizQuestion } from "@/lib/types";
import { PlanUsageBadge, UpgradeWall } from "@/components/ui/PlanUsageBadge";

const LEVELS = ["beginner", "intermediate", "advanced"];
const TOPICS = [
  "Business meetings",
  "Email writing",
  "Job interviews",
  "Presentations",
  "Negotiation",
  "Small talk",
  "Technical writing",
  "Leadership communication",
];

interface QuizState {
  questions: EnglishQuizQuestion[];
  answers: Record<number, number>;
  submitted: boolean;
}

export function EnglishClient({
  plan, preferredLanguage: _lang,
  freeUsed = 0, freeLimit = 5, isPro = false,
}: {
  plan: string; preferredLanguage: string;
  freeUsed?: number; freeLimit?: number; isPro?: boolean;
}) {
  const [level, setLevel] = useState("intermediate");
  const [topic, setTopic] = useState(TOPICS[0]);

  // Lesson state
  const [lesson, setLesson] = useState<EnglishLesson | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);

  // Quiz state
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [usedCount, setUsedCount] = useState(freeUsed);
  const exhausted = !isPro && usedCount >= freeLimit;

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (SpeechRec) {
      setVoiceSupported(true);
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e: SpeechRecognitionEvent) => {
        setChatInput(e.results[0][0].transcript);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadLesson() {
    setLoadingLesson(true);
    try {
      const res = await fetch("/api/english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "lesson", level, topic }),
      });
      const data = await res.json();
      if (res.status === 403 && data.error === "free_limit_reached") { setLimitReached(true); return; }
      setLesson(data.lesson || null);
      setUsedCount(c => c + 1);
    } catch {
      setLesson(null);
    } finally {
      setLoadingLesson(false);
    }
  }

  async function loadQuiz() {
    setLoadingQuiz(true);
    try {
      const res = await fetch("/api/english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "quiz", level, topic }),
      });
      const data = await res.json();
      if (res.status === 403 && data.error === "free_limit_reached") { setLimitReached(true); return; }
      const q: EnglishQuizQuestion[] = Array.isArray(data.quiz?.questions) ? data.quiz.questions : [];
      setQuiz({ questions: q, answers: {}, submitted: false });
      setUsedCount(c => c + 1);
    } catch {
      setQuiz(null);
    } finally {
      setLoadingQuiz(false);
    }
  }

  async function sendChat() {
    const msg = chatInput.trim();
    if (!msg) return;
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setChatInput("");
    setLoadingChat(true);
    try {
      const res = await fetch("/api/english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat", level, userMessage: msg, history: messages.slice(-10) }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || "..." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't respond. Please try again." }]);
    } finally {
      setLoadingChat(false);
    }
  }

  const quizScore = quiz?.submitted
    ? quiz.questions.filter((q, i) => quiz.answers[i] === q.answerIndex).length
    : 0;

  return (
    <div className="space-y-6">
      {!isPro && (
        <PlanUsageBadge used={usedCount} limit={freeLimit} feature="english learning" />
      )}
      {limitReached && <UpgradeWall limit={freeLimit} feature="english learning" />}
      {/* Level + Topic selectors */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Your Level</label>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => setLevel(l)}
                className={`rounded-lg border px-4 py-1.5 text-sm font-medium capitalize transition ${level === l ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Topic</label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button key={t} onClick={() => setTopic(t)}
                className={`rounded-lg border px-3 py-1 text-sm font-medium transition ${topic === t ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="lesson">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="lesson">Lesson</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="chat">
            AI Chat {plan !== "pro" && <Badge variant="warning" className="ml-1 text-[10px]">Pro</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* LESSON TAB */}
        <TabsContent value="lesson">
          <div className="space-y-4">
            <Button onClick={loadLesson} loading={loadingLesson} disabled={exhausted || limitReached} variant="outline">
              {lesson ? <><RefreshCw className="h-4 w-4" /> New lesson</> : "Load lesson"}
            </Button>
            {lesson && (
              <div className="animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-slate-900">{lesson.title}</h2>
                <p className="text-slate-700 leading-relaxed">{lesson.content}</p>
                {lesson.keyPoints?.length > 0 && (
                  <div>
                    <p className="font-semibold text-slate-800 mb-2">Key Points</p>
                    <ul className="space-y-1.5">
                      {lesson.keyPoints.map((p, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-brand-500">→</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {lesson.examples?.length > 0 && (
                  <div>
                    <p className="font-semibold text-slate-800 mb-2">Examples</p>
                    <ul className="space-y-2">
                      {lesson.examples.map((ex, i) => (
                        <li key={i} className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800 italic border border-brand-100">
                          &ldquo;{ex}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* QUIZ TAB */}
        <TabsContent value="quiz">
          <div className="space-y-4">
            <Button onClick={loadQuiz} loading={loadingQuiz} disabled={exhausted || limitReached} variant="outline">
              {quiz ? <><RefreshCw className="h-4 w-4" /> New quiz</> : "Start quiz"}
            </Button>
            {quiz && (
              <div className="space-y-4">
                {quiz.submitted && (
                  <div className={`rounded-xl p-4 text-center font-bold text-lg ${quizScore >= 4 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {quizScore}/{quiz.questions.length} correct {quizScore >= 4 ? "🎉" : "— keep practicing!"}
                  </div>
                )}
                {quiz.questions.map((q, qi) => (
                  <div key={qi} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="mb-3 font-medium text-slate-900">{qi + 1}. {q.q}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        let cls = "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
                        if (quiz.submitted) {
                          if (oi === q.answerIndex) cls = "border-emerald-400 bg-emerald-50 text-emerald-800";
                          else if (quiz.answers[qi] === oi) cls = "border-red-300 bg-red-50 text-red-700";
                        } else if (quiz.answers[qi] === oi) {
                          cls = "border-brand-500 bg-brand-50 text-brand-700";
                        }
                        return (
                          <button key={oi} disabled={quiz.submitted}
                            onClick={() => setQuiz({ ...quiz, answers: { ...quiz.answers, [qi]: oi } })}
                            className={`w-full rounded-lg border p-3 text-left text-sm font-medium transition ${cls}`}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quiz.submitted && q.explanation && (
                      <p className="mt-3 text-xs text-slate-500 italic">💡 {q.explanation}</p>
                    )}
                  </div>
                ))}
                {!quiz.submitted && (
                  <Button onClick={() => setQuiz({ ...quiz, submitted: true })} disabled={Object.keys(quiz.answers).length < quiz.questions.length}>
                    Submit Quiz
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* CHAT TAB */}
        <TabsContent value="chat">
          {plan !== "pro" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="font-semibold text-amber-900">AI conversation practice is a Pro feature</p>
              <a href="/billing" className="mt-3 inline-block rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white">Upgrade to Pro</a>
            </div>
          ) : (
            <div className="flex h-[480px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center text-center text-slate-400 text-sm">
                    <p>Start a conversation in English!<br />I&apos;ll gently correct any mistakes.</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-slate-100 px-4 py-2.5">
                      <span className="flex gap-1"><span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:"0ms"}} /><span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:"150ms"}} /><span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:"300ms"}} /></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-slate-200 p-3 flex gap-2">
                {voiceSupported && (
                  <button onClick={() => { if (isListening) { recognitionRef.current?.stop(); setIsListening(false); } else { recognitionRef.current?.start(); setIsListening(true); } }}
                    className={`rounded-lg border p-2 transition ${isListening ? "border-red-300 bg-red-50 text-red-600" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                )}
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder="Type in English..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
                <Button onClick={sendChat} disabled={!chatInput.trim() || loadingChat} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
