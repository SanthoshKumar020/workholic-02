"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ResumeUpload } from "@/components/ui/ResumeUpload";
import { AlertCircle, CheckCircle, Zap, Copy, Check } from "lucide-react";

interface Section { name: string; score: number; feedback: string; }
interface CriticalFix { priority: number; fix: string; impact: string; }
interface ScanResult {
  callbackLikelihood: number;
  grade: string;
  sixSecondVerdict: string;
  sections: Section[];
  keywordGaps: string[];
  criticalFixes: CriticalFix[];
  quickWins: string[];
}

const GRADE_COLOR: Record<string, string> = {
  A: "text-green-600", B: "text-blue-600", C: "text-amber-600", D: "text-orange-600", F: "text-red-600",
};
const LIKELIHOOD_COLOR = (n: number) =>
  n >= 75 ? "text-green-600" : n >= 50 ? "text-blue-600" : n >= 30 ? "text-amber-600" : "text-red-600";
const LIKELIHOOD_RING = (n: number) =>
  n >= 75 ? "ring-green-400" : n >= 50 ? "ring-blue-400" : n >= 30 ? "ring-amber-400" : "ring-red-400";
const SCORE_BAR = (s: number) =>
  s >= 80 ? "bg-green-500" : s >= 65 ? "bg-blue-500" : s >= 50 ? "bg-amber-500" : "bg-red-400";
const IMPACT_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return { copied, copy };
}

export function RecruiterScanClient() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  async function runScan() {
    if (!resumeText.trim() || !jobDescription.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recruiter-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Input form */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Upload resume + paste job description</h3>
          <p className="text-sm text-slate-500">AI simulates a recruiter reading your resume against this specific role</p>
        </div>
        <div className="p-5 space-y-4">
          <ResumeUpload label="Your Resume (PDF, DOCX, or TXT)" value={resumeText} onChange={setResumeText} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Job Description (paste the full JD)</label>
            <textarea rows={8} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description — responsibilities, requirements, tech stack, company description…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none" />
          </div>
          {error && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button onClick={runScan} loading={loading} disabled={!resumeText.trim() || !jobDescription.trim()} className="w-full" size="lg">
            <Zap className="h-4 w-4" />
            {loading ? "Scanning resume…" : "Run 6-Second Recruiter Scan"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Score banner */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              {/* Callback likelihood ring */}
              <div className={`flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full ring-4 ${LIKELIHOOD_RING(result.callbackLikelihood)} bg-white`}>
                <span className={`text-3xl font-extrabold ${LIKELIHOOD_COLOR(result.callbackLikelihood)}`}>
                  {result.callbackLikelihood}%
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">callback</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-4xl font-extrabold ${GRADE_COLOR[result.grade] ?? "text-slate-500"}`}>
                    {result.grade}
                  </span>
                  <span className="text-lg font-semibold text-slate-700">
                    {result.callbackLikelihood >= 75 ? "Strong fit" : result.callbackLikelihood >= 50 ? "Moderate fit" : result.callbackLikelihood >= 30 ? "Weak fit" : "Poor fit"}
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                  <span className="text-base">👁️</span>
                  <p className="text-sm italic text-slate-700">&ldquo;{result.sixSecondVerdict}&rdquo;</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section scores */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Section-by-Section Breakdown</h3>
            <div className="space-y-4">
              {result.sections.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">{s.name}</span>
                    <span className={`text-sm font-bold ${s.score >= 80 ? "text-green-600" : s.score >= 60 ? "text-blue-600" : s.score >= 40 ? "text-amber-600" : "text-red-500"}`}>{s.score}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${SCORE_BAR(s.score)} transition-all`} style={{ width: `${s.score}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{s.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Two columns: keywords + fixes */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Keyword gaps */}
            <div className="overflow-hidden rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
              <h3 className="mb-3 font-bold text-red-700">❌ Missing Keywords</h3>
              <p className="mb-3 text-xs text-red-600">These terms appear in the JD but not your resume</p>
              <div className="flex flex-wrap gap-2">
                {result.keywordGaps.map((kw) => (
                  <span key={kw} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick wins */}
            <div className="overflow-hidden rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <h3 className="mb-3 font-bold text-green-700">⚡ Quick Wins</h3>
              <p className="mb-3 text-xs text-green-600">Changes you can make in 5 minutes</p>
              <ul className="space-y-2">
                {result.quickWins.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Critical fixes */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Critical Fixes (Prioritised)</h3>
              <button type="button" onClick={() => copy(result.criticalFixes.map((f, i) => `${i + 1}. ${f.fix}`).join("\n"))}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy all"}
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {result.criticalFixes.map((f) => (
                <div key={f.priority} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {f.priority}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{f.fix}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${IMPACT_COLOR[f.impact] ?? IMPACT_COLOR.low}`}>
                    {f.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" onClick={() => setResult(null)} className="w-full">
            <AlertCircle className="h-4 w-4" /> Scan Another Resume
          </Button>
        </div>
      )}
    </div>
  );
}
