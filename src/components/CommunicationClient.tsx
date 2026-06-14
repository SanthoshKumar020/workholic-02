"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Mic, MicOff, Copy } from "lucide-react";
import type { CommunicationResult } from "@/lib/types";

const CONTEXTS = [
  "Professional email",
  "Slack/Teams message",
  "Presentation script",
  "Job application email",
  "Meeting notes",
  "LinkedIn post",
];

export function CommunicationClient() {
  const [text, setText] = useState("");
  const [context, setContext] = useState(CONTEXTS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CommunicationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (SpeechRec) {
      setVoiceSupported(true);
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e: SpeechRecognitionEvent) => {
        let t = "";
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        setText(t);
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { recognitionRef.current.start(); setIsListening(true); }
  }

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  const toneColor: Record<string, string> = {
    professional: "success",
    informal: "secondary",
    aggressive: "destructive",
    passive: "warning",
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Context</label>
        <div className="flex flex-wrap gap-2">
          {CONTEXTS.map((c) => (
            <button
              key={c}
              onClick={() => setContext(c)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                context === c ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Textarea
          label="Your text"
          placeholder="Paste or type the message you want to improve..."
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {voiceSupported && (
          <button
            onClick={toggleListening}
            className={`mt-2 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              isListening ? "border-red-300 bg-red-50 text-red-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? "Stop" : "Dictate"}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={analyze} loading={loading} disabled={text.length < 10} size="lg">
        Analyze Communication
      </Button>

      {result && (
        <div className="animate-fade-in space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Scores */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Overall Score", value: result.score },
              { label: "Clarity", value: result.clarity },
              { label: "Conciseness", value: result.conciseness },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="font-bold text-brand-600">{value}/100</span>
                </div>
                <Progress value={value} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Tone:</span>
            <Badge variant={(toneColor[result.tone] as "success" | "secondary" | "destructive" | "warning") || "secondary"}>
              {result.tone}
            </Badge>
          </div>

          {result.fillerWords.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">⚠️ Filler words detected</p>
              <div className="flex flex-wrap gap-1.5">
                {result.fillerWords.map((w) => <Badge key={w} variant="warning">{w}</Badge>)}
              </div>
            </div>
          )}

          {result.grammarIssues.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">📝 Grammar issues</p>
              <ul className="space-y-1">
                {result.grammarIssues.map((g, i) => <li key={i} className="text-sm text-slate-600">• {g}</li>)}
              </ul>
            </div>
          )}

          {result.improvedVersion && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">✨ Improved version</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(result.improvedVersion); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                  <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="whitespace-pre-wrap rounded-xl bg-brand-50 p-4 text-sm leading-relaxed text-slate-800 border border-brand-100">
                {result.improvedVersion}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
