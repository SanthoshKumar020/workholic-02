"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Plus, Trash2, ExternalLink, Globe } from "lucide-react";

interface Cert { title: string; completedAt: string; }

interface Props {
  initialUsername: string;
  initialBio: string;
  initialIsPublic: boolean;
  initialLinkedin: string;
  initialGithub: string;
  initialPortfolio: string;
  initialCerts: Cert[];
  roadmapOptions: string[];
  userId: string;
  profileName: string;
}

export function PublicProfileSetupClient({
  initialUsername, initialBio, initialIsPublic, initialLinkedin,
  initialGithub, initialPortfolio, initialCerts, roadmapOptions, profileName,
}: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [linkedin, setLinkedin] = useState(initialLinkedin);
  const [github, setGithub] = useState(initialGithub);
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [certs, setCerts] = useState<Cert[]>(initialCerts);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add cert
  const [addingCert, setAddingCert] = useState(false);
  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertDate, setNewCertDate] = useState(new Date().toISOString().slice(0, 10));

  function addCert() {
    if (!newCertTitle.trim()) return;
    setCerts((c) => [...c, { title: newCertTitle.trim(), completedAt: newCertDate }]);
    setNewCertTitle("");
    setAddingCert(false);
  }

  function removeCert(i: number) {
    setCerts((c) => c.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/public-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase() || undefined,
          public_bio: bio,
          is_public: isPublic,
          linkedin_url: linkedin,
          github_url: github,
          portfolio_url: portfolio,
          completed_certs: certs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const publicUrl = username ? `/p/${username}` : null;

  return (
    <div className="space-y-8">
      {/* Public profile toggle */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="font-bold text-slate-900">Public Profile</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Share your career achievements with recruiters and your network. Post it on LinkedIn.
            </p>
          </div>
          <button type="button" onClick={() => setIsPublic((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${isPublic ? "bg-brand-500" : "bg-slate-200"}`}>
            <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${isPublic ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        {isPublic && publicUrl && (
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-mono text-slate-600">{typeof window !== "undefined" ? window.location.origin : "https://yourapp.com"}{publicUrl}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => navigator.clipboard.writeText(`${typeof window !== "undefined" ? window.location.origin : ""}${publicUrl}`)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
                Copy link
              </button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition">
                <ExternalLink className="h-3 w-3" /> Preview
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Profile fields */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Profile Details</h2>
        </div>
        <div className="p-5 space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="e.g. santhosh-kumar"
            hint="3-30 chars · lowercase letters, numbers, hyphens · your public URL: /p/username"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Bio</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="A short bio about your career journey, skills, and goals…" />
          </div>
          <Input label="LinkedIn URL" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" type="url" />
          <Input label="GitHub URL" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/yourusername" type="url" />
          <Input label="Portfolio / Website" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://yourwebsite.com" type="url" />
        </div>
      </div>

      {/* Certificates */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Certificates & Completions</h2>
            <p className="mt-0.5 text-xs text-slate-400">Add completed roadmaps, courses, or achievements. These appear on your public profile with a verifiable certificate ID.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAddingCert(true)}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>

        <div className="p-5 space-y-3">
          {certs.length === 0 && !addingCert && (
            <p className="py-6 text-center text-sm text-slate-400">No certificates yet. Add your completed roadmaps and courses.</p>
          )}

          {certs.map((cert, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{cert.title}</p>
                {cert.completedAt && (
                  <p className="text-xs text-slate-400">
                    Completed {new Date(cert.completedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => removeCert(i)} className="text-slate-300 hover:text-red-500 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {addingCert && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Roadmap / Course title</label>
                <select value={newCertTitle} onChange={(e) => setNewCertTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
                  <option value="">Select or type below…</option>
                  {roadmapOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <input value={newCertTitle} onChange={(e) => setNewCertTitle(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  placeholder="Or type a custom title…" />
              </div>
              <Input label="Completion date" type="date" value={newCertDate} onChange={(e) => setNewCertDate(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={addCert} disabled={!newCertTitle.trim()} size="sm">Add Certificate</Button>
                <Button variant="outline" size="sm" onClick={() => setAddingCert(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LinkedIn tip */}
      {isPublic && username && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <Globe className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Share on LinkedIn</p>
            <p className="mt-0.5 text-xs text-blue-700">
              Copy your profile link and post it on LinkedIn with: &ldquo;Excited to share my verified career profile and certifications!&rdquo; This gets you visibility and markets ResumeBoost for free.
            </p>
          </div>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      <Button size="lg" onClick={save} loading={saving} className="w-full">
        {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : "Save Profile Settings"}
      </Button>
    </div>
  );
}
