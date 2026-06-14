"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import {
  TrendingUp, FileText, MessageSquare, Loader2, Send, RotateCcw, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Scientist", "ML Engineer", "DevOps Engineer", "Product Manager", "UI/UX Designer",
  "Data Analyst", "QA Engineer", "Solutions Architect", "Engineering Manager",
  "Business Analyst", "Marketing Manager", "Sales Executive",
];

const LOCATIONS = [
  "Bengaluru, India", "Mumbai, India", "Delhi/NCR, India", "Hyderabad, India", "Pune, India",
  "Chennai, India", "Remote (India)", "San Francisco, USA", "New York, USA", "London, UK",
  "Singapore", "Dubai, UAE",
];

const SCENARIOS = [
  { key: "new_offer", label: "Negotiating a new offer" },
  { key: "raise",     label: "Asking for a raise" },
  { key: "competing", label: "Leveraging a competing offer" },
  { key: "return",    label: "Returning after a counter-offer" },
];

const COMPANY_SIZES = ["Startup (< 50 people)", "Mid-size (50–500)", "Large (500+)", "MNC / FAANG"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketData {
  role: string; location: string; currency: string;
  ranges: { p25: number; median: number; p75: number; top10: number };
  totalComp: { base: string; bonus: string; equity: string; totalNote: string };
  byCompanyType: { type: string; range: string }[];
  factors: string[];
  negotiationTip: string;
}

interface ScriptData {
  scenario: string; opener: string; keyPhrases: string[];
  script: string;
  objections: { objection: string; response: string }[];
  doNot: string[];
  followUp: string;
}

interface ChatMsg { role: "user" | "assistant"; content: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, currency: string) {
  if (currency === "INR") return `₹${(n / 100000).toFixed(1)}L`;
  return `$${(n / 1000).toFixed(0)}k`;
}

function SalaryBar({ data }: { data: MarketData }) {
  const max = data.ranges.top10 * 1.05;
  const pct = (v: number) => Math.round((v / max) * 100);

  const bars = [
    { label: "25th %ile", value: data.ranges.p25,   color: "bg-slate-300" },
    { label: "Median",    value: data.ranges.median, color: "bg-blue-400" },
    { label: "75th %ile", value: data.ranges.p75,    color: "bg-brand-500" },
    { label: "Top 10%",   value: data.ranges.top10,  color: "bg-green-500" },
  ];

  return (
    <div className="space-y-3">
      {bars.map((b) => (
        <div key={b.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-slate-600">{b.label}</span>
            <span className="font-bold text-slate-900">{fmt(b.value, data.currency)}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100">
            <div className={`h-3 rounded-full ${b.color} transition-all duration-700`} style={{ width: `${pct(b.value)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab 1: Market Data ────────────────────────────────────────────────────────

function MarketDataTab({ initRole }: { initRole: string }) {
  const [role, setRole] = useState(initRole);
  const [location, setLocation] = useState("Bengaluru, India");
  const [experience, setExperience] = useState("3-5 years");
  const [companySize, setCompanySize] = useState("Mid-size (50–500)");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MarketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetch_() {
    if (!role.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "market", role, location, experience, companySize }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  const EXP_OPTIONS = ["0-1 year", "1-3 years", "3-5 years", "5-8 years", "8-12 years", "12+ years"];

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Market Salary Data</h3>
          <p className="text-sm text-slate-500">AI-sourced percentile ranges for your role and location</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Combobox label="Role *" placeholder="e.g. Software Engineer" options={ROLES} value={role} onChange={setRole} allowCustom />
            <Combobox label="Location" placeholder="e.g. Bengaluru" options={LOCATIONS} value={location} onChange={setLocation} allowCustom />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Experience</label>
              <div className="flex flex-wrap gap-1.5">
                {EXP_OPTIONS.map((e) => (
                  <button key={e} type="button" onClick={() => setExperience(e)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${experience === e ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Company Type</label>
              <div className="flex flex-wrap gap-1.5">
                {COMPANY_SIZES.map((s) => (
                  <button key={s} type="button" onClick={() => setCompanySize(s)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${companySize === s ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button onClick={fetch_} loading={loading} disabled={!role.trim()} className="w-full">
            <TrendingUp className="h-4 w-4" />
            {loading ? "Fetching market data…" : "Get Salary Data"}
          </Button>
        </div>
      </div>

      {data && (
        <div className="space-y-4">
          {/* Percentile bars */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-4 font-bold text-slate-900">
              {data.role} · {data.location} · Annual Salary ({data.currency})
            </h4>
            <SalaryBar data={data} />
          </div>

          {/* Total comp */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 font-bold text-slate-900">Total Compensation Breakdown</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Base Salary", value: data.totalComp.base },
                { label: "Bonus", value: data.totalComp.bonus },
                { label: "Equity / ESOP", value: data.totalComp.equity },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{item.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">{data.totalComp.totalNote}</p>
          </div>

          {/* By company type */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 font-bold text-slate-900">By Company Type</h4>
            <div className="divide-y divide-slate-100">
              {data.byCompanyType.map((c) => (
                <div key={c.type} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-slate-600">{c.type}</span>
                  <span className="text-sm font-bold text-slate-900">{c.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What increases salary */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 font-bold text-slate-900">What Increases Your Salary</h4>
            <ul className="space-y-1.5">
              {data.factors.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 text-brand-500">↑</span> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Negotiation tip */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-bold text-amber-700 mb-0.5">💡 Key Negotiation Tip</p>
            <p className="text-sm text-amber-800">{data.negotiationTip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Scripts ────────────────────────────────────────────────────────────

function ScriptsTab({ initRole }: { initRole: string }) {
  const [scenario, setScenario] = useState("new_offer");
  const [role, setRole] = useState(initRole);
  const [currentSalary, setCurrentSalary] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [targetSalary, setTargetSalary] = useState("");
  const [hasCompeting, setHasCompeting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScriptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showObj, setShowObj] = useState(0);

  async function generate() {
    if (!role.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "script", scenario, role, currentSalary, offerAmount, targetSalary, hasCompeting }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate script.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Negotiation Script Generator</h3>
          <p className="text-sm text-slate-500">Exact words to say, objection handlers, and do-nots</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Scenario</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SCENARIOS.map((s) => (
                <button key={s.key} type="button" onClick={() => setScenario(s.key)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${scenario === s.key ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <Combobox label="Role" placeholder="e.g. Software Engineer" options={ROLES} value={role} onChange={setRole} allowCustom />

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Current Salary", value: currentSalary, setter: setCurrentSalary, ph: "e.g. ₹12L / $80k" },
              { label: "Offer Received", value: offerAmount, setter: setOfferAmount, ph: "e.g. ₹18L" },
              { label: "Target Salary",  value: targetSalary, setter: setTargetSalary, ph: "e.g. ₹22L" },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
                <input type="text" value={f.value} onChange={(e) => f.setter(e.target.value)} placeholder={f.ph}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
              </div>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={hasCompeting} onChange={(e) => setHasCompeting(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            I have a competing offer
          </label>

          {error && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button onClick={generate} loading={loading} disabled={!role.trim()} className="w-full">
            <FileText className="h-4 w-4" />
            {loading ? "Generating script…" : "Generate Script"}
          </Button>
        </div>
      </div>

      {data && (
        <div className="space-y-4">
          {/* Opener */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 shadow-sm">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">Opening Line</p>
            <p className="text-base font-semibold text-slate-900 italic">&ldquo;{data.opener}&rdquo;</p>
          </div>

          {/* Key phrases */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 font-bold text-slate-900">Power Phrases to Use</h4>
            <div className="flex flex-wrap gap-2">
              {data.keyPhrases.map((p, i) => (
                <span key={i} className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800">
                  &ldquo;{p}&rdquo;
                </span>
              ))}
            </div>
          </div>

          {/* Full script */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 font-bold text-slate-900">Complete Script</h4>
            <p className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-700 leading-relaxed italic">
              &ldquo;{data.script}&rdquo;
            </p>
          </div>

          {/* Objections */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <h4 className="border-b border-slate-100 px-5 py-3 font-bold text-slate-900">Handling Objections</h4>
            {data.objections.map((o, i) => (
              <div key={i} className="border-b border-slate-50 last:border-0">
                <button type="button" onClick={() => setShowObj(showObj === i ? -1 : i)}
                  className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-slate-50 transition">
                  <span className="text-sm font-semibold text-amber-700">&ldquo;{o.objection}&rdquo;</span>
                  {showObj === i ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                {showObj === i && (
                  <p className="border-t border-slate-50 bg-green-50 px-5 py-3 text-sm text-green-800 italic">
                    &ldquo;{o.response}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Do NOT */}
          <div className="overflow-hidden rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
            <h4 className="mb-2 font-bold text-red-700">❌ Do NOT</h4>
            <ul className="space-y-1">
              {data.doNot.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="mt-0.5 text-red-400">×</span> {d}
                </li>
              ))}
            </ul>
          </div>

          {/* Follow up */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-bold text-blue-700 mb-0.5">If they say "let me think about it"</p>
            <p className="text-sm text-blue-800 italic">&ldquo;{data.followUp}&rdquo;</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Role Play ──────────────────────────────────────────────────────────

function RolePlayTab({ initRole }: { initRole: string }) {
  const [role, setRole] = useState(initRole);
  const [companyName, setCompanyName] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [targetSalary, setTargetSalary] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function startRolePlay() {
    setStarted(true);
    setSending(true);
    try {
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "roleplay",
          role, companyName, offerAmount, targetSalary,
          messages: [{ role: "user", content: "Hello, I'm calling about the offer you extended." }],
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMessages([
        { role: "user", content: "Hello, I'm calling about the offer you extended." },
        { role: "assistant", content: d.message },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start role play.");
      setStarted(false);
    } finally {
      setSending(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const newMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setSending(true);
    try {
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "roleplay", role, companyName, offerAmount, targetSalary, messages: newMessages }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMessages([...newMessages, { role: "assistant", content: d.message }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  function reset() { setStarted(false); setMessages([]); setError(null); }

  if (!started) return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="font-bold text-slate-900">Role-Play: Negotiate Live</h3>
        <p className="text-sm text-slate-500">AI plays a realistic hiring manager. Practice your negotiation in real time.</p>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Combobox label="Role" placeholder="e.g. Software Engineer" options={ROLES} value={role} onChange={setRole} allowCustom />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Company (optional)</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Flipkart, Google…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Their Offer</label>
            <input type="text" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder="e.g. ₹18L / $90k"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Your Target</label>
            <input type="text" value={targetSalary} onChange={(e) => setTargetSalary(e.target.value)} placeholder="e.g. ₹24L / $110k"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-800">💬 How it works</p>
          <p className="mt-0.5 text-xs text-blue-600">The AI acts as a hiring manager who starts firm. You negotiate back. After several turns, they may improve the offer.</p>
        </div>

        {error && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button onClick={startRolePlay} loading={sending} disabled={!role.trim()} className="w-full">
          <MessageSquare className="h-4 w-4" />
          Start Negotiation
        </Button>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-900 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">Hiring Manager — {companyName || "Tech Company"}</p>
          <p className="text-xs text-slate-400">Offer: {offerAmount || "undisclosed"} · Your target: {targetSalary || "undisclosed"}</p>
        </div>
        <button type="button" onClick={reset}
          className="flex items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-300 hover:text-white transition">
          <RotateCcw className="h-3 w-3" /> Restart
        </button>
      </div>

      <div className="flex flex-col" style={{ height: "460px" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">HM</div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-brand-500 text-white rounded-tr-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">HM</div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5">
                {[0,1,2].map((i) => <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="border-t border-slate-100 px-4 py-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="border-t border-slate-100 p-3 flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Type your response to the hiring manager…"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          <button type="button" onClick={send} disabled={!input.trim() || sending}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function SalaryCoachClient({ targetRole }: { targetRole: string }) {
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    { label: "Market Data",   icon: TrendingUp },
    { label: "Scripts",       icon: FileText   },
    { label: "Role-Play",     icon: MessageSquare },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map((t, i) => {
          const Icon = t.icon;
          return (
            <button key={i} type="button" onClick={() => setActiveTab(i)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${activeTab === i ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 0 && <MarketDataTab initRole={targetRole} />}
      {activeTab === 1 && <ScriptsTab initRole={targetRole} />}
      {activeTab === 2 && <RolePlayTab initRole={targetRole} />}
    </div>
  );
}
