"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { AtsScoreRing } from "@/components/AtsScoreRing";
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
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <AtsScoreRing score={result.atsScore ?? 0} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">Your ATS score</h3>
              <p className="text-sm text-slate-500">
                Here are the top things to improve. Sign up free to apply AI enhancements and export
                a polished PDF.
              </p>
            </div>
          </div>

          {tips.length > 0 && (
            <ul className="space-y-2">
              {tips.slice(0, 5).map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {tip}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              Enhance &amp; export — free
            </Link>
            <Button variant="secondary" onClick={reset}>
              Check another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
