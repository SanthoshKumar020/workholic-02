"use client";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { AtsScoreRing } from "@/components/AtsScoreRing";
import { Lock, Upload, FileText, X, Loader2 } from "lucide-react";
import Link from "next/link";
import type { MatchResult } from "@/lib/types";
import { PlanUsageBadge, UpgradeWall } from "@/components/ui/PlanUsageBadge";

export function MatchClient({
  plan,
  freeUsed = 0,
  freeLimit = 3,
  isPro = false,
}: {
  plan: string;
  freeUsed?: number;
  freeLimit?: number;
  isPro?: boolean;
}) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatchResult & { isPro?: boolean } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [usedCount, setUsedCount] = useState(freeUsed);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exhausted = !isPro && usedCount >= freeLimit;

  async function parseFile(file: File) {
    if (!["pdf", "docx", "txt"].includes(file.name.split(".").pop()?.toLowerCase() ?? "")) {
      setError("Only PDF, DOCX, and TXT files are supported.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse file.");
      setResumeText(data.text);
      setUploadedFile(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file.");
    } finally {
      setUploading(false);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  function clearUpload() {
    setUploadedFile(null);
    setResumeText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (res.status === 403 && data.error === "free_limit_reached") {
        setLimitReached(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setResult(data);
      setUsedCount(c => c + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {!isPro && (
        <PlanUsageBadge used={usedCount} limit={freeLimit} feature="job match" />
      )}
      {limitReached && <UpgradeWall limit={freeLimit} feature="job match" />}
      <form onSubmit={handleAnalyze} className="grid gap-5 md:grid-cols-2">
        {/* Resume column */}
        <div className="flex flex-col gap-3">
          {/* Upload zone */}
          {!uploadedFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 transition ${
                dragOver
                  ? "border-brand-400 bg-brand-50"
                  : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50"
              }`}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              ) : (
                <Upload className="h-6 w-6 text-slate-400" />
              )}
              <p className="text-sm font-medium text-slate-700">
                {uploading ? "Parsing resume…" : "Upload Resume"}
              </p>
              <p className="text-xs text-slate-400">PDF, DOCX, or TXT · drag & drop or click</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
              <FileText className="h-5 w-5 shrink-0 text-brand-600" />
              <p className="flex-1 truncate text-sm font-medium text-brand-800">{uploadedFile}</p>
              <button type="button" onClick={clearUpload} className="text-slate-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Textarea
            label={uploadedFile ? "Extracted Resume Text (editable)" : "Or paste resume text"}
            placeholder="Paste your resume text here, or upload a file above…"
            rows={12}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            required
          />
        </div>

        <Textarea
          label="Job Description"
          placeholder="Paste the job description here..."
          rows={14}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          required
        />

        <div className="md:col-span-2">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} disabled={uploading || exhausted || limitReached} size="lg">
            Analyze Match
          </Button>
        </div>
      </form>

      {result && (
        <div className="animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center">
              <AtsScoreRing score={result.matchScore} size={120} />
              <p className="mt-2 text-sm font-medium text-slate-600">Match Score</p>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="mb-2 font-semibold text-slate-900">
                  ✅ Matched Keywords ({result.matchedKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.length > 0 ? (
                    result.matchedKeywords.map((kw) => (
                      <Badge key={kw} variant="success">{kw}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No matches found</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-slate-900">
                  ❌ Missing Keywords ({result.missingKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.length > 0 ? (
                    result.missingKeywords.map((kw) => (
                      <Badge key={kw} variant="destructive">{kw}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Great — no critical keywords missing!</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-slate-900">💡 Improvement Tips</h3>
                {plan === "pro" ? (
                  result.tips.length > 0 ? (
                    <ul className="space-y-1.5">
                      {result.tips.map((tip, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                          <span className="shrink-0 text-brand-500">→</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Looking good — your resume is well-matched!</p>
                  )
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 border border-amber-200">
                    <Lock className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Detailed tips are a Pro feature</p>
                      <Link href="/billing" className="mt-1 text-xs text-amber-700 underline">Upgrade to Pro</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
