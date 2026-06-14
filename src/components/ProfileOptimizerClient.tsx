"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Upload, FileText, X, Loader2, Copy, CheckCheck, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

const TARGET_ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Mobile Developer", "Data Scientist", "Machine Learning Engineer", "Data Analyst",
  "DevOps Engineer", "Cloud Engineer", "Product Manager", "UI/UX Designer",
  "Digital Marketing Manager", "SEO Specialist", "Business Analyst", "HR Manager",
  "Sales Executive", "Finance Analyst", "Civil Engineer", "Mechanical Engineer",
  "Cybersecurity Analyst", "QA Engineer", "Solutions Architect", "CTO",
];

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }
  return (
    <button type="button" onClick={copy}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700 transition shadow-sm">
      {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ── Section field card ────────────────────────────────────────────────────────

function FieldCard({
  step, icon, title, where, charLimit, content, tip, extra,
}: {
  step: number;
  icon: string;
  title: string;
  where: string;
  charLimit?: number;
  content: string;
  tip?: string;
  extra?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const chars = content.length;
  const overLimit = charLimit ? chars > charLimit : false;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={() => setExpanded((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
          {step}
        </span>
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="truncate text-xs text-slate-400">{where}</p>
        </div>
        {charLimit && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${overLimit ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>
            {chars}/{charLimit}
          </span>
        )}
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-3">
          {/* Where to paste */}
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
            <span className="mt-0.5 shrink-0 text-sm">📍</span>
            <p className="text-xs text-blue-800 font-medium">{where}</p>
          </div>

          {/* Content */}
          <div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-mono">
              {content}
            </div>
            <div className="mt-2 flex justify-end">
              <CopyBtn text={content} />
            </div>
          </div>

          {/* Tip */}
          {tip && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-800">{tip}</p>
            </div>
          )}

          {extra}
        </div>
      )}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Experience { title: string; company: string; description: string; }

interface LinkedInData {
  headline: { primary: string; alternatives: string[] };
  about: string;
  openToWork: { jobTitles: string[]; jobTypes: string[]; locationType: string };
  experiences: Experience[];
  skills: string[];
  headline_tips: string;
  about_tips: string;
}

interface ITSkill { skill: string; version: string; lastUsed: string; }

interface NaukriData {
  resumeHeadline: string;
  profileSummary: string;
  careerObjective: string;
  keySkills: string[];
  itSkills: ITSkill[];
  experiences: Experience[];
  headline_tips: string;
  summary_tips: string;
}

// ── LinkedIn result ───────────────────────────────────────────────────────────

function LinkedInResult({ result }: { result: LinkedInData }) {
  const [showAlt, setShowAlt] = useState(false);

  return (
    <div className="space-y-4">
      {/* 1. Headline */}
      <FieldCard
        step={1}
        icon="🏷️"
        title="Headline"
        where="LinkedIn → Edit Profile (pencil icon at top) → Headline field → Save"
        charLimit={220}
        content={result.headline?.primary ?? ""}
        tip={result.headline_tips}
        extra={
          result.headline?.alternatives?.length > 0 && (
            <div>
              <button type="button" onClick={() => setShowAlt(o => !o)}
                className="text-xs text-brand-600 font-semibold hover:underline">
                {showAlt ? "Hide" : "Show"} {result.headline.alternatives.length} alternative headlines
              </button>
              {showAlt && (
                <div className="mt-2 space-y-2">
                  {result.headline.alternatives.map((alt, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-sm text-slate-700 flex-1">{alt}</p>
                      <CopyBtn text={alt} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }
      />

      {/* 2. About */}
      <FieldCard
        step={2}
        icon="📝"
        title="About / Summary"
        where="LinkedIn → Edit Profile → About section (scroll down) → Save"
        charLimit={2600}
        content={result.about ?? ""}
        tip={result.about_tips}
      />

      {/* 3. Open to Work */}
      {result.openToWork && (
        <FieldCard
          step={3}
          icon="🟢"
          title="Open To Work Settings"
          where='LinkedIn → "Open to" button below your profile photo → Finding a new job → Fill these in'
          content={[
            `Job titles to add:\n${(result.openToWork.jobTitles ?? []).map(t => `• ${t}`).join("\n")}`,
            `\nJob types: ${(result.openToWork.jobTypes ?? []).join(", ")}`,
            `\nLocation type: ${result.openToWork.locationType ?? ""}`,
          ].join("")}
          tip="Set visibility to 'Recruiters only' so your current employer can't see it."
        />
      )}

      {/* 4. Skills */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">4</span>
          <span className="text-xl">🛠️</span>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Skills</p>
            <p className="text-xs text-slate-400">LinkedIn → Your profile → Skills → Add a skill → add each one</p>
          </div>
          <CopyBtn text={(result.skills ?? []).join(", ")} label="Copy all" />
        </div>
        <div className="border-t border-slate-100 px-5 pb-5 pt-3">
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 mb-3">
            <span className="mt-0.5 shrink-0 text-sm">📍</span>
            <p className="text-xs text-blue-800 font-medium">
              LinkedIn → Profile → Skills section → + Add a skill → type and select each skill below
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(result.skills ?? []).map((skill, i) => (
              <button key={i} type="button" onClick={() => navigator.clipboard.writeText(skill)}
                title="Click to copy"
                className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 transition cursor-copy">
                {skill}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Click any skill pill to copy it</p>
        </div>
      </div>

      {/* 5+. Experience bullets */}
      {(result.experiences ?? []).map((exp, i) => (
        <FieldCard
          key={i}
          step={5 + i}
          icon="💼"
          title={`Experience: ${exp.title}${exp.company ? ` at ${exp.company}` : ""}`}
          where={`LinkedIn → Experience section → "${exp.title}" → Edit (pencil) → Description → Save`}
          content={exp.description}
          tip="Start each bullet with a strong action verb. Add numbers and percentages wherever you can — they get 3× more profile views."
        />
      ))}
    </div>
  );
}

// ── Naukri result ─────────────────────────────────────────────────────────────

function NaukriResult({ result }: { result: NaukriData }) {
  return (
    <div className="space-y-4">
      {/* 1. Resume Headline */}
      <FieldCard
        step={1}
        icon="🏷️"
        title="Resume Headline"
        where='Naukri → My Profile → "Resume Headline" box at the top → Save Changes'
        charLimit={250}
        content={result.resumeHeadline ?? ""}
        tip={result.headline_tips}
      />

      {/* 2. Profile Summary */}
      <FieldCard
        step={2}
        icon="📝"
        title="Profile Summary"
        where='Naukri → My Profile → Profile Summary section → Edit → paste → Save'
        content={result.profileSummary ?? ""}
        tip={result.summary_tips}
      />

      {/* 3. Career Objective */}
      {result.careerObjective && (
        <FieldCard
          step={3}
          icon="🎯"
          title="Career Objective"
          where='Naukri → My Profile → Career Profile section → Career Objective field → Save'
          content={result.careerObjective}
          tip="Keep it role-specific. Naukri shows this to recruiters in search results alongside your headline."
        />
      )}

      {/* 4. Key Skills */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">4</span>
          <span className="text-xl">🛠️</span>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Key Skills</p>
            <p className="text-xs text-slate-400">Naukri → My Profile → Key Skills → Add skills</p>
          </div>
          <CopyBtn text={(result.keySkills ?? []).join(", ")} label="Copy all" />
        </div>
        <div className="border-t border-slate-100 px-5 pb-5 pt-3">
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 mb-3">
            <span className="mt-0.5 shrink-0 text-sm">📍</span>
            <p className="text-xs text-blue-800 font-medium">
              Naukri → My Profile → Key Skills → click + → type each skill and add it
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(result.keySkills ?? []).map((skill, i) => (
              <button key={i} type="button" onClick={() => navigator.clipboard.writeText(skill)}
                title="Click to copy"
                className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100 transition cursor-copy">
                {skill}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Click any skill pill to copy it</p>
        </div>
      </div>

      {/* 5. IT Skills table */}
      {(result.itSkills ?? []).length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">5</span>
            <span className="text-xl">💻</span>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">IT Skills</p>
              <p className="text-xs text-slate-400">Naukri → My Profile → IT Skills → Add IT Skill</p>
            </div>
          </div>
          <div className="border-t border-slate-100 px-5 pb-5 pt-3">
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 mb-3">
              <span className="mt-0.5 shrink-0 text-sm">📍</span>
              <p className="text-xs text-blue-800 font-medium">
                Naukri → My Profile → IT Skills → Add IT Skill → fill in skill name, version, and last used year for each row
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2 text-left">Skill / Tool</th>
                    <th className="px-4 py-2 text-left">Version</th>
                    <th className="px-4 py-2 text-left">Last Used</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.itSkills.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{s.skill}</td>
                      <td className="px-4 py-2.5 text-slate-500">{s.version || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500">{s.lastUsed}</td>
                      <td className="px-4 py-2.5"><CopyBtn text={s.skill} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6+. Experience descriptions */}
      {(result.experiences ?? []).map((exp, i) => (
        <FieldCard
          key={i}
          step={6 + i}
          icon="💼"
          title={`Work Experience: ${exp.title}${exp.company ? ` at ${exp.company}` : ""}`}
          where={`Naukri → My Profile → Employment → "${exp.title}" → Edit → Description → Save`}
          content={exp.description}
          tip="Include tools, technologies, and impact numbers. Naukri's search ranks profiles higher when experience descriptions match job keywords."
        />
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function ProfileOptimizerClient() {
  const [platform, setPlatform] = useState<"linkedin" | "naukri">("linkedin");
  const [targetRole, setTargetRole] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkedInData | NaukriData | null>(null);
  const [resultPlatform, setResultPlatform] = useState<"linkedin" | "naukri">("linkedin");

  async function parseFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "docx", "txt"].includes(ext)) {
      setError("Only PDF, DOCX, and TXT files are supported.");
      return;
    }
    setUploading(true);
    setError(null);
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

  async function generate() {
    if (!resumeText.trim()) { setError("Please upload your resume first."); return; }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/profile-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, resumeText, targetRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setResult(data.result);
      setResultPlatform(data.platform);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isLinkedIn = platform === "linkedin";

  return (
    <div className="space-y-6">
      {/* Platform toggle */}
      <div className="flex gap-3">
        {(["linkedin", "naukri"] as const).map((p) => (
          <button key={p} type="button"
            onClick={() => { setPlatform(p); setResult(null); setError(null); }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              platform === p
                ? p === "linkedin" ? "bg-[#0077b5] text-white shadow-md" : "bg-[#ff7555] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p === "linkedin" ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            ) : <span className="text-base font-black">N</span>}
            {p === "linkedin" ? "LinkedIn" : "Naukri"}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className={`h-1 w-full ${isLinkedIn ? "bg-[#0077b5]" : "bg-[#ff7555]"}`} />
        <div className="p-6 space-y-5">
          <Combobox
            label="Target role (optional — helps tailor keywords)"
            placeholder="e.g. Software Engineer"
            options={TARGET_ROLES}
            value={targetRole}
            onChange={setTargetRole}
            allowCustom
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Upload your resume
              <span className="ml-1 font-normal text-slate-400">
                — we&apos;ll generate your complete {isLinkedIn ? "LinkedIn" : "Naukri"} profile from it
              </span>
            </p>

            {!uploadedFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 transition ${
                  dragOver ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50"
                }`}
              >
                {uploading
                  ? <Loader2 className="h-9 w-9 animate-spin text-brand-400" />
                  : <Upload className="h-9 w-9 text-slate-300" />}
                <div className="text-center">
                  <p className="font-medium text-slate-600">
                    {uploading ? "Reading your resume…" : "Drag & drop or click to upload"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">PDF · DOCX · TXT</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
                  onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                <FileText className="h-5 w-5 shrink-0 text-brand-600" />
                <p className="flex-1 truncate text-sm font-medium text-brand-800">{uploadedFile}</p>
                <button type="button" onClick={() => { setUploadedFile(null); setResumeText(""); }}
                  className="text-slate-400 hover:text-red-500 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</p>
          )}

          <Button size="lg" onClick={generate} loading={loading} disabled={!resumeText || uploading}
            className={`text-white hover:opacity-90 ${isLinkedIn ? "bg-[#0077b5]" : "bg-[#ff7555]"}`}>
            {loading
              ? `Generating your ${isLinkedIn ? "LinkedIn" : "Naukri"} profile…`
              : `Generate ${isLinkedIn ? "LinkedIn" : "Naukri"} Profile Content`}
          </Button>

          {loading && (
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
              <span className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Writing your {isLinkedIn ? "LinkedIn" : "Naukri"} profile…
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Generating headline, about, skills, experience bullets, and more. Takes 15–25 seconds.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5">
          <div className={`h-1.5 w-full rounded-full ${resultPlatform === "linkedin" ? "bg-[#0077b5]" : "bg-[#ff7555]"}`} />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Your {resultPlatform === "linkedin" ? "LinkedIn" : "Naukri"} profile — ready to paste
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Each section is ready to copy and paste directly into your profile. Click any skill pill to copy it individually.
              </p>
            </div>
            <button type="button" onClick={() => { setResult(null); setError(null); }}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition">
              ← Try again
            </button>
          </div>

          {resultPlatform === "linkedin"
            ? <LinkedInResult result={result as LinkedInData} />
            : <NaukriResult result={result as NaukriData} />}
        </div>
      )}
    </div>
  );
}
