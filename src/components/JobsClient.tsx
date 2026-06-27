"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Combobox } from "@/components/ui/Combobox";
import {
  Upload, FileText, X, Loader2, Briefcase, MapPin,
  Monitor, Search, ExternalLink, Star, Bell, BellOff, Clock,
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

const ALERT_TIMES = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
];

const WORK_MODE_COLORS: Record<WorkMode, string> = {
  Any: "bg-slate-100 text-slate-700 border-slate-300",
  Remote: "bg-emerald-50 text-emerald-700 border-emerald-300",
  Hybrid: "bg-blue-50 text-blue-700 border-blue-300",
  "On-site": "bg-orange-50 text-orange-700 border-orange-300",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApplyLink { platform: string; url: string; }

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
  applyLinks: ApplyLink[];
  matchScore: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchBadgeClass(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 65) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function workModeBadgeClass(wm: string) {
  if (wm === "Remote") return "bg-emerald-100 text-emerald-700";
  if (wm === "Hybrid") return "bg-blue-100 text-blue-700";
  if (wm === "On-site") return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-slate-700";
}

function platformButtonClass(platform: string) {
  if (platform === "LinkedIn") return "bg-[#0077b5] hover:bg-[#005f91] text-white";
  if (platform === "Naukri")   return "bg-[#4a90d9] hover:bg-[#3178c6] text-white";
  if (platform === "Indeed")   return "bg-[#2164f3] hover:bg-[#1a52d0] text-white";
  return "bg-brand-600 hover:bg-brand-700 text-white";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JobsClient() {
  // Form
  const [role, setRole]           = useState("");
  const [location, setLocation]   = useState("");
  const [workMode, setWorkMode]   = useState<WorkMode>("Any");
  const [experience, setExperience] = useState("Any");
  const [skills, setSkills]       = useState("");

  // Resume
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [resumeText, setResumeText]     = useState("");
  const [uploading, setUploading]       = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Results
  const [jobs, setJobs]                 = useState<JobResult[] | null>(null);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Alert
  const [alert, setAlert]               = useState<JobAlert | null>(null);
  const [alertTime, setAlertTime]       = useState("09:00");
  const [savingAlert, setSavingAlert]   = useState(false);
  const [alertMsg, setAlertMsg]         = useState<string | null>(null);
  const [showAlertPanel, setShowAlertPanel] = useState(false);

  useEffect(() => {
    fetch("/api/job-alerts")
      .then((r) => r.json())
      .then((d) => {
        if (d.alert) {
          setAlert(d.alert);
          if (d.alert.role)      setRole(d.alert.role);
          if (d.alert.keywords)  setSkills(d.alert.keywords);
          if (d.alert.send_time) setAlertTime(d.alert.send_time);
          if (d.alert.enabled)   setShowAlertPanel(true);
        }
      })
      .catch(() => {});
  }, []);

  // ── Resume upload ─────────────────────────────────────────────────────────────

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
      const res  = await fetch("/api/parse-resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse file.");

      const text: string = data.text || "";
      setUploadedFile(file.name);
      setResumeText(text);

      // Auto-extract role
      const roleMatch =
        text.match(/target role[:\s]+([^\n]+)/i) ||
        text.match(/applying for[:\s]+([^\n]+)/i) ||
        text.match(/position[:\s]+([^\n]+)/i);
      if (roleMatch && !role) setRole(roleMatch[1].trim());

      // Auto-extract skills
      const skillsMatch =
        text.match(/technical skills?[:\s]+([^\n]{10,200})/i) ||
        text.match(/skills?[:\s]+([^\n]{10,200})/i);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearResume() {
    setUploadedFile(null);
    setResumeText("");
    setSkills("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Job search ────────────────────────────────────────────────────────────────

  async function search() {
    if (!role.trim()) { setError("Please enter or select a role."); return; }
    setError(null);
    setLoading(true);
    setJobs(null);
    setTotalGenerated(0);
    try {
      const res  = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, workMode, experience, skills, resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed.");
      setJobs(data.jobs ?? []);
      setTotalGenerated(data.total ?? data.jobs?.length ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not search jobs.");
    } finally {
      setLoading(false);
    }
  }

  // ── Email alert save ──────────────────────────────────────────────────────────

  async function saveAlert(enabled: boolean) {
    setSavingAlert(true);
    setAlertMsg(null);
    try {
      const res  = await fetch("/api/job-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role, keywords: skills, frequency: "daily", enabled, send_time: alertTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not save preference.");
      setAlert(data.alert);
      setAlertMsg(
        enabled
          ? `Alerts enabled — you'll receive an email daily at ${alertTime} IST.`
          : "Email alerts disabled.",
      );
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : "Could not save preference.");
    } finally {
      setSavingAlert(false);
    }
  }

  const alertEnabled = alert?.enabled ?? false;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Search form ────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-brand-gradient" />
        <div className="p-6 space-y-5">

          {/* Resume upload */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Upload resume{" "}
              <span className="font-normal text-slate-400">
                (recommended — enables match scoring against your actual background)
              </span>
            </p>

            {!uploadedFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition ${
                  dragOver
                    ? "border-brand-400 bg-brand-50"
                    : "border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50"
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
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  ✓ Resume loaded
                </span>
                <button type="button" onClick={clearResume} className="shrink-0 text-slate-400 hover:text-red-500">
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
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
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

          {/* Experience */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Experience level
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {EXPERIENCE_LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          {/* Skills — always visible */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Key skills{" "}
              <span className="font-normal text-slate-400">
                {uploadedFile ? "(auto-filled from resume — edit if needed)" : "(comma-separated, optional)"}
              </span>
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="e.g. React, Node.js, TypeScript, AWS"
            />
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button size="lg" onClick={search} loading={loading} className="gap-2">
              <Search className="h-4 w-4" />
              {loading ? "Searching…" : "Find matching jobs"}
            </Button>

            {/* Daily alert toggle */}
            <button
              type="button"
              onClick={() => setShowAlertPanel((v) => !v)}
              className={`flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
                alertEnabled
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {alertEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {alertEnabled ? "Alert on" : "Set daily alert"}
            </button>
          </div>

          {/* Alert settings panel */}
          {showAlertPanel && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <Bell className="h-4 w-4 text-brand-600" />
                Daily email alert settings
              </p>

              {/* Time picker row */}
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-600">
                    <Clock className="h-3 w-3" />
                    Send time (IST)
                  </label>
                  <select
                    value={alertTime}
                    onChange={(e) => setAlertTime(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    {ALERT_TIMES.map((t) => (
                      <option key={t} value={t}>{t} IST</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => saveAlert(true)}
                    loading={savingAlert}
                  >
                    {alertEnabled ? "Update alert" : "Enable alert"}
                  </Button>
                  {alertEnabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveAlert(false)}
                      loading={savingAlert}
                    >
                      Disable
                    </Button>
                  )}
                </div>
              </div>

              {/* Status message */}
              {alertMsg && (
                <p className={`text-xs font-medium ${
                  alertMsg.includes("enabled") ? "text-emerald-700" : "text-slate-500"
                }`}>
                  {alertMsg}
                </p>
              )}

              <p className="text-xs text-slate-500">
                You&apos;ll get an email at <strong>{alertTime} IST</strong> every day with{" "}
                {role ? <><strong>{role}</strong> listings</> : "new job listings"} matching your profile.
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-4">
              <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
              <div>
                <p className="text-sm font-semibold text-brand-800">
                  Searching for {role} jobs…
                </p>
                <p className="mt-0.5 text-xs text-brand-600">
                  {resumeText
                    ? "Matching against your resume — takes 15–25 seconds."
                    : "This takes 10–20 seconds. Please wait."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────────────── */}
      {jobs !== null && !loading && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {jobs.length > 0
                  ? `${jobs.length} job${jobs.length === 1 ? "" : "s"} with 50%+ match${resumeText ? " to your resume" : ""}`
                  : "No jobs above 50% match"}
              </h2>
              {resumeText && totalGenerated > jobs.length && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {totalGenerated - jobs.length} below 50% hidden
                </p>
              )}
            </div>
            {jobs.length > 0 && (
              <span className="text-sm text-slate-500">Sorted best match first</span>
            )}
          </div>

          {jobs.length === 0 ? (
            <Alert tone="info">
              No jobs matched 50%+ for this search. Try a broader role, different location,
              or upload your resume for more accurate scoring.
            </Alert>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
                >
                  {/* Header */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${matchBadgeClass(job.matchScore)}`}>
                      <Star className="h-3 w-3" />
                      {job.matchScore}% match
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {job.company}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${workModeBadgeClass(job.workMode)}`}>
                      {job.workMode}
                    </span>
                    {job.salary && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        {job.salary}
                      </span>
                    )}
                    {job.postedAt && (
                      <span className="text-xs text-slate-400">{job.postedAt}</span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="mb-3 text-sm text-slate-600 line-clamp-2">{job.description}</p>

                  {/* Requirements */}
                  {job.requirements?.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {job.requirements.slice(0, 6).map((req, ri) => (
                        <span key={ri} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {req}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Apply buttons — one per platform */}
                  <div className="flex flex-wrap gap-2">
                    {(job.applyLinks?.length ? job.applyLinks : [{ platform: "LinkedIn", url: job.applyUrl }]).map((link) => (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${platformButtonClass(link.platform)}`}
                      >
                        Apply on {link.platform}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
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
