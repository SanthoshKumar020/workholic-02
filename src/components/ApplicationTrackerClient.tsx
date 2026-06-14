"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, X, ExternalLink, AlertCircle, Copy, CheckCheck, Loader2, Trash2, ChevronRight, Mail } from "lucide-react";

interface Application {
  id: string;
  company: string;
  role: string;
  url?: string;
  location?: string;
  salary?: string;
  applied_date?: string;
  status: "applied" | "phone_screen" | "interview" | "offer" | "rejected";
  notes?: string;
  contact_name?: string;
  contact_email?: string;
}

const COLUMNS: { key: Application["status"]; label: string; color: string; dot: string }[] = [
  { key: "applied",      label: "Applied",       color: "border-blue-200 bg-blue-50",    dot: "bg-blue-400" },
  { key: "phone_screen", label: "Phone Screen",  color: "border-purple-200 bg-purple-50", dot: "bg-purple-400" },
  { key: "interview",    label: "Interview",     color: "border-amber-200 bg-amber-50",  dot: "bg-amber-400" },
  { key: "offer",        label: "Offer",         color: "border-green-200 bg-green-50",  dot: "bg-green-500" },
  { key: "rejected",     label: "Rejected",      color: "border-red-200 bg-red-50",      dot: "bg-red-400" },
];

function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function followUpDue(app: Application): boolean {
  return (app.status === "applied" || app.status === "phone_screen") && daysSince(app.applied_date) >= 7;
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

function AppModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Application>;
  onSave: (data: Partial<Application>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Application>>(
    initial ?? { status: "applied", applied_date: new Date().toISOString().slice(0, 10) }
  );
  const [saving, setSaving] = useState(false);

  function set(k: keyof Application, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">{initial?.id ? "Edit Application" : "Add Application"}</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="grid gap-3 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Company *" value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} required placeholder="Google" />
          </div>
          <div className="sm:col-span-2">
            <Input label="Role *" value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} required placeholder="Software Engineer" />
          </div>
          <Input label="Job URL" value={form.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://..." type="url" />
          <Input label="Location" value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Remote / Bangalore" />
          <Input label="Salary / Package" value={form.salary ?? ""} onChange={(e) => set("salary", e.target.value)} placeholder="₹15-20 LPA" />
          <Input label="Date Applied" type="date" value={form.applied_date ?? ""} onChange={(e) => set("applied_date", e.target.value)} />
          <Input label="Contact Name" value={form.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value)} placeholder="Recruiter name" />
          <Input label="Contact Email" value={form.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} placeholder="hr@company.com" type="email" />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <div className="flex flex-wrap gap-2">
              {COLUMNS.map((c) => (
                <button key={c.key} type="button"
                  onClick={() => set("status", c.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${form.status === c.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
            <textarea rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Interview rounds, referral, etc." />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>{initial?.id ? "Save Changes" : "Add Application"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detail panel (right slide-in) ─────────────────────────────────────────────

function DetailPanel({ app, onClose, onUpdate, onDelete }: {
  app: Application;
  onClose: () => void;
  onUpdate: (updated: Application) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function generateEmail() {
    setEmailLoading(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/tracker/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: app.company,
          role: app.role,
          applied_date: app.applied_date,
          contact_name: app.contact_name,
          notes: app.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmail(data);
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : "Failed to generate email.");
    } finally {
      setEmailLoading(false);
    }
  }

  async function moveStatus(status: Application["status"]) {
    const res = await fetch("/api/tracker", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: app.id, status }),
    });
    if (res.ok) { const d = await res.json(); onUpdate(d.application); }
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/tracker?id=${app.id}`, { method: "DELETE" });
    onDelete(app.id);
  }

  const col = COLUMNS.find((c) => c.key === app.status);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="font-bold text-slate-900">{app.company}</p>
            <p className="text-sm text-slate-500">{app.role}</p>
          </div>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Status</p>
            <div className="flex flex-wrap gap-2">
              {COLUMNS.map((c) => (
                <button key={c.key} type="button" onClick={() => moveStatus(c.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${app.status === c.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {app.applied_date && (
              <div>
                <p className="text-xs text-slate-400">Applied</p>
                <p className="font-medium text-slate-700">{new Date(app.applied_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                <p className="text-xs text-slate-400">{daysSince(app.applied_date)} days ago</p>
              </div>
            )}
            {app.location && <div><p className="text-xs text-slate-400">Location</p><p className="font-medium text-slate-700">{app.location}</p></div>}
            {app.salary && <div><p className="text-xs text-slate-400">Salary</p><p className="font-medium text-slate-700">{app.salary}</p></div>}
            {app.contact_name && <div><p className="text-xs text-slate-400">Contact</p><p className="font-medium text-slate-700">{app.contact_name}</p></div>}
            {app.contact_email && <div><p className="text-xs text-slate-400">Email</p><p className="font-medium text-slate-700 text-xs break-all">{app.contact_email}</p></div>}
          </div>

          {app.url && (
            <a href={app.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> View job posting
            </a>
          )}

          {app.notes && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Notes</p>
              <p className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-700">{app.notes}</p>
            </div>
          )}

          {/* Follow-up reminder */}
          {followUpDue(app) && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Follow-up recommended</p>
                <p className="text-xs text-amber-700">It&apos;s been {daysSince(app.applied_date)} days. A polite check-in increases response rate by 3×.</p>
              </div>
            </div>
          )}

          {/* AI Follow-up email */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Follow-up Email</p>
              <Button size="sm" variant="outline" onClick={generateEmail} loading={emailLoading}>
                <Mail className="h-3.5 w-3.5" /> Draft Email
              </Button>
            </div>
            {emailError && <p className="text-xs text-red-600">{emailError}</p>}
            {email && (
              <div className="space-y-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-400 mb-0.5">Subject</p>
                  <p className="text-sm font-semibold text-slate-800">{email.subject}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-400 mb-1">Body</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{email.body}</p>
                </div>
                <button type="button"
                  onClick={() => { navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline">
                  {copied ? <><CheckCheck className="h-3.5 w-3.5 text-green-500" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy email</>}
                </button>
              </div>
            )}
          </div>

          {/* Edit button */}
          {editing && (
            <AppModal
              initial={app}
              onSave={async (data) => {
                const res = await fetch("/api/tracker", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: app.id, ...data }),
                });
                if (res.ok) { const d = await res.json(); onUpdate(d.application); setEditing(false); }
              }}
              onClose={() => setEditing(false)}
            />
          )}

          <div className="flex justify-between border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Delete?</span>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50">
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-slate-500 hover:underline">Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function AppCard({ app, onClick }: { app: Application; onClick: () => void }) {
  const due = followUpDue(app);
  const days = daysSince(app.applied_date);
  return (
    <button type="button" onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200 group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm leading-snug truncate">{app.company}</p>
          <p className="text-xs text-slate-500 truncate">{app.role}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-400 mt-0.5 transition" />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {app.applied_date && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {days}d ago
          </span>
        )}
        {app.location && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 truncate max-w-[80px]">
            {app.location}
          </span>
        )}
        {due && (
          <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            <AlertCircle className="h-2.5 w-2.5" /> Follow up
          </span>
        )}
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ApplicationTrackerClient({ initialApplications }: { initialApplications: Application[] }) {
  const [apps, setApps] = useState<Application[]>(initialApplications);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<Application["status"]>("applied");

  const grouped = useMemo(() => {
    const map: Record<string, Application[]> = {};
    for (const col of COLUMNS) map[col.key] = apps.filter((a) => a.status === col.key);
    return map;
  }, [apps]);

  async function addApp(data: Partial<Application>) {
    const res = await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const d = await res.json();
      setApps((prev) => [d.application, ...prev]);
      setShowAdd(false);
    }
  }

  function updateApp(updated: Application) {
    setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelected(updated);
  }

  function deleteApp(id: string) {
    setApps((prev) => prev.filter((a) => a.id !== id));
    setSelected(null);
  }

  const totalFollowUp = apps.filter(followUpDue).length;

  return (
    <div>
      {/* Stats bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-3">
          {COLUMNS.map((c) => (
            <div key={c.key} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${c.dot}`} />
              <span className="text-sm text-slate-600">{c.label}: <strong>{grouped[c.key].length}</strong></span>
            </div>
          ))}
        </div>
        {totalFollowUp > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" /> {totalFollowUp} follow-up{totalFollowUp > 1 ? "s" : ""} due
          </span>
        )}
        <Button onClick={() => setShowAdd(true)} className="ml-auto">
          <Plus className="h-4 w-4" /> Add Application
        </Button>
      </div>

      {/* Mobile tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {COLUMNS.map((c) => (
          <button key={c.key} type="button" onClick={() => setActiveTab(c.key)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === c.key ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            {c.label} <span className="ml-1 opacity-60">{grouped[c.key].length}</span>
          </button>
        ))}
      </div>

      {/* Kanban: desktop all columns, mobile single tab */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-4">
        {COLUMNS.map((col) => (
          <div key={col.key}>
            <div className={`mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 ${col.color}`}>
              <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              <span className="text-xs font-bold text-slate-700">{col.label}</span>
              <span className="ml-auto rounded-full bg-white/60 px-1.5 text-[10px] font-bold text-slate-600">
                {grouped[col.key].length}
              </span>
            </div>
            <div className="space-y-2.5 min-h-[120px]">
              {grouped[col.key].length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-300">empty</div>
              ) : (
                grouped[col.key].map((app) => (
                  <AppCard key={app.id} app={app} onClick={() => setSelected(app)} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile single-column view */}
      <div className="lg:hidden space-y-2.5">
        {grouped[activeTab].length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
            No applications in {COLUMNS.find((c) => c.key === activeTab)?.label}
          </div>
        ) : (
          grouped[activeTab].map((app) => (
            <AppCard key={app.id} app={app} onClick={() => setSelected(app)} />
          ))
        )}
      </div>

      {/* Modals */}
      {showAdd && <AppModal onSave={addApp} onClose={() => setShowAdd(false)} />}
      {selected && (
        <DetailPanel
          app={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateApp}
          onDelete={deleteApp}
        />
      )}
    </div>
  );
}
