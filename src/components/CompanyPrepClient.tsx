"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft, Search, ChevronRight, ChevronDown, ChevronUp,
  BookOpen, Code2, Brain, Users, Lightbulb, Eye, EyeOff, Copy, Check,
} from "lucide-react";
import {
  COMPANIES, DIFFICULTY_COLOR, STEP_TYPE_COLOR,
  type CompanyData, type ProcessStep, type Category,
} from "@/lib/company-data";

const STEP_LABEL: Record<ProcessStep["type"], string> = {
  screening:     "Screening",
  dsa:           "Coding / DSA",
  system_design: "System Design",
  behavioral:    "Behavioral",
  hr:            "HR",
  mixed:         "Mixed",
};

interface DSAQuestion {
  question: string; difficulty: string; topic: string;
  frequency: string; hint: string;
  answer?: string; answerExplanation?: string;
}
interface SDQuestion {
  question: string; category: string; hint: string;
  keyComponents?: string[]; designApproach?: string;
}
interface BehavQuestion {
  question: string; principle: string; starTip: string;
  sampleAnswer?: string;
}
interface HRQuestion {
  question: string; answer?: string;
}

interface QuestionBank {
  dsaQuestions: DSAQuestion[];
  systemDesign: SDQuestion[];
  behavioral: BehavQuestion[];
  hrQuestions: HRQuestion[] | string[];
}

const FREQ_COLOR: Record<string, string> = {
  high:   "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-slate-100 text-slate-600",
};
const DIFF_COLOR: Record<string, string> = {
  easy:   "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard:   "bg-red-100 text-red-700",
};

type QTab = "dsa" | "system_design" | "behavioral" | "hr";
const Q_TABS: { id: QTab; label: string; icon: React.ReactNode }[] = [
  { id: "dsa",           label: "DSA Coding",    icon: <Code2 className="h-4 w-4" /> },
  { id: "system_design", label: "System Design",  icon: <Brain className="h-4 w-4" /> },
  { id: "behavioral",    label: "Behavioral",     icon: <Users className="h-4 w-4" /> },
  { id: "hr",            label: "HR Questions",   icon: <BookOpen className="h-4 w-4" /> },
];

function CopyCodeBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button"
      onClick={() => { navigator.clipboard.writeText(text.replace(/\\n/g, "\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 rounded-md border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-100 transition">
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function AnswerReveal({ children, label = "Show Answer" }: { children: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition ${
          open ? "border-green-300 bg-green-50 text-green-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        }`}>
        {open ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {open ? "Hide Answer" : label}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

export function CompanyPrepClient() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [selected, setSelected] = useState<CompanyData | null>(null);
  const [detailTab, setDetailTab] = useState<"process" | "questions" | "tips">("process");
  const [qTab, setQTab] = useState<QTab>("dsa");
  const [level, setLevel] = useState("SDE II");
  const [questions, setQuestions] = useState<QuestionBank | null>(null);
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState<string | null>(null);

  const categories: (Category | "all")[] = ["all", "FAANG", "Indian Product", "IT Services"];

  const filtered = COMPANIES.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || c.category === category;
    return matchSearch && matchCat;
  });

  async function loadQuestions() {
    if (!selected) return;
    setQLoading(true);
    setQError(null);
    try {
      const res = await fetch("/api/company-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: selected.name, level }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setQuestions(d);
    } catch (e) {
      setQError(e instanceof Error ? e.message : "Could not load questions.");
    } finally {
      setQLoading(false);
    }
  }

  // ── GRID ──────────────────────────────────────────────────────────────────

  if (!selected) return (
    <div className="space-y-5">
      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.map((cat) => (
            <button key={cat} type="button" onClick={() => setCategory(cat)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                category === cat
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}>
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} companies · click any to see interview prep</p>

      {/* Company grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((company) => (
          <button key={company.id} type="button"
            onClick={() => { setSelected(company); setDetailTab("process"); setQuestions(null); setQError(null); }}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl border border-slate-100">
                {company.emoji}
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-400 transition mt-1" />
            </div>
            <p className="font-bold text-slate-900">{company.name}</p>
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{company.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${DIFFICULTY_COLOR[company.difficulty]}`}>
                {company.difficulty}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {company.avgRounds} rounds
              </span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                {company.prepWeeks} prep
              </span>
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-400">{company.avgSalary}</p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <p className="text-slate-400">No companies match &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );

  // ── DETAIL ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Back + company header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <button type="button" onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition">
            <ArrowLeft className="h-4 w-4" /> All Companies
          </button>
        </div>
        <div className="px-5 py-5 flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-3xl border border-slate-100 shrink-0">
            {selected.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900">{selected.name}</h2>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${DIFFICULTY_COLOR[selected.difficulty]}`}>
                {selected.difficulty}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{selected.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <span><span className="font-bold text-slate-700">{selected.avgRounds}</span> interview rounds</span>
              <span><span className="font-bold text-slate-700">{selected.prepWeeks}</span> recommended prep</span>
              <span className="font-semibold text-slate-600">{selected.avgSalary}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {selected.hiringFor.map((r) => (
                <span key={r} className="rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
        {(["process", "questions", "tips"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setDetailTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition capitalize ${
              detailTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}>
            {t === "process" ? "📋 Process" : t === "questions" ? "❓ Questions" : "💡 Tips"}
          </button>
        ))}
      </div>

      {/* ── Process tab ─────────────────────────────────────────────────────── */}
      {detailTab === "process" && (
        <div className="space-y-3">
          {selected.interviewProcess.map((step, idx) => (
            <div key={step.step}>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">{step.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STEP_TYPE_COLOR[step.type]}`}>
                        {STEP_LABEL[step.type]}
                      </span>
                      <span className="text-xs text-slate-400">{step.duration}</span>
                    </div>
                    <p className="text-xs font-semibold text-brand-600 mb-1">Focus: {step.focus}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.what}</p>
                  </div>
                </div>
              </div>
              {idx < selected.interviewProcess.length - 1 && (
                <div className="ml-[2.75rem] border-l-2 border-dashed border-slate-200 h-4" />
              )}
            </div>
          ))}

          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <h3 className="mb-2 font-bold text-blue-800">Culture & Values</h3>
            <p className="mb-3 text-sm text-blue-700 leading-relaxed">{selected.culture}</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.values.map((v) => (
                <span key={v} className="rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-blue-700">{v}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Questions tab ───────────────────────────────────────────────────── */}
      {detailTab === "questions" && (
        <div className="space-y-4">
          {!questions && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-brand-50 text-3xl">❓</div>
              <div>
                <h3 className="font-bold text-slate-900">Load {selected.name} Question Bank</h3>
                <p className="mt-1 text-sm text-slate-500">
                  AI generates DSA, System Design, Behavioral and HR questions with answers — sourced from real {selected.name} interviews.
                </p>
              </div>

              {/* Level selector */}
              <div className="flex justify-center gap-2 flex-wrap">
                {["Fresher", "SDE I", "SDE II", "Senior", "Staff"].map((l) => (
                  <button key={l} type="button" onClick={() => setLevel(l)}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                      level === l ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}>{l}</button>
                ))}
              </div>

              {qError && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{qError}</p>}

              <Button onClick={loadQuestions} loading={qLoading} className="w-full" size="lg">
                {qLoading ? `Generating ${selected.name} questions with answers…` : `Load ${level} Questions + Answers`}
              </Button>

              <p className="text-xs text-slate-400">
                Questions from Glassdoor, Blind, LeetCode Discuss, GeeksForGeeks experiences · Answers AI-generated
              </p>
            </div>
          )}

          {questions && (
            <div className="space-y-4">
              {/* Level + reload */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">{level}</span>
                  <span className="text-sm text-slate-500">{selected.name} · {questions.dsaQuestions?.length ?? 0} DSA · {questions.systemDesign?.length ?? 0} SD · {questions.behavioral?.length ?? 0} Behavioral</span>
                </div>
                <button type="button" onClick={() => { setQuestions(null); setQError(null); }}
                  className="text-xs text-slate-400 hover:text-slate-700 underline transition">Change level</button>
              </div>

              {/* Q sub-tabs */}
              <div className="flex gap-1 flex-wrap">
                {Q_TABS.map((t) => (
                  <button key={t.id} type="button" onClick={() => setQTab(t.id)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      qTab === t.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* DSA ──────────────────────────────────────────── */}
              {qTab === "dsa" && (
                <div className="space-y-3">
                  {questions.dsaQuestions.map((q, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-slate-900 flex-1 min-w-0">{q.question}</p>
                        <div className="flex gap-1.5 shrink-0">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIFF_COLOR[q.difficulty] ?? DIFF_COLOR.medium}`}>{q.difficulty}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${FREQ_COLOR[q.frequency] ?? FREQ_COLOR.low}`}>{q.frequency} freq</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">{q.topic}</span>
                        {q.hint && (
                          <span className="flex items-center gap-1 text-xs text-amber-700">
                            <Lightbulb className="h-3 w-3" /> {q.hint}
                          </span>
                        )}
                      </div>
                      {q.answer && (
                        <AnswerReveal label="Show Solution">
                          <div className="overflow-hidden rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between bg-slate-900 px-3 py-2">
                              <span className="text-[11px] font-bold text-slate-300">Python Solution</span>
                              <CopyCodeBtn text={q.answer} />
                            </div>
                            <pre className="bg-slate-950 px-4 py-3 font-mono text-xs text-green-400 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                              {q.answer.replace(/\\n/g, "\n")}
                            </pre>
                          </div>
                          {q.answerExplanation && (
                            <div className="mt-2 rounded-xl border border-green-100 bg-green-50 px-3 py-2.5">
                              <p className="text-xs font-bold text-green-700 mb-1">Explanation</p>
                              <p className="text-xs text-slate-700 leading-relaxed">{q.answerExplanation}</p>
                            </div>
                          )}
                        </AnswerReveal>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* System Design ────────────────────────────────── */}
              {qTab === "system_design" && (
                <div className="space-y-3">
                  {questions.systemDesign.map((q, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-slate-900 flex-1">{q.question}</p>
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 shrink-0">{q.category}</span>
                      </div>
                      {q.hint && (
                        <div className="flex items-start gap-1.5 text-xs text-purple-700 mb-2">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {q.hint}
                        </div>
                      )}
                      <AnswerReveal label="Show Design Approach">
                        <div className="space-y-2">
                          {q.keyComponents && q.keyComponents.length > 0 && (
                            <div className="rounded-xl border border-purple-200 bg-white p-3">
                              <p className="text-[10px] font-bold text-purple-600 uppercase mb-1.5">Key Components</p>
                              <div className="flex flex-wrap gap-1.5">
                                {q.keyComponents.map((c, ci) => (
                                  <span key={ci} className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-xs font-semibold text-purple-800">{c}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {q.designApproach && (
                            <div className="rounded-xl border border-purple-200 bg-white p-3">
                              <p className="text-[10px] font-bold text-purple-600 uppercase mb-1.5">Design Approach</p>
                              <p className="text-xs text-slate-700 leading-relaxed">{q.designApproach}</p>
                            </div>
                          )}
                        </div>
                      </AnswerReveal>
                    </div>
                  ))}
                </div>
              )}

              {/* Behavioral ───────────────────────────────────── */}
              {qTab === "behavioral" && (
                <div className="space-y-3">
                  {questions.behavioral.map((q, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
                      <p className="font-semibold text-slate-900 mb-1.5">{q.question}</p>
                      <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 mb-2">{q.principle}</span>
                      {q.starTip && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-800 mb-2">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" /> {q.starTip}
                        </div>
                      )}
                      {q.sampleAnswer && (
                        <AnswerReveal label="Show Sample STAR Answer">
                          <div className="rounded-xl border border-amber-200 bg-white px-3 py-3">
                            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1.5">Sample STAR Answer</p>
                            <p className="text-xs text-slate-700 leading-relaxed italic">{q.sampleAnswer}</p>
                          </div>
                        </AnswerReveal>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* HR ───────────────────────────────────────────── */}
              {qTab === "hr" && (
                <div className="space-y-2">
                  {questions.hrQuestions.map((q, i) => {
                    const isObj = typeof q === "object" && q !== null;
                    const questionText = isObj ? (q as HRQuestion).question : (q as string);
                    const answerText   = isObj ? (q as HRQuestion).answer   : undefined;
                    return (
                      <div key={i} className="overflow-hidden rounded-xl border border-green-100 bg-green-50 px-4 py-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-[11px] font-bold text-green-700 mt-0.5">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-800 font-semibold">{questionText}</p>
                            {answerText && (
                              <AnswerReveal label="Show Ideal Answer">
                                <div className="rounded-xl border border-green-200 bg-white px-3 py-2.5">
                                  <p className="text-xs text-slate-700 leading-relaxed">{answerText}</p>
                                </div>
                              </AnswerReveal>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tips tab ────────────────────────────────────────────────────────── */}
      {detailTab === "tips" && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Top tips for {selected.name}</h3>
            <ol className="space-y-3">
              {selected.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
                  <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{tip}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
            <h3 className="mb-3 font-bold text-slate-700 text-sm">Roles hiring for</h3>
            <div className="flex flex-wrap gap-2">
              {selected.hiringFor.map((r) => (
                <span key={r} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{r}</span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <h3 className="mb-2 font-bold text-blue-800">Culture</h3>
            <p className="mb-3 text-sm text-blue-700">{selected.culture}</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.values.map((v) => (
                <span key={v} className="rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-blue-700">{v}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
