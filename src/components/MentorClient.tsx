"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, Send, Brain, CalendarDays, Upload, FileText, X, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface Message { id: string; role: "user" | "assistant"; content: string; created_at: string; }
interface Memory {
  target_role?: string;
  resume_text?: string;
  weekly_plan?: string;
  plan_generated_at?: string;
  context_summary?: string;
}
interface WeeklyPlan {
  weekFocus: string;
  days: { day: string; tasks: string[] }[];
  weekendChallenge: string;
  metrics: string[];
  resources: { title: string; type: string; why: string }[];
}

interface Props {
  initialMemory: Memory | null;
  initialMessages: Message[];
  profileName: string;
  profileTargetRole: string;
}

const RESOURCE_COLOR: Record<string, string> = {
  article: "bg-blue-50 text-blue-700 border-blue-200",
  video: "bg-red-50 text-red-700 border-red-200",
  practice: "bg-green-50 text-green-700 border-green-200",
  book: "bg-amber-50 text-amber-700 border-amber-200",
};

function WeeklyPlanView({ plan }: { plan: WeeklyPlan }) {
  const [openDays, setOpenDays] = useState<Set<string>>(new Set(["Monday"]));
  function toggle(day: string) {
    setOpenDays((s) => { const n = new Set(s); n.has(day) ? n.delete(day) : n.add(day); return n; });
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-1">This Week&apos;s Focus</p>
        <p className="font-semibold text-brand-900">{plan.weekFocus}</p>
      </div>

      <div className="space-y-1.5">
        {(plan.days ?? []).map((d) => (
          <div key={d.day} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button type="button" onClick={() => toggle(d.day)}
              className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition">
              <span className="text-sm font-semibold text-slate-800">{d.day}</span>
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{d.tasks.length} tasks</span>
                {openDays.has(d.day) ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </span>
            </button>
            {openDays.has(d.day) && (
              <ul className="border-t border-slate-100 px-4 pb-3 pt-2 space-y-1.5">
                {d.tasks.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />{t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {plan.weekendChallenge && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
          <p className="text-xs font-bold text-purple-700 mb-1">🎯 Weekend Challenge</p>
          <p className="text-sm text-purple-900">{plan.weekendChallenge}</p>
        </div>
      )}

      {(plan.resources ?? []).length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Resources this week</p>
          <div className="space-y-2">
            {plan.resources.map((r, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize ${RESOURCE_COLOR[r.type] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  {r.type}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(plan.metrics ?? []).length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-xs font-bold text-green-700 mb-1.5">📊 How to measure success</p>
          <ul className="space-y-1">
            {plan.metrics.map((m, i) => (
              <li key={i} className="flex items-center gap-1.5 text-sm text-green-800">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />{m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function MentorClient({ initialMemory, initialMessages, profileName, profileTargetRole }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"chat" | "plan" | "memory">("chat");

  // Memory state
  const [memory, setMemory] = useState<Memory>(initialMemory ?? {});
  const [targetRole, setTargetRole] = useState(initialMemory?.target_role ?? profileTargetRole);
  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState(initialMemory?.resume_text ?? "");
  const [uploading, setUploading] = useState(false);
  const [savingMemory, setSavingMemory] = useState(false);

  // Weekly plan state
  const [plan, setPlan] = useState<WeeklyPlan | null>(() => {
    if (initialMemory?.weekly_plan) {
      try { return JSON.parse(initialMemory.weekly_plan); } catch { return null; }
    }
    return null;
  });
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function parseFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) { setResumeText(data.text ?? ""); setResumeFile(file.name); }
    } finally { setUploading(false); }
  }

  async function saveMemory() {
    setSavingMemory(true);
    await fetch("/api/mentor/memory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_role: targetRole, resume_text: resumeText }),
    });
    setMemory((m) => ({ ...m, target_role: targetRole, resume_text: resumeText }));
    setSavingMemory(false);
  }

  async function generatePlan() {
    setGeneratingPlan(true);
    try {
      const res = await fetch("/api/mentor/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_role: targetRole, resume_text: resumeText, context_summary: memory.context_summary }),
      });
      const data = await res.json();
      if (res.ok) { setPlan(data.plan); setTab("plan"); }
    } finally { setGeneratingPlan(false); }
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const msg = input.trim();
    if (!msg || sending) return;
    const tempId = `temp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content: msg, created_at: new Date().toISOString() }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, { id: `ai-${Date.now()}`, role: "assistant", content: data.message, created_at: new Date().toISOString() }]);
      }
    } finally { setSending(false); }
  }

  const TABS = [
    { key: "chat", label: "💬 Chat" },
    { key: "plan", label: "📅 Weekly Plan" },
    { key: "memory", label: "🧠 My Info" },
  ] as const;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* Left panel */}
      <div className="w-full lg:w-72 shrink-0 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Hi, {profileName}!</p>
              <p className="text-xs text-slate-400">Your AI Career Mentor</p>
            </div>
          </div>
          {memory.context_summary && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-xs font-bold text-slate-400 mb-1">What I know about you</p>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{memory.context_summary}</p>
            </div>
          )}
          {memory.plan_generated_at && (
            <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Plan generated {new Date(memory.plan_generated_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <Button onClick={generatePlan} loading={generatingPlan} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4" />
          {plan ? "Refresh Weekly Plan" : "Generate Weekly Plan"}
        </Button>
      </div>

      {/* Main panel */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-semibold transition ${tab === t.key ? "border-b-2 border-brand-500 text-brand-700" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Chat tab */}
        {tab === "chat" && (
          <div className="flex flex-col" style={{ height: "520px" }}>
            <div className="flex-1 overflow-y-auto space-y-4 p-5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Brain className="h-10 w-10 text-slate-200" />
                  <p className="text-slate-400 text-sm">
                    Start by telling me about your career goal, your background, or what you&apos;re struggling with.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {["What should I focus on this week?", "Review my job search strategy", "Help me prepare for interviews"].map((s) => (
                      <button key={s} type="button" onClick={() => { setInput(s); }} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-600 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                    <span className="text-xs text-slate-400">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-100 p-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder="Ask your mentor anything…"
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                style={{ maxHeight: "120px" }}
              />
              <Button type="submit" loading={sending} disabled={!input.trim()} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {/* Weekly Plan tab */}
        {tab === "plan" && (
          <div className="p-5 overflow-y-auto" style={{ maxHeight: "520px" }}>
            {!plan ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <CalendarDays className="h-10 w-10 text-slate-200" />
                <p className="text-slate-400 text-sm">No weekly plan yet. Add your info in the &ldquo;My Info&rdquo; tab then generate your plan.</p>
                <Button onClick={generatePlan} loading={generatingPlan}>
                  Generate My Weekly Plan
                </Button>
              </div>
            ) : (
              <WeeklyPlanView plan={plan} />
            )}
          </div>
        )}

        {/* Memory / My Info tab */}
        {tab === "memory" && (
          <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: "520px" }}>
            <p className="text-sm text-slate-500">This info is used to personalize your chat and weekly plan. The more you share, the better the advice.</p>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Target Role</label>
              <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="e.g. Software Engineer at a product startup" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Resume</label>
              {!resumeFile ? (
                <div onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 hover:border-brand-300 hover:bg-brand-50/50 transition">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin text-brand-400" /> : <Upload className="h-6 w-6 text-slate-300" />}
                  <p className="text-sm text-slate-500">{uploading ? "Parsing…" : "Upload resume (PDF, DOCX, TXT)"}</p>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
                    onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])} />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2">
                    <FileText className="h-4 w-4 text-brand-600" />
                    <span className="flex-1 text-sm font-medium text-brand-800 truncate">{resumeFile}</span>
                    <button type="button" onClick={() => { setResumeFile(null); setResumeText(""); }}><X className="h-4 w-4 text-slate-400 hover:text-red-500" /></button>
                  </div>
                  <textarea rows={5} value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 font-mono focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    placeholder="Parsed resume text (editable)" />
                </div>
              )}
            </div>

            <Button onClick={saveMemory} loading={savingMemory} className="w-full">
              Save & Update Mentor Memory
            </Button>
            <p className="text-xs text-slate-400 text-center">After saving, generate or refresh your weekly plan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
