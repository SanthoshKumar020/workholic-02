"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { AtsScoreRing } from "@/components/AtsScoreRing";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { shareText, SITE_URL } from "@/lib/share";
import {
  extractResumeText,
  ExtractionError,
  ACCEPTED_RESUME_TYPES,
} from "@/lib/extractText";
import type { EnhanceResult } from "@/lib/types";

/**
 * Free, no-login ATS Score Checker (lead magnet).
 * Primary flow: upload a resume file (PDF/DOCX/TXT) → extract text in the
 * browser → POST { resumeText } to a server proxy that forwards to n8n.
 * A "paste text instead" fallback is available.
 */
export function AtsChecker() {
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnhanceResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setExtracting(true);
    setFileName(file.name);
    try {
      const text = await extractResumeText(file);
      if (text.trim().length < 30) {
        throw new ExtractionError(
          "We couldn't find enough text in that file. Try another file or paste your resume."
        );
      }
      setResumeText(text);
    } catch (err) {
      setResumeText("");
      setFileName(null);
      setError(
        err instanceof ExtractionError
          ? err.message
          : "Could not read that file. Please try another."
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleCheck() {
    setError(null);
    if (resumeText.trim().length < 50) {
      setError("Please upload a resume (or paste at least a few lines) to get a meaningful score.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ats-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      setResult(data as EnhanceResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setResumeText("");
    setFileName(null);
    setError(null);
    setPasteMode(false);
  }

  const tips = result?.improvements ?? result?.tips ?? [];
  const ready = resumeText.trim().length >= 50;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-brand-100/40">
      {!result ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Upload your resume &amp; check your ATS score
            </h3>
            <p className="text-sm text-slate-500">
              Upload a PDF, DOCX, or TXT file and see how applicant tracking systems read it. No login
              needed.
            </p>
          </div>

          {!pasteMode ? (
            <>
              {/* Upload dropzone */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                  dragOver ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-brand-400"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED_RESUME_TYPES}
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <svg className="h-9 w-9 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                {extracting ? (
                  <p className="mt-3 text-sm font-medium text-slate-600">Reading {fileName}…</p>
                ) : fileName && ready ? (
                  <p className="mt-3 text-sm font-medium text-emerald-700">✓ {fileName} ready</p>
                ) : (
                  <>
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Drop your resume here, or click to browse
                    </p>
                    <p className="mt-1 text-xs text-slate-400">PDF, DOCX, or TXT · up to 5 MB</p>
                  </>
                )}
              </div>

              <p className="text-center text-xs text-slate-500">
                Prefer to paste?{" "}
                <button
                  type="button"
                  onClick={() => setPasteMode(true)}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  Paste resume text instead
                </button>
              </p>
            </>
          ) : (
            <>
              <Textarea
                name="resumeText"
                rows={8}
                placeholder="Paste your resume text here…"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                disabled={loading}
              />
              <p className="text-center text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setPasteMode(false)}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  ← Upload a file instead
                </button>
              </p>
            </>
          )}

          {error && <Alert tone="error">{error}</Alert>}

          <Button
            onClick={handleCheck}
            loading={loading}
            disabled={extracting || !ready}
            size="lg"
            className="w-full"
          >
            {loading ? "Analyzing…" : "Check my ATS score"}
          </Button>
        </div>
      ) : (
        <div className="animate-fade-in space-y-5">
          {/* Score + headline */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <AtsScoreRing score={result.atsScore ?? 0} />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Your ATS Score
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900 leading-tight">
                {tips.length > 0
                  ? `We found ${tips.length} issue${tips.length !== 1 ? "s" : ""} holding your resume back`
                  : "Your resume looks solid!"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {(result.atsScore ?? 0) < 60
                  ? "Most ATS systems would filter this out before a human sees it."
                  : (result.atsScore ?? 0) < 80
                  ? "Good start — a few targeted fixes could push you into the top 20%."
                  : "Strong score. AI enhancement can take you to the next level."}
              </p>
            </div>
          </div>

          {/* Issues list */}
          {tips.length > 0 && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-red-600">
                Issues to fix
              </p>
              <ul className="space-y-2">
                {tips.slice(0, 5).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conversion CTA */}
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
            <p className="text-sm font-bold text-brand-800">
              Fix {tips.length > 0 ? `all ${Math.min(tips.length, 5)}` : "these"} issues with AI — free
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Sign up free → paste your job description → AI rewrites your resume to match. ATS score
              typically jumps 20–40 points.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex-1 rounded-xl bg-brand-gradient px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Fix with AI — sign up free →
            </Link>
            <Button variant="secondary" onClick={reset}>
              Check another
            </Button>
          </div>

          {/* Share — India shares on WhatsApp */}
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-400">Proud of your score?</span>
            <WhatsAppShareButton
              text={shareText.ats(result.atsScore ?? 0)}
              url={SITE_URL}
              size="sm"
            />
          </div>

          <p className="text-center text-[11px] text-slate-400">
            No card required · Takes 60 seconds · Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
