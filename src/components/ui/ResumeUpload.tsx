"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (text: string) => void;
  label?: string;
}

export function ResumeUpload({ value, onChange, label = "Upload Resume" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function parse(file: File) {
    setError(null);
    setParsing(true);
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Parse failed.");
      onChange(d.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse file.");
      setFileName(null);
      onChange("");
    } finally {
      setParsing(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parse(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parse(file);
  }

  function clear() {
    setFileName(null);
    onChange("");
    setError(null);
  }

  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}

      <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={onFileChange} />

      {/* Loaded state */}
      {value && fileName && !parsing && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-green-600" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-green-800">{fileName}</p>
            <p className="text-xs text-green-600">{value.length.toLocaleString()} characters extracted</p>
          </div>
          <button type="button" onClick={clear}
            className="shrink-0 rounded-lg p-1 text-green-600 hover:bg-green-100 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Parsing state */}
      {parsing && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Parsing {fileName}…</p>
            <p className="text-xs text-blue-600">Extracting text from your resume</p>
          </div>
        </div>
      )}

      {/* Upload area (empty or error state) */}
      {!value && !parsing && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
              dragging
                ? "border-brand-400 bg-brand-50"
                : "border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50"
            }`}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${dragging ? "bg-brand-100 text-brand-600" : "bg-white text-slate-400"} shadow-sm`}>
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {dragging ? "Drop your resume here" : "Click to upload resume"}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">PDF, DOCX, or TXT · max 10 MB</p>
            </div>
          </button>
          {error && (
            <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error} — <button type="button" className="underline" onClick={() => inputRef.current?.click()}>try again</button>
            </p>
          )}
        </>
      )}
    </div>
  );
}
