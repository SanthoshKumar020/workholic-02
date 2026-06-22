"use client";

import { useState } from "react";
import { Sparkles, Upload, Wand2, FileText, Download, FileDown, Save, ArrowLeft, Pencil, Crown, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractDeckSource, ACCEPTED_DECK_TYPES, DeckExtractionError } from "@/lib/ppt/extract";
import { THEME_LIST, FREE_SLIDE_CAP, PRO_SLIDE_CAP, getTheme, type Deck, type ThemeKey } from "@/lib/ppt/types";
import { Presenter } from "@/components/ppt/Presenter";
import { downloadPptx, printDeck } from "@/components/ppt/export";
import { cn } from "@/lib/utils";

type Mode = "topic" | "document" | "enhance";
interface SavedDeck { id: string; title: string; deck: Deck; created_at: string }

const MODES: { key: Mode; label: string; icon: typeof Sparkles; hint: string }[] = [
  { key: "topic", label: "Topic idea", icon: Sparkles, hint: "Describe what you want — a topic or a full written idea." },
  { key: "document", label: "From document", icon: Upload, hint: "Upload a PDF, DOCX, or TXT to turn into slides." },
  { key: "enhance", label: "Enhance a deck", icon: Wand2, hint: "Upload an existing .pptx and we'll polish & restructure it." },
];
const TONES = ["professional", "friendly", "energetic", "academic", "minimal"];

export function PptBuilderClient({ pro, initialDecks }: { pro: boolean; initialDecks: SavedDeck[] }) {
  const cap = pro ? PRO_SLIDE_CAP : FREE_SLIDE_CAP;
  const [mode, setMode] = useState<Mode>("topic");
  const [content, setContent] = useState("");
  const [fileInfo, setFileInfo] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [slideCount, setSlideCount] = useState(8);
  const [theme, setTheme] = useState<ThemeKey>("violet");
  const [tone, setTone] = useState("professional");

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [decks, setDecks] = useState<SavedDeck[]>(initialDecks);

  async function onFile(file: File | null) {
    if (!file) return;
    setError(null);
    setExtracting(true);
    setFileInfo(null);
    try {
      const text = await extractDeckSource(file);
      if (!text) throw new DeckExtractionError("That file had no readable text.");
      setContent(text);
      setFileInfo(`${file.name} · ${text.length.toLocaleString()} characters read`);
    } catch (e) {
      setError(e instanceof DeckExtractionError ? e.message : "Could not read that file.");
    } finally {
      setExtracting(false);
    }
  }

  async function generate() {
    if (!content.trim()) {
      setError(mode === "topic" ? "Type a topic or idea first." : "Upload a file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/ppt/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, content, slideCount, theme, tone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || "Generation failed.");
      setDeck(data.deck as Deck);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!deck) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error: err } = await supabase
      .from("presentations")
      .insert({ user_id: user.id, title: deck.title, deck })
      .select("id, title, deck, created_at")
      .single();
    if (!err && data) {
      setSaved(true);
      setDecks((d) => [data as SavedDeck, ...d]);
    }
  }

  function updateDeck(patch: Partial<Deck>) {
    setDeck((d) => (d ? { ...d, ...patch } : d));
  }
  function updateSlide(i: number, patch: Partial<Deck["slides"][number]>) {
    setDeck((d) => (d ? { ...d, slides: d.slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) } : d));
  }

  // ── Deck view ──────────────────────────────────────────────────────────────
  if (deck) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setDeck(null)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" /> New deck
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <select value={deck.theme} onChange={(e) => updateDeck({ theme: e.target.value as ThemeKey })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              {THEME_LIST.map((t) => <option key={t.key} value={t.key}>{t.name} theme</option>)}
            </select>
            <button onClick={() => setEditing((e) => !e)} className={cn("flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold", editing ? "bg-brand-100 text-brand-700" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button onClick={() => printDeck(deck)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <FileDown className="h-4 w-4" /> PDF
            </button>
            <button onClick={() => downloadPptx(deck)} className="flex items-center gap-1.5 rounded-xl bg-brand-gradient px-3 py-2 text-sm font-bold text-white shadow-md hover:opacity-90">
              <Download className="h-4 w-4" /> Download .pptx
            </button>
            <button onClick={save} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <Save className="h-4 w-4" /> {saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>

        <Presenter deck={deck} />

        {editing && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <input value={deck.title} onChange={(e) => updateDeck({ title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-lg font-bold text-slate-800" />
            {deck.slides.map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-bold uppercase text-slate-400">Slide {i + 1} · {s.layout}</p>
                <input value={s.title} onChange={(e) => updateSlide(i, { title: e.target.value })} className="mb-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold" />
                {s.bullets && (
                  <textarea value={s.bullets.join("\n")} onChange={(e) => updateSlide(i, { bullets: e.target.value.split("\n").filter(Boolean) })} rows={s.bullets.length + 1} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs" placeholder="One bullet per line" />
                )}
                {s.notes !== undefined && (
                  <input value={s.notes ?? ""} onChange={(e) => updateSlide(i, { notes: e.target.value })} placeholder="Speaker notes" className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Generator view ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="grid gap-2 sm:grid-cols-3">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.key;
          return (
            <button key={m.key} onClick={() => { setMode(m.key); setContent(""); setFileInfo(null); setError(null); }}
              className={cn("flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition", active ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-200")}>
              <Icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-slate-400")} />
              <span className="font-bold text-slate-800">{m.label}</span>
              <span className="text-xs text-slate-500">{m.hint}</span>
            </button>
          );
        })}
      </div>

      {/* Input */}
      {mode === "topic" ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="e.g. 'A 10-slide pitch for a campus food-delivery startup' — or paste a full written idea to convert into slides."
          className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center hover:border-brand-300">
          {extracting ? <Loader2 className="h-7 w-7 animate-spin text-brand-400" /> : <FileText className="h-7 w-7 text-slate-400" />}
          <span className="text-sm font-semibold text-slate-700">
            {fileInfo ?? (mode === "enhance" ? "Upload a .pptx (or PDF/DOCX) to enhance" : "Upload a PDF, DOCX, or TXT")}
          </span>
          <span className="text-xs text-slate-400">Click to choose a file (max 15 MB)</span>
          <input type="file" accept={mode === "enhance" ? ".pptx,.pdf,.docx,.txt" : ACCEPTED_DECK_TYPES} className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        </label>
      )}

      {/* Options */}
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Slides
          <select value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            {Array.from({ length: cap - 3 }, (_, i) => i + 4).map((n) => <option key={n} value={n}>{n} slides</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Tone
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm capitalize text-slate-700">
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Theme
          <div className="flex gap-1.5">
            {THEME_LIST.map((t) => (
              <button key={t.key} onClick={() => setTheme(t.key)} title={t.name} className={cn("h-8 w-8 rounded-lg ring-2 transition", t.swatch, theme === t.key ? "ring-brand-500" : "ring-transparent")} />
            ))}
          </div>
        </div>
        {!pro && <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-amber-600"><Crown className="h-3.5 w-3.5" /> Free up to {FREE_SLIDE_CAP} slides — Pro for {PRO_SLIDE_CAP}</span>}
      </div>

      {error && <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">{error}</p>}

      <button onClick={generate} disabled={loading || extracting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-6 py-3.5 text-base font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60">
        {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Designing your deck…</> : <><Sparkles className="h-5 w-5" /> Generate presentation</>}
      </button>

      {/* Saved decks */}
      {decks.length > 0 && (
        <div className="pt-2">
          <h2 className="mb-3 text-sm font-bold text-slate-700">Your presentations</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {decks.map((d) => (
              <button key={d.id} onClick={() => { setDeck(d.deck); setSaved(true); }} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-200 hover:shadow-sm">
                <span className={cn("h-9 w-12 shrink-0 rounded-md", getTheme(d.deck?.theme).swatch)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">{d.title}</span>
                  <span className="text-xs text-slate-400">{d.deck?.slides?.length ?? 0} slides</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
