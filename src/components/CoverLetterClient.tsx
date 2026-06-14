"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Copy, Download, RefreshCw, Upload, FileText, X, Loader2 } from "lucide-react";

const TONES = ["professional", "enthusiastic", "confident", "friendly"];

export function CoverLetterClient() {
  const [resumeText, setResumeText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Resume upload ─────────────────────────────────────────────────────────────

  async function parseFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "docx", "txt"].includes(ext)) {
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
      setResumeText(data.text || "");
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

  function clearResume() {
    setUploadedFile(null);
    setResumeText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Generate ──────────────────────────────────────────────────────────────────

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setCoverLetter(data.coverLetter || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadTxt() {
    const blob = new Blob([coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">

        {/* Resume upload */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-slate-700">Your Resume</p>

          {!uploadedFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition ${
                dragOver
                  ? "border-brand-400 bg-brand-50"
                  : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50"
              }`}
            >
              {uploading
                ? <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                : <Upload className="h-8 w-8 text-slate-300" />}
              <div className="text-center">
                <p className="font-medium text-slate-600">
                  {uploading ? "Parsing your resume…" : "Drag & drop or click to upload"}
                </p>
                <p className="mt-1 text-sm text-slate-400">PDF · DOCX · TXT</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1">
              {/* File chip */}
              <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5">
                <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                <p className="flex-1 truncate text-sm font-medium text-brand-800">{uploadedFile}</p>
                <button type="button" onClick={clearResume} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Editable parsed text */}
              <Textarea
                label="Parsed text (editable)"
                rows={10}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Job description */}
        <Textarea
          label="Job Description"
          placeholder="Paste the job description here..."
          rows={uploadedFile ? 14 : 12}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      {/* Tone */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Tone</label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={`rounded-lg border px-4 py-1.5 text-sm font-medium capitalize transition ${
                tone === t
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        onClick={generate}
        loading={loading}
        size="lg"
        disabled={!resumeText || !jobDescription}
      >
        Generate Cover Letter
      </Button>

      {coverLetter && (
        <div className="animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Your Cover Letter</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTxt}>
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={generate} loading={loading}>
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            </div>
          </div>
          <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
            {coverLetter}
          </div>
        </div>
      )}
    </div>
  );
}
