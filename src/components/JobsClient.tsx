"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Combobox } from "@/components/ui/Combobox";
import {
  Upload, FileText, X, Loader2, Briefcase, MapPin,
  Monitor, Search, ExternalLink, Star,
} from "lucide-react";
import type { JobAlert } from "@/lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const TARGET_ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Mobile Developer", "React Developer", "Node.js Developer", "Python Developer",
  "Java Developer", "DevOps Engineer", "Cloud Engineer", "Data Engineer",
  "Data Scientist", "Machine Learning Engineer", "AI/ML Engineer", "Data Analyst",
  "Business Analyst", "Product Manager", "Project Manager", "Scrum Master",
  "UI/UX Designer", "Graphic Designer", "Product Designer",
  "Digital Marketing Manager", "SEO Specialist", "Content Writer",
  "Sales Executive", "Account Manager", "Customer Success Manager",
  "HR Manager", "Recruiter", "Finance Analyst", "Accountant",
  "Civil Engineer", "Mechanical Engineer", "Electrical Engineer",
  "Network Engineer", "Cybersecurity Analyst", "QA Engineer",
  "Solutions Architect", "Engineering Manager", "CTO",
];

const LOCATIONS = [
  "Remote", "Bangalore, India", "Mumbai, India", "Delhi, India", "Hyderabad, India",
  "Chennai, India", "Pune, India", "Kolkata, India", "Ahmedabad, India", "Noida, India",
  "Gurgaon, India", "Kochi, India", "Jaipur, India", "Indore, India",
  "New York, USA", "San Francisco, USA", "Austin, USA", "Seattle, USA", "Boston, USA",
  "London, UK", "Dubai, UAE", "Singapore", "Toronto, Canada", "Sydney, Australia",
  "Berlin, Germany", "Amsterdam, Netherlands",
];

const WORK_MODES = ["Any", "Remote", "Hybrid", "On-site"] as const;
type WorkMode = typeof WORK_MODES[number];

const EXPERIENCE_LEVELS = [
  "Any", "Fresher (0-1 yr)", "1-3 years", "3-5 years", "5-8 years", "8+ years",
];

const WORK_MODE_COLORS: Record<WorkMode, string> = {
  Any: "bg-slate-100 text-slate-700 border-slate-300",
  Remote: "bg-emerald-50 text-emerald-700 border-emerald-300",
  Hybrid: "bg-blue-50 text-blue-700 border-blue-300",
  "On-site": "bg-orange-50 text-orange-700 border-orange-300",
};

interface JobResult {
  title: string;
  company: string;
  location: string;
  workMode: string;
  salary: string;
  description: string;
  requirements: string[];
  postedAt: string;
  applyUrl: string;
  matchScore: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JobsClient() {
  // Form state
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("Any");
  const [experience, setExperience] = useState("Any");
  const [skills, setSkills] = useState("");

  // Resume upload
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Results
  const [jobs, setJobs] = useState<JobResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alert preferences
  const [alert, setAlert] = useState<JobAlert | null>(null);
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/job-alerts")
      .then((r) => r.json())
      .then((d) => {
        if (d.alert) {
          setAlert(d.alert);
          if (d.alert.role) setRole(d.alert.role);
          if (d.alert.keywords) setSkills(d.alert.keywords);
        }
      })
      .catch(() => {});
  }, []);

  // ── Resume upload ────────────────────────────────────────────────────────────

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

      const text: string = data.text || "";
      setUploadedFile(file.name);

      // Auto-extract role from resume text
      const roleMatch = text.match(/target role[:\s]+([^\n]+)/i)
        || text.match(/applying for[:\s]+([^\n]+)/i)
        || text.match(/position[:\s]+([^\n]+)/i);
      if (roleMatch && !role) setRole(roleMatch[1].trim());

      // Extract skills keywords
      const skillsMatch = text.match(/skills?[:\s]+([^\n]{10,120})/i)
        || text.match(/technical skills?[:\s]+([^\n]{10,120})/i);
      if (skillsMatch) setSkills(skillsMatch[1].trim().slice(0, 200));
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

  // ── Job search ───────────────────────────────────────────────────────────────

  async function search() {
    if (!role.trim()) { setError("Please enter or select a role."); return; }
    setError(null);
    setLoading(true);
    setJobs(null);
    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, workMode, experience, skills }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed.");
      setJobs(data.jobs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not search jobs.");
    } finally {
      setLoading(false);
    }
  }

  // ── Email alerts ─────────────────────────────────────────────────────────────

  async function saveAlert(enabled: boolean) {
    setSavingAlert(true);
    setAlertMsg(null);
    try {
      const res = await fetch("/api/job-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, keywords: skills, frequency: "daily", enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not save preference.");
      setAlert(data.alert);
      setAlertMsg(enabled ? "Daily email alerts enabled." : "Email alerts disabled.");
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : "Could not save preference.");
    } finally {
      setSavingAlert(false);
    }
  }

  const enabled = alert?.enabled ?? false;

  const workModeBadgeColor = (wm: string) => {
    if (wm === "Remote") return "bg-emerald-100 text-emerald-700";
    if (wm === "Hybrid") return "bg-blue-100 text-blue-700";
    if (wm === "On-site") return "bg-orange-100 text-orange-700";
    return "bg-slate-100 text-slate-700";
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Search form card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-brand-gradient" />
        <div className="p-6 space-y-5">

          {/* Resume upload (optional) */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Upload resume <span className="font-normal text-slate-400">(optional — auto-fills role &amp; skills)</span>
            </p>
            {!uploadedFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition ${
                  dragOver ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50"
                }`}
              >
                {uploading
                  ? <Loader2 className="h-5 w-5 animate-spin text-brand-400 shrink-0" />
                  : <Upload className="h-5 w-5 text-slate-400 shrink-0" />}
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {uploading ? "Parsing resume…" : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-slate-400">PDF · DOCX · TXT</p>
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
              <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5">
                <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                <p className="flex-1 truncate text-sm font-medium text-brand-800">{uploadedFile}</p>
                <button
                  type="button"
                  onClick={() => { setUploadedFile(null); setSkills(""); }}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Role + Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Combobox
              label="Role / Job title *"
              placeholder="e.g. Software Engineer"
              options={TARGET_ROLES}
              value={role}
              onChange={setRole}
              allowCustom
            />
            <Combobox
              label="Location"
              placeholder="City, Country or Remote"
              options={LOCATIONS}
              value={location}
              onChange={setLocation}
              allowCustom
            />
          </div>

          {/* Work mode */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Monitor className="h-4 w-4" /> Work mode
            </p>
            <div className="flex flex-wrap gap-2">
              {WORK_MODES.map((wm) => (
                <button
                  key={wm}
                  type="button"
                  onClick={() => setWorkMode(wm)}
                  className={`rounded-xl border px-4 py-1.5 text-sm font-medium transition ${
                    workMode === wm
                      ? `${WORK_MODE_COLORS[wm]} border-current shadow-sm`
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {wm}
                </button>
              ))}
            </div>
          </div>

          {/* Experience level */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Experience level</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {EXPERIENCE_LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          {/* Skills (auto-filled or manual) */}
          {skills && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Key skills <span className="font-normal text-slate-400">(from resume — edit if needed)</span>
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="e.g. React, Node.js, TypeScript, AWS"
              />
            </div>
          )}

          {error && <Alert tone="error">{error}</Alert>}

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Button size="lg" onClick={search} loading={loading} className="gap-2">
              <Search className="h-4 w-4" />
              {loading ? "Searching…" : "Find matching jobs"}
            </Button>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={enabled}
                disabled={savingAlert}
                onChange={(e) => saveAlert(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600"
              />
              Email me daily alerts
            </label>
            {alertMsg && <span className="text-xs text-slate-500">{alertMsg}</span>}
          </div>

          {loading && (
            <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-4">
              <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
              <div>
                <p className="text-sm font-semibold text-brand-800">Searching for {role} jobs…</p>
                <p className="mt-0.5 text-xs text-brand-600">This takes 10-20 seconds. Please wait.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {jobs !== null && !loading && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {jobs.length > 0 ? `${jobs.length} matching jobs found` : "No jobs found"}
            </h2>
            {jobs.length > 0 && (
              <p className="text-sm text-slate-500">
                Sorted by best match
              </p>
            )}
          </div>

          {jobs.length === 0 ? (
            <Alert tone="info">
              No jobs matched your criteria. Try a broader role, different location, or &quot;Any&quot; work mode.
            </Alert>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <div
                  key={i}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 text-base">{job.title}</h3>
                        {/* Match score badge */}
                        <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 border border-brand-100">
                          <Star className="h-3 w-3" />
                          {job.matchScore}% match
                        </span>
                      </div>

                      {/* Company + location + work mode */}
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {job.company}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${workModeBadgeColor(job.workMode)}`}
                        >
                          {job.workMode}
                        </span>
                        {job.salary && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {job.salary}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">{job.description}</p>

                      {/* Requirements pills */}
                      {job.requirements?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {job.requirements.slice(0, 5).map((req, ri) => (
                            <span
                              key={ri}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            >
                              {req}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Apply button */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition"
                      >
                        Apply
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {job.postedAt && (
                        <span className="text-xs text-slate-400">{job.postedAt}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
