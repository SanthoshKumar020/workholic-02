"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Combobox } from "@/components/ui/Combobox";
import { AtsScoreRing } from "@/components/AtsScoreRing";
import { TemplatePicker } from "@/components/TemplatePicker";
import {
  Plus, Trash2, Upload, FileText, X, Loader2,
  ChevronDown, ChevronUp, User, Briefcase, GraduationCap,
  Code2, FolderGit2, Award, Globe, Trophy, Heart, BookOpen, Users, Star,
} from "lucide-react";
import type { EnhanceResult } from "@/lib/types";

// ── Dropdown options ─────────────────────────────────────────────────────────
const TARGET_ROLES = [
  "Software Engineer","Frontend Developer","Backend Developer","Full Stack Developer",
  "Mobile Developer","React Developer","Node.js Developer","Python Developer",
  "Java Developer","DevOps Engineer","Cloud Engineer","Data Engineer",
  "Data Scientist","Machine Learning Engineer","AI/ML Engineer","Data Analyst",
  "Business Analyst","Product Manager","Project Manager","Scrum Master",
  "UI/UX Designer","Graphic Designer","Product Designer",
  "Digital Marketing Manager","SEO Specialist","Content Writer","Copywriter",
  "Sales Executive","Account Manager","Customer Success Manager",
  "HR Manager","Recruiter","Finance Analyst","Accountant","Chartered Accountant",
  "Civil Engineer","Mechanical Engineer","Electrical Engineer","Embedded Systems Engineer",
  "Network Engineer","Cybersecurity Analyst","Penetration Tester","QA Engineer",
  "Technical Writer","Solutions Architect","Engineering Manager","CTO","VP of Engineering",
];

const DEGREES = [
  "Bachelor of Technology (B.Tech)","Bachelor of Engineering (B.E)","Bachelor of Science (B.Sc)",
  "Bachelor of Commerce (B.Com)","Bachelor of Arts (B.A)","Bachelor of Business Administration (BBA)",
  "Bachelor of Computer Applications (BCA)","Bachelor of Medicine (MBBS)",
  "Master of Technology (M.Tech)","Master of Engineering (M.E)","Master of Science (M.Sc)",
  "Master of Business Administration (MBA)","Master of Computer Applications (MCA)",
  "Master of Commerce (M.Com)","Master of Arts (M.A)","Doctor of Philosophy (Ph.D)",
  "Diploma","Advanced Diploma","Post Graduate Diploma","12th / HSC","10th / SSC","Other",
];

const FIELDS_OF_STUDY = [
  "Computer Science and Engineering","Information Technology","Electronics and Communication",
  "Electrical Engineering","Mechanical Engineering","Civil Engineering","Chemical Engineering",
  "Aerospace Engineering","Biotechnology","Biomedical Engineering",
  "Data Science","Artificial Intelligence","Machine Learning","Cybersecurity",
  "Computer Science","Software Engineering","Information Systems",
  "Business Administration","Finance","Marketing","Human Resources","Economics",
  "Mathematics","Statistics","Physics","Chemistry","Biology",
  "Commerce","Accounting","Chartered Accountancy (CA)","Law","Psychology",
  "Architecture","Design","Media and Communication","Journalism",
  "Medicine","Nursing","Pharmacy","Physiotherapy","Other",
];

const PROFICIENCY_LEVELS = ["Beginner","Elementary","Intermediate","Upper-Intermediate","Advanced","Native/Fluent"];

const LANGUAGES = [
  "English","Hindi","Tamil","Telugu","Kannada","Malayalam","Marathi","Bengali",
  "Gujarati","Punjabi","Urdu","Odia","Sanskrit","Mandarin","Spanish","French",
  "German","Arabic","Japanese","Korean","Portuguese","Russian","Italian","Other",
];

// ── Types ────────────────────────────────────────────────────────────────────
interface Experience {
  id: string; company: string; role: string; location: string;
  startDate: string; endDate: string; current: boolean; description: string;
}
interface Education {
  id: string; degree: string; field: string; institution: string;
  startYear: string; endYear: string; grade: string;
}
interface Project {
  id: string; name: string; url: string; tech: string; description: string;
}
interface Certification {
  id: string; name: string; issuer: string; year: string;
}
interface Language {
  id: string; language: string; proficiency: string;
}
interface Volunteer {
  id: string; organization: string; role: string; startDate: string; endDate: string; current: boolean; description: string;
}
interface AwardEntry {
  id: string; title: string; issuer: string; year: string; description: string;
}
interface Publication {
  id: string; title: string; publisher: string; year: string; url: string;
}
interface Reference {
  id: string; name: string; title: string; company: string; contact: string;
}

type OptionalSectionKey = "volunteer" | "awards" | "interests" | "publications" | "references";

function uid() { return Math.random().toString(36).slice(2); }

function emptyExp(): Experience {
  return { id: uid(), company: "", role: "", location: "", startDate: "", endDate: "", current: false, description: "" };
}
function emptyEdu(): Education {
  return { id: uid(), degree: "", field: "", institution: "", startYear: "", endYear: "", grade: "" };
}
function emptyProj(): Project {
  return { id: uid(), name: "", url: "", tech: "", description: "" };
}
function emptyCert(): Certification {
  return { id: uid(), name: "", issuer: "", year: "" };
}
function emptyLang(): Language {
  return { id: uid(), language: "", proficiency: "Intermediate" };
}
function emptyVol(): Volunteer {
  return { id: uid(), organization: "", role: "", startDate: "", endDate: "", current: false, description: "" };
}
function emptyAward(): AwardEntry {
  return { id: uid(), title: "", issuer: "", year: "", description: "" };
}
function emptyPub(): Publication {
  return { id: uid(), title: "", publisher: "", year: "", url: "" };
}
function emptyRef(): Reference {
  return { id: uid(), name: "", title: "", company: "", contact: "" };
}

const OPTIONAL_SECTIONS: { key: OptionalSectionKey; label: string; icon: React.ReactNode }[] = [
  { key: "volunteer",     label: "Volunteer Experience",   icon: <Heart className="h-4 w-4" /> },
  { key: "awards",        label: "Awards & Achievements",  icon: <Trophy className="h-4 w-4" /> },
  { key: "interests",     label: "Interests & Hobbies",    icon: <Star className="h-4 w-4" /> },
  { key: "publications",  label: "Publications",           icon: <BookOpen className="h-4 w-4" /> },
  { key: "references",    label: "References",             icon: <Users className="h-4 w-4" /> },
];

interface EnhanceResponse extends EnhanceResult {
  resume?: { id: string };
  warning?: string;
}

type Mode = "form" | "upload";
type Section = "contact" | "experience" | "education" | "skills" | "projects" | "certifications" | "languages" | OptionalSectionKey;

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  icon, title, open, onToggle, onAdd, addLabel,
}: {
  icon: React.ReactNode; title: string; open: boolean;
  onToggle: () => void; onAdd?: () => void; addLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
      <button type="button" onClick={onToggle} className="flex items-center gap-2 text-left">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
        <span className="font-semibold text-slate-900">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {onAdd && (
        <button
          type="button" onClick={onAdd}
          className="flex items-center gap-1 rounded-lg border border-dashed border-brand-300 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
        >
          <Plus className="h-3 w-3" /> {addLabel}
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ResumeBuilderClient({
  isPro, defaultName, defaultEmail, resumesUsed = 0, freeLimit = 5,
}: {
  isPro: boolean; defaultName: string; defaultEmail: string;
  resumesUsed?: number; freeLimit?: number;
}) {
  const [mode, setMode] = useState<Mode>("form");
  const [resumeUsedCount, setResumeUsedCount] = useState(resumesUsed);

  // Contact
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [summary, setSummary] = useState("");

  // Sections
  const [experiences, setExperiences] = useState<Experience[]>([emptyExp()]);
  const [educations, setEducations] = useState<Education[]>([emptyEdu()]);
  const [skills, setSkills] = useState({ technical: "", tools: "", soft: "" });
  const [projects, setProjects] = useState<Project[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [languages, setLanguages] = useState<Language[]>([{ id: uid(), language: "English", proficiency: "Native/Fluent" }]);

  // Optional sections
  const [activeOptional, setActiveOptional] = useState<Set<OptionalSectionKey>>(new Set());
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [awardEntries, setAwardEntries] = useState<AwardEntry[]>([]);
  const [interests, setInterests] = useState("");
  const [publications, setPublications] = useState<Publication[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);

  function addOptionalSection(key: OptionalSectionKey) {
    setActiveOptional((prev) => new Set(Array.from(prev).concat(key)));
    setOpenSections((o) => ({ ...o, [key]: true }));
    if (key === "volunteer" && volunteers.length === 0) setVolunteers([emptyVol()]);
    if (key === "awards" && awardEntries.length === 0) setAwardEntries([emptyAward()]);
    if (key === "publications" && publications.length === 0) setPublications([emptyPub()]);
    if (key === "references" && references.length === 0) setReferences([emptyRef()]);
  }
  function removeOptionalSection(key: OptionalSectionKey) {
    setActiveOptional((prev) => { const n = new Set(Array.from(prev)); n.delete(key); return n; });
  }

  // Open/close sections
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    contact: true, experience: true, education: true,
    skills: true, projects: false, certifications: false, languages: false,
    volunteer: false, awards: false, interests: false, publications: false, references: false,
  });
  function toggleSection(s: Section) {
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  // Upload mode
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedText, setUploadedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnhanceResponse | null>(null);

  // ── File upload ────────────────────────────────────────────────────────────
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
      setUploadedText(data.text);
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

  // ── Build resume text ──────────────────────────────────────────────────────
  function buildResumeText(): string {
    if (mode === "upload") return uploadedText.trim();

    const lines: string[] = [];

    if (name) lines.push(`Name: ${name}`);
    if (email) lines.push(`Email: ${email}`);
    if (phone) lines.push(`Phone: ${phone}`);
    if (location) lines.push(`Location: ${location}`);
    if (linkedin) lines.push(`LinkedIn: ${linkedin}`);
    if (portfolio) lines.push(`Portfolio: ${portfolio}`);
    if (targetRole) lines.push(`Target Role: ${targetRole}`);
    lines.push("");

    if (summary) lines.push(`PROFESSIONAL SUMMARY\n${summary}\n`);

    const validExp = experiences.filter((e) => e.company || e.role);
    if (validExp.length) {
      lines.push("WORK EXPERIENCE");
      validExp.forEach((e) => {
        const period = e.current
          ? `${e.startDate} – Present`
          : `${e.startDate}${e.endDate ? ` – ${e.endDate}` : ""}`;
        lines.push(`${e.role} at ${e.company}${e.location ? `, ${e.location}` : ""}${period ? `  (${period})` : ""}`);
        if (e.description) lines.push(e.description);
        lines.push("");
      });
    }

    const validEdu = educations.filter((e) => e.degree || e.institution);
    if (validEdu.length) {
      lines.push("EDUCATION");
      validEdu.forEach((e) => {
        const yr = [e.startYear, e.endYear].filter(Boolean).join(" – ");
        lines.push(`${e.degree}${e.field ? ` in ${e.field}` : ""}${e.institution ? ` — ${e.institution}` : ""}${yr ? ` (${yr})` : ""}${e.grade ? `  |  ${e.grade}` : ""}`);
      });
      lines.push("");
    }

    const skillParts = [
      skills.technical && `Technical: ${skills.technical}`,
      skills.tools && `Tools & Frameworks: ${skills.tools}`,
      skills.soft && `Soft Skills: ${skills.soft}`,
    ].filter(Boolean);
    if (skillParts.length) lines.push(`SKILLS\n${skillParts.join("\n")}\n`);

    const validProj = projects.filter((p) => p.name);
    if (validProj.length) {
      lines.push("PROJECTS");
      validProj.forEach((p) => {
        lines.push(`${p.name}${p.url ? ` (${p.url})` : ""}${p.tech ? `  |  ${p.tech}` : ""}`);
        if (p.description) lines.push(p.description);
        lines.push("");
      });
    }

    const validCerts = certifications.filter((c) => c.name);
    if (validCerts.length) {
      lines.push("CERTIFICATIONS");
      validCerts.forEach((c) => lines.push(`${c.name}${c.issuer ? ` — ${c.issuer}` : ""}${c.year ? ` (${c.year})` : ""}`));
      lines.push("");
    }

    const validLangs = languages.filter((l) => l.language);
    if (validLangs.length) {
      lines.push("LANGUAGES");
      lines.push(validLangs.map((l) => `${l.language} (${l.proficiency})`).join(", "));
      lines.push("");
    }

    // Optional sections
    const validVols = volunteers.filter((v) => v.organization || v.role);
    if (activeOptional.has("volunteer") && validVols.length) {
      lines.push("VOLUNTEER EXPERIENCE");
      validVols.forEach((v) => {
        const period = v.current ? `${v.startDate} – Present` : `${v.startDate}${v.endDate ? ` – ${v.endDate}` : ""}`;
        lines.push(`${v.role}${v.organization ? ` at ${v.organization}` : ""}${period ? `  (${period})` : ""}`);
        if (v.description) lines.push(v.description);
        lines.push("");
      });
    }

    const validAwards = awardEntries.filter((a) => a.title);
    if (activeOptional.has("awards") && validAwards.length) {
      lines.push("AWARDS & ACHIEVEMENTS");
      validAwards.forEach((a) => {
        lines.push(`${a.title}${a.issuer ? ` — ${a.issuer}` : ""}${a.year ? ` (${a.year})` : ""}`);
        if (a.description) lines.push(a.description);
        lines.push("");
      });
    }

    if (activeOptional.has("interests") && interests.trim()) {
      lines.push("INTERESTS & HOBBIES");
      lines.push(interests.trim());
      lines.push("");
    }

    const validPubs = publications.filter((p) => p.title);
    if (activeOptional.has("publications") && validPubs.length) {
      lines.push("PUBLICATIONS");
      validPubs.forEach((p) => {
        lines.push(`${p.title}${p.publisher ? ` — ${p.publisher}` : ""}${p.year ? ` (${p.year})` : ""}${p.url ? `  [${p.url}]` : ""}`);
        lines.push("");
      });
    }

    const validRefs = references.filter((r) => r.name);
    if (activeOptional.has("references") && validRefs.length) {
      lines.push("REFERENCES");
      validRefs.forEach((r) => {
        lines.push(`${r.name}${r.title ? `, ${r.title}` : ""}${r.company ? ` — ${r.company}` : ""}${r.contact ? `  |  ${r.contact}` : ""}`);
      });
      lines.push("");
    }

    return lines.join("\n").trim();
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setError(null);
    if (mode === "upload" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    const resumeText = buildResumeText();
    if (resumeText.length < 30) {
      setError("Please add more details before enhancing.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, targetRole, resumeText, title: targetRole ? `${targetRole} resume` : undefined }),
      });
      const data = await res.json();
      if (res.status === 403 && data?.error === "free_limit_reached") {
        setError("free_limit_reached");
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Enhancement failed.");
      setResult(data as EnhanceResponse);
      setResumeUsedCount(c => c + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Result view ────────────────────────────────────────────────────────────
  if (result) {
    const improvements = result.improvements ?? result.tips ?? [];
    return (
      <div className="space-y-8">
        {result.warning && <Alert tone="warning">{result.warning}</Alert>}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
            <AtsScoreRing score={result.atsScore ?? 0} />
            <p className="mt-3 text-center text-sm font-medium text-slate-700">ATS Score</p>
            <p className="mt-1 text-center text-xs text-slate-400">Estimated readability by applicant tracking systems</p>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">Top improvements</h3>
            {improvements.length ? (
              <ul className="mt-3 space-y-2.5">
                {improvements.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No specific suggestions returned.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Enhanced resume</h3>
          <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
            {result.enhancedResume || "(No enhanced text returned.)"}
          </pre>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Choose a template &amp; download</h3>
          <p className="mt-1 text-sm text-slate-500">Pick any free template and download your PDF instantly. Pro templates require an upgrade.</p>
          <div className="mt-5">
            <TemplatePicker
              isPro={isPro}
              fileBaseName={mode === "upload" ? (name || undefined) : undefined}
              baseData={
                mode === "upload"
                  ? { name: "", targetRole, enhancedText: result.enhancedResume || "", atsScore: result.atsScore ?? null }
                  : { name: name || "Your Name", targetRole, email, phone, location, linkedin, portfolio, enhancedText: result.enhancedResume || "", atsScore: result.atsScore ?? null }
              }
              onTemplateChange={(templateId) => {
                if (result.resume?.id) {
                  fetch("/api/resumes", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: result.resume.id, template_id: templateId }),
                  }).catch(() => {});
                }
              }}
            />
          </div>
        </div>

        <Button variant="secondary" onClick={() => { setResult(null); setError(null); }}>
          Enhance another resume
        </Button>
      </div>
    );
  }

  // ── Input view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("form")}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition ${mode === "form" ? "bg-brand-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
        >
          Build from scratch
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition ${mode === "upload" ? "bg-brand-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
        >
          Upload &amp; enhance
        </button>
      </div>

      {/* Usage badge for free users */}
      {!isPro && (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${resumeUsedCount >= freeLimit ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          <span>
            {resumeUsedCount >= freeLimit
              ? "You've used all 5 free enhancements."
              : `Free plan: ${resumeUsedCount} / ${freeLimit} resume enhancements used.`}
          </span>
          <a href="/billing" className="ml-4 shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition">
            Upgrade to Pro
          </a>
        </div>
      )}

      {/* ── UPLOAD MODE ── */}
      {mode === "upload" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Upload your existing resume</h2>
            <p className="mt-0.5 text-sm text-slate-500">We&apos;ll parse it and enhance it with AI — PDF, DOCX, or TXT accepted.</p>
          </div>

          {!uploadedFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 transition ${
                dragOver ? "border-brand-400 bg-brand-50" : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50"
              }`}
            >
              {uploading
                ? <Loader2 className="h-9 w-9 animate-spin text-brand-500" />
                : <Upload className="h-9 w-9 text-slate-300" />}
              <div className="text-center">
                <p className="font-medium text-slate-700">{uploading ? "Parsing your resume…" : "Drag & drop or click to upload"}</p>
                <p className="mt-1 text-sm text-slate-400">PDF · DOCX · TXT — up to 5 MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
                onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
              <FileText className="h-5 w-5 shrink-0 text-brand-600" />
              <p className="flex-1 truncate text-sm font-medium text-brand-800">{uploadedFile}</p>
              <button type="button" onClick={() => { setUploadedFile(null); setUploadedText(""); }} className="text-slate-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Input
            label="Full name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Santhosh Kumar"
          />
          <Combobox
            label="Target role (optional)"
            placeholder="Search role, e.g. Software Engineer"
            options={TARGET_ROLES}
            value={targetRole}
            onChange={setTargetRole}
            hint="Tailors the enhancement toward this role."
          />

          {uploadedText && (
            <Textarea
              label="Parsed resume text (editable)"
              rows={10}
              value={uploadedText}
              onChange={(e) => setUploadedText(e.target.value)}
            />
          )}

          {error === "free_limit_reached" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-sm font-semibold text-red-700">You&apos;ve used all {freeLimit} free enhancements.</p>
              <p className="mt-1 text-xs text-red-600">Upgrade to Pro for unlimited resume enhancements.</p>
              <a href="/billing" className="mt-3 inline-block rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
                Upgrade to Pro →
              </a>
            </div>
          ) : (
            <>
              {error && <Alert tone="error">{error}</Alert>}
              <Button size="lg" onClick={handleSubmit} loading={loading} disabled={uploading || !uploadedText || !name.trim() || (!isPro && resumeUsedCount >= freeLimit)}>
                Enhance with AI
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── FORM MODE ── */}
      {mode === "form" && (
        <div className="space-y-4">
          {/* Contact & basics */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <SectionHeader
              icon={<User className="h-4 w-4" />}
              title="Contact Information"
              open={openSections.contact}
              onToggle={() => toggleSection("contact")}
            />
            {openSections.contact && (
              <div className="space-y-4 pt-1">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Santhosh Kumar" />
                  <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State, Country" />
                  <Input label="LinkedIn URL" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/username" />
                  <Input label="Portfolio / GitHub URL" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="github.com/username" />
                </div>
                <Combobox
                  label="Target role *"
                  placeholder="Search or type your target role…"
                  options={TARGET_ROLES}
                  value={targetRole}
                  onChange={setTargetRole}
                  hint="Tailors the AI enhancement toward this specific role."
                />
                <Textarea
                  label="Professional summary"
                  rows={3}
                  placeholder="Write 2-3 sentences about your experience, strengths, and career goals…"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Work Experience */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <SectionHeader
              icon={<Briefcase className="h-4 w-4" />}
              title="Work Experience"
              open={openSections.experience}
              onToggle={() => toggleSection("experience")}
              onAdd={() => setExperiences((p) => [...p, emptyExp()])}
              addLabel="Add experience"
            />
            {openSections.experience && (
              <div className="space-y-6 pt-1">
                {experiences.map((exp, idx) => (
                  <div key={exp.id} className="relative rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Experience {idx + 1}
                      </span>
                      {experiences.length > 1 && (
                        <button type="button" onClick={() => setExperiences((p) => p.filter((e) => e.id !== exp.id))}
                          className="text-slate-300 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Job title / Role *" value={exp.role}
                        onChange={(e) => setExperiences((p) => p.map((x) => x.id === exp.id ? { ...x, role: e.target.value } : x))}
                        placeholder="e.g. Software Engineer" />
                      <Input label="Company *" value={exp.company}
                        onChange={(e) => setExperiences((p) => p.map((x) => x.id === exp.id ? { ...x, company: e.target.value } : x))}
                        placeholder="e.g. Infosys" />
                      <Input label="Location" value={exp.location}
                        onChange={(e) => setExperiences((p) => p.map((x) => x.id === exp.id ? { ...x, location: e.target.value } : x))}
                        placeholder="e.g. Bengaluru, India" />
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Start date" value={exp.startDate}
                          onChange={(e) => setExperiences((p) => p.map((x) => x.id === exp.id ? { ...x, startDate: e.target.value } : x))}
                          placeholder="Jan 2022" />
                        <Input label="End date" value={exp.endDate} disabled={exp.current}
                          onChange={(e) => setExperiences((p) => p.map((x) => x.id === exp.id ? { ...x, endDate: e.target.value } : x))}
                          placeholder="Dec 2023" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={exp.current}
                        onChange={(e) => setExperiences((p) => p.map((x) => x.id === exp.id ? { ...x, current: e.target.checked, endDate: "" } : x))}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600" />
                      I currently work here
                    </label>
                    <Textarea
                      label="Key responsibilities & achievements"
                      rows={4}
                      placeholder="• Led a team of 5 to build...\n• Reduced API latency by 40%...\n• Built CI/CD pipeline using..."
                      value={exp.description}
                      onChange={(e) => setExperiences((p) => p.map((x) => x.id === exp.id ? { ...x, description: e.target.value } : x))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <SectionHeader
              icon={<GraduationCap className="h-4 w-4" />}
              title="Education"
              open={openSections.education}
              onToggle={() => toggleSection("education")}
              onAdd={() => setEducations((p) => [...p, emptyEdu()])}
              addLabel="Add education"
            />
            {openSections.education && (
              <div className="space-y-6 pt-1">
                {educations.map((edu, idx) => (
                  <div key={edu.id} className="relative rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Education {idx + 1}</span>
                      {educations.length > 1 && (
                        <button type="button" onClick={() => setEducations((p) => p.filter((e) => e.id !== edu.id))}
                          className="text-slate-300 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Combobox
                        label="Degree / Qualification *"
                        placeholder="Search degree, e.g. B.Tech"
                        options={DEGREES}
                        value={edu.degree}
                        onChange={(v) => setEducations((p) => p.map((x) => x.id === edu.id ? { ...x, degree: v } : x))}
                      />
                      <Combobox
                        label="Field of study / Course *"
                        placeholder="Search field, e.g. Computer Science"
                        options={FIELDS_OF_STUDY}
                        value={edu.field}
                        onChange={(v) => setEducations((p) => p.map((x) => x.id === edu.id ? { ...x, field: v } : x))}
                      />
                      <Input label="Institution / University *" value={edu.institution}
                        onChange={(e) => setEducations((p) => p.map((x) => x.id === edu.id ? { ...x, institution: e.target.value } : x))}
                        placeholder="e.g. Anna University" />
                      <Input label="Grade / CGPA / Percentage" value={edu.grade}
                        onChange={(e) => setEducations((p) => p.map((x) => x.id === edu.id ? { ...x, grade: e.target.value } : x))}
                        placeholder="e.g. 8.5 CGPA or 85%" />
                      <Input label="Start year" value={edu.startYear}
                        onChange={(e) => setEducations((p) => p.map((x) => x.id === edu.id ? { ...x, startYear: e.target.value } : x))}
                        placeholder="2019" />
                      <Input label="End year" value={edu.endYear}
                        onChange={(e) => setEducations((p) => p.map((x) => x.id === edu.id ? { ...x, endYear: e.target.value } : x))}
                        placeholder="2023" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <SectionHeader
              icon={<Code2 className="h-4 w-4" />}
              title="Skills"
              open={openSections.skills}
              onToggle={() => toggleSection("skills")}
            />
            {openSections.skills && (
              <div className="space-y-3 pt-1">
                <Textarea
                  label="Technical skills"
                  rows={2}
                  placeholder="e.g. JavaScript, TypeScript, React, Node.js, Python, SQL, REST APIs"
                  value={skills.technical}
                  onChange={(e) => setSkills((s) => ({ ...s, technical: e.target.value }))}
                />
                <Textarea
                  label="Tools & frameworks"
                  rows={2}
                  placeholder="e.g. Git, Docker, AWS, Figma, Jira, VS Code, Next.js, Tailwind CSS"
                  value={skills.tools}
                  onChange={(e) => setSkills((s) => ({ ...s, tools: e.target.value }))}
                />
                <Textarea
                  label="Soft skills"
                  rows={2}
                  placeholder="e.g. Leadership, Communication, Problem-solving, Teamwork, Time management"
                  value={skills.soft}
                  onChange={(e) => setSkills((s) => ({ ...s, soft: e.target.value }))}
                />
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <SectionHeader
              icon={<FolderGit2 className="h-4 w-4" />}
              title="Projects"
              open={openSections.projects}
              onToggle={() => toggleSection("projects")}
              onAdd={() => { setProjects((p) => [...p, emptyProj()]); setOpenSections((o) => ({ ...o, projects: true })); }}
              addLabel="Add project"
            />
            {openSections.projects && (
              <div className="space-y-4 pt-1">
                {projects.length === 0 && (
                  <p className="text-sm text-slate-400">No projects added yet. Click &quot;Add project&quot; above.</p>
                )}
                {projects.map((proj, idx) => (
                  <div key={proj.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Project {idx + 1}</span>
                      <button type="button" onClick={() => setProjects((p) => p.filter((x) => x.id !== proj.id))}
                        className="text-slate-300 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Project name *" value={proj.name}
                        onChange={(e) => setProjects((p) => p.map((x) => x.id === proj.id ? { ...x, name: e.target.value } : x))}
                        placeholder="e.g. E-commerce Platform" />
                      <Input label="Live URL / GitHub" value={proj.url}
                        onChange={(e) => setProjects((p) => p.map((x) => x.id === proj.id ? { ...x, url: e.target.value } : x))}
                        placeholder="github.com/username/repo" />
                      <div className="sm:col-span-2">
                        <Input label="Technologies used" value={proj.tech}
                          onChange={(e) => setProjects((p) => p.map((x) => x.id === proj.id ? { ...x, tech: e.target.value } : x))}
                          placeholder="React, Node.js, MongoDB, AWS" />
                      </div>
                    </div>
                    <Textarea label="Description" rows={3} value={proj.description}
                      placeholder="What did you build? What problem did it solve? What was your impact?"
                      onChange={(e) => setProjects((p) => p.map((x) => x.id === proj.id ? { ...x, description: e.target.value } : x))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <SectionHeader
              icon={<Award className="h-4 w-4" />}
              title="Certifications"
              open={openSections.certifications}
              onToggle={() => toggleSection("certifications")}
              onAdd={() => { setCertifications((p) => [...p, emptyCert()]); setOpenSections((o) => ({ ...o, certifications: true })); }}
              addLabel="Add certification"
            />
            {openSections.certifications && (
              <div className="space-y-3 pt-1">
                {certifications.length === 0 && (
                  <p className="text-sm text-slate-400">No certifications added yet.</p>
                )}
                {certifications.map((cert, idx) => (
                  <div key={cert.id} className="flex items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="grid flex-1 gap-3 sm:grid-cols-3">
                      <Input label="Certification name *" value={cert.name}
                        onChange={(e) => setCertifications((p) => p.map((x) => x.id === cert.id ? { ...x, name: e.target.value } : x))}
                        placeholder="e.g. AWS Solutions Architect" />
                      <Input label="Issuing organization" value={cert.issuer}
                        onChange={(e) => setCertifications((p) => p.map((x) => x.id === cert.id ? { ...x, issuer: e.target.value } : x))}
                        placeholder="e.g. Amazon Web Services" />
                      <Input label="Year" value={cert.year}
                        onChange={(e) => setCertifications((p) => p.map((x) => x.id === cert.id ? { ...x, year: e.target.value } : x))}
                        placeholder="2024" />
                    </div>
                    <button type="button" onClick={() => setCertifications((p) => p.filter((x) => x.id !== cert.id))}
                      className="mb-2 text-slate-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Languages */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <SectionHeader
              icon={<Globe className="h-4 w-4" />}
              title="Languages"
              open={openSections.languages}
              onToggle={() => toggleSection("languages")}
              onAdd={() => { setLanguages((p) => [...p, emptyLang()]); setOpenSections((o) => ({ ...o, languages: true })); }}
              addLabel="Add language"
            />
            {openSections.languages && (
              <div className="space-y-3 pt-1">
                {languages.map((lang) => (
                  <div key={lang.id} className="flex items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <Combobox
                        label="Language"
                        placeholder="Search language…"
                        options={LANGUAGES}
                        value={lang.language}
                        onChange={(v) => setLanguages((p) => p.map((x) => x.id === lang.id ? { ...x, language: v } : x))}
                      />
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Proficiency</label>
                        <select
                          value={lang.proficiency}
                          onChange={(e) => setLanguages((p) => p.map((x) => x.id === lang.id ? { ...x, proficiency: e.target.value } : x))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        >
                          {PROFICIENCY_LEVELS.map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    {languages.length > 1 && (
                      <button type="button" onClick={() => setLanguages((p) => p.filter((x) => x.id !== lang.id))}
                        className="mb-2 text-slate-300 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Optional sections ── */}
          {activeOptional.has("volunteer") && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <button type="button" onClick={() => toggleSection("volunteer")} className="flex items-center gap-2 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Heart className="h-4 w-4" /></span>
                  <span className="font-semibold text-slate-900">Volunteer Experience</span>
                  {openSections.volunteer ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setVolunteers((p) => [...p, emptyVol()]); setOpenSections((o) => ({ ...o, volunteer: true })); }}
                    className="flex items-center gap-1 rounded-lg border border-dashed border-brand-300 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                  <button type="button" onClick={() => removeOptionalSection("volunteer")} className="text-slate-300 hover:text-red-500" title="Remove section">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {openSections.volunteer && (
                <div className="space-y-4 pt-1">
                  {volunteers.map((vol, idx) => (
                    <div key={vol.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Entry {idx + 1}</span>
                        {volunteers.length > 1 && (
                          <button type="button" onClick={() => setVolunteers((p) => p.filter((x) => x.id !== vol.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input label="Role / Position" value={vol.role} onChange={(e) => setVolunteers((p) => p.map((x) => x.id === vol.id ? { ...x, role: e.target.value } : x))} placeholder="e.g. Event Coordinator" />
                        <Input label="Organization" value={vol.organization} onChange={(e) => setVolunteers((p) => p.map((x) => x.id === vol.id ? { ...x, organization: e.target.value } : x))} placeholder="e.g. Red Cross" />
                        <Input label="Start date" value={vol.startDate} onChange={(e) => setVolunteers((p) => p.map((x) => x.id === vol.id ? { ...x, startDate: e.target.value } : x))} placeholder="Jan 2022" />
                        <Input label="End date" value={vol.endDate} disabled={vol.current} onChange={(e) => setVolunteers((p) => p.map((x) => x.id === vol.id ? { ...x, endDate: e.target.value } : x))} placeholder="Dec 2023" />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={vol.current} onChange={(e) => setVolunteers((p) => p.map((x) => x.id === vol.id ? { ...x, current: e.target.checked, endDate: "" } : x))} className="h-4 w-4 rounded border-slate-300 accent-brand-600" />
                        Currently volunteering here
                      </label>
                      <Textarea label="Description" rows={3} placeholder="What did you do? What impact did you make?" value={vol.description} onChange={(e) => setVolunteers((p) => p.map((x) => x.id === vol.id ? { ...x, description: e.target.value } : x))} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeOptional.has("awards") && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <button type="button" onClick={() => toggleSection("awards")} className="flex items-center gap-2 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Trophy className="h-4 w-4" /></span>
                  <span className="font-semibold text-slate-900">Awards & Achievements</span>
                  {openSections.awards ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setAwardEntries((p) => [...p, emptyAward()]); setOpenSections((o) => ({ ...o, awards: true })); }}
                    className="flex items-center gap-1 rounded-lg border border-dashed border-brand-300 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                  <button type="button" onClick={() => removeOptionalSection("awards")} className="text-slate-300 hover:text-red-500" title="Remove section"><X className="h-4 w-4" /></button>
                </div>
              </div>
              {openSections.awards && (
                <div className="space-y-3 pt-1">
                  {awardEntries.map((aw, idx) => (
                    <div key={aw.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Award {idx + 1}</span>
                        {awardEntries.length > 1 && (
                          <button type="button" onClick={() => setAwardEntries((p) => p.filter((x) => x.id !== aw.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Input label="Award / Achievement *" value={aw.title} onChange={(e) => setAwardEntries((p) => p.map((x) => x.id === aw.id ? { ...x, title: e.target.value } : x))} placeholder="e.g. Best Employee of the Year" />
                        <Input label="Issuing organization" value={aw.issuer} onChange={(e) => setAwardEntries((p) => p.map((x) => x.id === aw.id ? { ...x, issuer: e.target.value } : x))} placeholder="e.g. Google" />
                        <Input label="Year" value={aw.year} onChange={(e) => setAwardEntries((p) => p.map((x) => x.id === aw.id ? { ...x, year: e.target.value } : x))} placeholder="2024" />
                      </div>
                      <Textarea label="Description (optional)" rows={2} placeholder="Brief description of the achievement…" value={aw.description} onChange={(e) => setAwardEntries((p) => p.map((x) => x.id === aw.id ? { ...x, description: e.target.value } : x))} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeOptional.has("interests") && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <button type="button" onClick={() => toggleSection("interests")} className="flex items-center gap-2 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Star className="h-4 w-4" /></span>
                  <span className="font-semibold text-slate-900">Interests & Hobbies</span>
                  {openSections.interests ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                <button type="button" onClick={() => removeOptionalSection("interests")} className="text-slate-300 hover:text-red-500" title="Remove section"><X className="h-4 w-4" /></button>
              </div>
              {openSections.interests && (
                <div className="pt-1">
                  <Textarea rows={2} placeholder="e.g. Photography, Open-source contribution, Chess, Hiking, Reading" value={interests} onChange={(e) => setInterests(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {activeOptional.has("publications") && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <button type="button" onClick={() => toggleSection("publications")} className="flex items-center gap-2 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><BookOpen className="h-4 w-4" /></span>
                  <span className="font-semibold text-slate-900">Publications</span>
                  {openSections.publications ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setPublications((p) => [...p, emptyPub()]); setOpenSections((o) => ({ ...o, publications: true })); }}
                    className="flex items-center gap-1 rounded-lg border border-dashed border-brand-300 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                  <button type="button" onClick={() => removeOptionalSection("publications")} className="text-slate-300 hover:text-red-500" title="Remove section"><X className="h-4 w-4" /></button>
                </div>
              </div>
              {openSections.publications && (
                <div className="space-y-3 pt-1">
                  {publications.map((pub, idx) => (
                    <div key={pub.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Publication {idx + 1}</span>
                        {publications.length > 1 && (
                          <button type="button" onClick={() => setPublications((p) => p.filter((x) => x.id !== pub.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input label="Title *" value={pub.title} onChange={(e) => setPublications((p) => p.map((x) => x.id === pub.id ? { ...x, title: e.target.value } : x))} placeholder="e.g. Deep Learning for NLP" />
                        <Input label="Publisher / Journal" value={pub.publisher} onChange={(e) => setPublications((p) => p.map((x) => x.id === pub.id ? { ...x, publisher: e.target.value } : x))} placeholder="e.g. IEEE Transactions" />
                        <Input label="Year" value={pub.year} onChange={(e) => setPublications((p) => p.map((x) => x.id === pub.id ? { ...x, year: e.target.value } : x))} placeholder="2024" />
                        <Input label="URL / DOI" value={pub.url} onChange={(e) => setPublications((p) => p.map((x) => x.id === pub.id ? { ...x, url: e.target.value } : x))} placeholder="https://doi.org/..." />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeOptional.has("references") && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <button type="button" onClick={() => toggleSection("references")} className="flex items-center gap-2 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Users className="h-4 w-4" /></span>
                  <span className="font-semibold text-slate-900">References</span>
                  {openSections.references ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setReferences((p) => [...p, emptyRef()]); setOpenSections((o) => ({ ...o, references: true })); }}
                    className="flex items-center gap-1 rounded-lg border border-dashed border-brand-300 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                  <button type="button" onClick={() => removeOptionalSection("references")} className="text-slate-300 hover:text-red-500" title="Remove section"><X className="h-4 w-4" /></button>
                </div>
              </div>
              {openSections.references && (
                <div className="space-y-3 pt-1">
                  {references.map((ref, idx) => (
                    <div key={ref.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reference {idx + 1}</span>
                        {references.length > 1 && (
                          <button type="button" onClick={() => setReferences((p) => p.filter((x) => x.id !== ref.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input label="Name *" value={ref.name} onChange={(e) => setReferences((p) => p.map((x) => x.id === ref.id ? { ...x, name: e.target.value } : x))} placeholder="e.g. John Smith" />
                        <Input label="Job title" value={ref.title} onChange={(e) => setReferences((p) => p.map((x) => x.id === ref.id ? { ...x, title: e.target.value } : x))} placeholder="e.g. Senior Manager" />
                        <Input label="Company" value={ref.company} onChange={(e) => setReferences((p) => p.map((x) => x.id === ref.id ? { ...x, company: e.target.value } : x))} placeholder="e.g. Infosys" />
                        <Input label="Email / Phone" value={ref.contact} onChange={(e) => setReferences((p) => p.map((x) => x.id === ref.id ? { ...x, contact: e.target.value } : x))} placeholder="john@company.com" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add optional section picker */}
          {OPTIONAL_SECTIONS.some((s) => !activeOptional.has(s.key)) && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5">
              <p className="mb-3 text-sm font-medium text-slate-500">Add more sections</p>
              <div className="flex flex-wrap gap-2">
                {OPTIONAL_SECTIONS.filter((s) => !activeOptional.has(s.key)).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => addOptionalSection(s.key)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:border-brand-300 hover:text-brand-600 transition"
                  >
                    {s.icon}
                    <Plus className="h-3 w-3" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error === "free_limit_reached" ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
              <p className="text-sm font-semibold text-red-700">You&apos;ve used all {freeLimit} free enhancements.</p>
              <p className="mt-1 text-xs text-red-600">Upgrade to Pro for unlimited resume enhancements.</p>
              <a href="/billing" className="mt-3 inline-block rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
                Upgrade to Pro →
              </a>
            </div>
          ) : (
            <>
              {error && <Alert tone="error">{error}</Alert>}
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <Button size="lg" onClick={handleSubmit} loading={loading} disabled={!isPro && resumeUsedCount >= freeLimit}>
                  {loading ? "Enhancing with AI…" : "Enhance with AI"}
                </Button>
                {loading && <span className="text-sm text-slate-500">Analysing and rewriting your resume — takes ~20 seconds.</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
