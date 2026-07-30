"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { ResumeUpload } from "@/components/ui/ResumeUpload";
import { Copy, Check, FileText, Mail, ArrowRight, RotateCcw } from "lucide-react";

const ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Scientist", "ML Engineer", "DevOps Engineer", "Product Manager", "UI/UX Designer",
  "Data Analyst", "QA Engineer", "Solutions Architect", "Business Analyst",
];

interface ExperienceTailoring { jobTitle: string; tailoredBullets: string[]; }
interface ResumeResult {
  fitScore: number; tailoredFitScore: number; tailoredSummary: string;
  experienceTailoring: ExperienceTailoring[];
  skillsToHighlight: string[]; keywordsToAdd: string[]; tips: string[];
}
interface CoverResult { subject: string; coverLetter: string; highlights: string[]; tips: string[]; }

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button type="button" onClick={copy}
      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50 transition">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function FitBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className={`font-bold ${color}`}>{score}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full transition-all ${score >= 75 ? "bg-green-500" : score >= 55 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function TailorClient({ targetRole }: { targetRole: string }) {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState(targetRole);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"resume" | "cover">("resume");
  const [loadingResume, setLoadingResume] = useState(false);
  const [loadingCover, setLoadingCover] = useState(false);
  const [resumeResult, setResumeResult] = useState<ResumeResult | null>(null);
  const [coverResult, setCoverResult] = useState<CoverResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(action: "resume" | "cover_letter") {
    if (!resumeText.trim() || !jobDescription.trim()) return;
    setError(null);
    if (action === "resume") setLoadingResume(true); else setLoadingCover(true);
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, companyName, role, action }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      if (action === "resume") { setResumeResult(d); setActiveTab("resume"); }
      else { setCoverResult(d); setActiveTab("cover"); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      if (action === "resume") setLoadingResume(false); else setLoadingCover(false);
    }
  }

  const hasResult = resumeResult || coverResult;

  return (
    <div className="space-y-5">
      {/* Input form */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Upload Resume + Target Posting</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Company Name</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Google, Flipkart…"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
            </div>
            <Combobox label="Role" placeholder="e.g. Software Engineer" options={ROLES} value={role} onChange={setRole} allowCustom />
          </div>
          <ResumeUpload label="Your Resume (PDF, DOCX, or TXT)" value={resumeText} onChange={setResumeText} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Job Description (paste the full JD)</label>
            <textarea rows={7} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job posting — responsibilities, requirements, tech stack…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none" />
          </div>
          {error && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={() => generate("resume")} loading={loadingResume} disabled={!resumeText.trim() || !jobDescription.trim()} className="flex-1">
              <FileText className="h-4 w-4" />
              {loadingResume ? "Tailoring resume…" : "Tailor My Resume"}
            </Button>
            <Button onClick={() => generate("cover_letter")} loading={loadingCover} disabled={!resumeText.trim() || !jobDescription.trim()} variant="secondary" className="flex-1">
              <Mail className="h-4 w-4" />
              {loadingCover ? "Writing cover letter…" : "Generate Cover Letter"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {hasResult && (
        <div className="space-y-4">
          {/* Tab switcher */}
          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {(["resume", "cover"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant="chip"
                aria-pressed={activeTab === t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 ${t === "resume" && !resumeResult ? "opacity-40 pointer-events-none" : ""} ${t === "cover" && !coverResult ? "opacity-40 pointer-events-none" : ""}`}
              >
                {t === "resume" ? <><FileText className="h-4 w-4" /> Tailored Resume</> : <><Mail className="h-4 w-4" /> Cover Letter</>}
              </Button>
            ))}
          </div>

          {/* Resume tab */}
          {activeTab === "resume" && resumeResult && (
            <div className="space-y-4">
              {/* Fit score */}
              <Card padding="md" className="overflow-hidden">
                <h4 className="mb-3 font-bold text-slate-900">Fit Score</h4>
                <div className="flex items-center gap-4">
                  <FitBar label="Before" score={resumeResult.fitScore} color="text-amber-600" />
                  <ArrowRight className="h-5 w-5 shrink-0 text-brand-400" />
                  <FitBar label="After tailoring" score={resumeResult.tailoredFitScore} color="text-green-600" />
                </div>
              </Card>

              {/* Tailored summary */}
              <Card padding="md" className="overflow-hidden">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Tailored Professional Summary</h4>
                  <CopyBtn text={resumeResult.tailoredSummary} />
                </div>
                <p className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-slate-700 leading-relaxed italic">
                  {resumeResult.tailoredSummary}
                </p>
              </Card>

              {/* Experience bullets */}
              {resumeResult.experienceTailoring?.map((job) => (
                <Card key={job.jobTitle} padding="md" className="overflow-hidden">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{job.jobTitle}</h4>
                    <CopyBtn text={job.tailoredBullets.map((b) => `• ${b}`).join("\n")} />
                  </div>
                  <ul className="space-y-2">
                    {job.tailoredBullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" /> {b}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}

              {/* Skills + keywords */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card variant="success" padding="sm" className="overflow-hidden border-green-100 bg-green-50 shadow-sm">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">Skills to Highlight</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeResult.skillsToHighlight.map((s) => (
                      <span key={s} className="rounded-full border border-green-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-green-800">{s}</span>
                    ))}
                  </div>
                </Card>
                <Card variant="warning" padding="sm" className="overflow-hidden border-amber-100 shadow-sm">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">Keywords to Add</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeResult.keywordsToAdd.map((k) => (
                      <span key={k} className="rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-amber-800">{k}</span>
                    ))}
                  </div>
                </Card>
              </div>

              {resumeResult.tips?.length > 0 && (
                <Card variant="info" radius="xl" className="border-blue-100 px-4 py-3 space-y-1">
                  {resumeResult.tips.map((t, i) => (
                    <p key={i} className="text-xs text-blue-700">💡 {t}</p>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* Cover letter tab */}
          {activeTab === "cover" && coverResult && (
            <div className="space-y-4">
              <Card variant="brand" className="overflow-hidden px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-700">Email Subject</p>
                  <p className="text-sm font-semibold text-slate-800">{coverResult.subject}</p>
                </div>
                <CopyBtn text={coverResult.subject} />
              </Card>

              <Card padding="md" className="overflow-hidden">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Cover Letter</h4>
                  <CopyBtn text={coverResult.coverLetter.replace(/\\n/g, "\n")} />
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed rounded-xl bg-slate-50 border border-slate-100 p-4">
                  {coverResult.coverLetter.replace(/\\n/g, "\n")}
                </pre>
              </Card>

              {coverResult.highlights?.length > 0 && (
                <Card variant="success" padding="sm" className="overflow-hidden border-green-100 bg-green-50 shadow-sm">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">Why This Works</h4>
                  <ul className="space-y-1">
                    {coverResult.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {h}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {coverResult.tips?.length > 0 && (
                <Card variant="info" radius="xl" className="border-blue-100 px-4 py-3 space-y-1">
                  {coverResult.tips.map((t, i) => (
                    <p key={i} className="text-xs text-blue-700">💡 {t}</p>
                  ))}
                </Card>
              )}
            </div>
          )}

          <Button variant="outline" onClick={() => { setResumeResult(null); setCoverResult(null); }} className="w-full">
            <RotateCcw className="h-4 w-4" /> Tailor for Another Role
          </Button>
        </div>
      )}
    </div>
  );
}
