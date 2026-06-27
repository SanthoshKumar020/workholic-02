"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Link2, Mail, Users, Copy, Check, RotateCcw } from "lucide-react";
import { PlanUsageBadge, UpgradeWall } from "@/components/ui/PlanUsageBadge";

interface OutreachResult { message: string; subject: string | null; charCount?: number; tips: string[]; }
type TemplateType = "linkedin_dm" | "cold_email" | "referral";

const TABS: { key: TemplateType; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "linkedin_dm",  label: "LinkedIn DM",   icon: Link2,    desc: "Connection request under 300 chars" },
  { key: "cold_email",   label: "Cold Email",     icon: Mail,     desc: "Subject + 3-paragraph outreach email" },
  { key: "referral",     label: "Referral Ask",   icon: Users,    desc: "Professional referral request message" },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button type="button" onClick={copy}
      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function OutreachClient({
  defaultName, defaultRole,
  freeUsed = 0, freeLimit = 5, isPro = false,
}: {
  defaultName: string; defaultRole: string;
  freeUsed?: number; freeLimit?: number; isPro?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TemplateType>("linkedin_dm");
  const [yourName, setYourName] = useState(defaultName);
  const [yourRole, setYourRole] = useState(defaultRole);
  const [yourBackground, setYourBackground] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [contactName, setContactName] = useState("");
  const [mutualConnection, setMutualConnection] = useState("");

  const [results, setResults] = useState<Partial<Record<TemplateType, OutreachResult>>>({});
  const [loading, setLoading] = useState<TemplateType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const exhausted = !isPro && freeUsed >= freeLimit;

  async function generate(action: TemplateType) {
    if (!targetCompany.trim() || !targetRole.trim()) return;
    setLoading(action);
    setError(null);
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yourName, yourRole, yourBackground, targetCompany, targetRole, contactName, mutualConnection, action }),
      });
      const d = await res.json();
      if (res.status === 403 && d.error === "free_limit_reached") { setLimitReached(true); return; }
      if (!res.ok) throw new Error(d.error);
      setResults((prev) => ({ ...prev, [action]: d }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(null);
    }
  }

  const current = results[activeTab];

  return (
    <div className="space-y-5">
      {!isPro && (
        <PlanUsageBadge used={freeUsed} limit={freeLimit} feature="outreach" />
      )}
      {limitReached && <UpgradeWall limit={freeLimit} feature="outreach" />}
      {/* Form */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Your Details + Target</h3>
          <p className="text-sm text-slate-500">Fill once — generate all 3 templates from the same info</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Your Name", value: yourName, setter: setYourName, ph: "e.g. Riya Sharma" },
              { label: "Your Current/Recent Role", value: yourRole, setter: setYourRole, ph: "e.g. Software Engineer at XYZ" },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{f.label}</label>
                <input type="text" value={f.value} onChange={(e) => f.setter(e.target.value)} placeholder={f.ph}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Your Background (1-2 sentences)</label>
            <textarea rows={2} value={yourBackground} onChange={(e) => setYourBackground(e.target.value)}
              placeholder="e.g. 4 years in frontend engineering, built products used by 2M users, strong in React and system design…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Target Company *", value: targetCompany, setter: setTargetCompany, ph: "e.g. Google, Swiggy, CRED" },
              { label: "Target Role *", value: targetRole, setter: setTargetRole, ph: "e.g. Senior Software Engineer" },
              { label: "Contact Name (optional)", value: contactName, setter: setContactName, ph: "e.g. Amit Kumar — or leave blank" },
              { label: "Mutual Connection (optional)", value: mutualConnection, setter: setMutualConnection, ph: "e.g. Priya from IIT batch" },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{f.label}</label>
                <input type="text" value={f.value} onChange={(e) => f.setter(e.target.value)} placeholder={f.ph}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
              </div>
            ))}
          </div>
          {error && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      </div>

      {/* Tabs + generate */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-100">
          {TABS.map((t) => {
            const Icon = t.icon;
            const hasResult = !!results[t.key];
            return (
              <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                className={`flex flex-1 flex-col items-center gap-0.5 px-3 py-3.5 text-center transition border-b-2 ${
                  activeTab === t.key ? "border-brand-500 bg-brand-50 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}>
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-bold">{t.label}</span>
                  {hasResult && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                </div>
                <span className="hidden text-[10px] text-current opacity-60 sm:block">{t.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5 space-y-4">
          {current ? (
            <>
              {/* Subject line for email/referral */}
              {current.subject && (
                <div className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-600">Subject</p>
                    <p className="text-sm font-semibold text-slate-800">{current.subject}</p>
                  </div>
                  <CopyBtn text={current.subject} />
                </div>
              )}

              {/* Message */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Message</p>
                  <div className="flex items-center gap-2">
                    {activeTab === "linkedin_dm" && (
                      <span className={`text-xs font-bold ${current.message.length > 280 ? "text-red-600" : "text-slate-400"}`}>
                        {current.message.length}/300 chars
                      </span>
                    )}
                    <CopyBtn text={current.message.replace(/\\n/g, "\n")} />
                  </div>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed rounded-xl bg-slate-50 border border-slate-100 p-4 min-h-[100px]">
                  {current.message.replace(/\\n/g, "\n")}
                </pre>
              </div>

              {/* Tips */}
              {current.tips?.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 space-y-1">
                  {current.tips.map((t, i) => (
                    <p key={i} className="text-xs text-amber-800">💡 {t}</p>
                  ))}
                </div>
              )}

              <Button variant="outline" onClick={() => setResults((p) => { const n = { ...p }; delete n[activeTab]; return n; })} className="w-full">
                <RotateCcw className="h-4 w-4" /> Regenerate
              </Button>
            </>
          ) : (
            <Button onClick={() => generate(activeTab)} loading={loading === activeTab}
              disabled={!targetCompany.trim() || !targetRole.trim() || exhausted || limitReached} className="w-full" size="lg">
              {loading === activeTab ? "Generating…" : `Generate ${TABS.find((t) => t.key === activeTab)?.label}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
