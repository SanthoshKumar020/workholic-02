"use client";

import { useRef, useState } from "react";
import { Send, Baby, HelpCircle } from "lucide-react";
import { Bit } from "@/components/dsa/Mascot";
import type { DsaMode } from "@/lib/dsa/types";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "bit";
  text: string;
  followUp?: string | null;
}

/**
 * "Ask Bit" — the Socratic ELI tutor. Progressive hints, mode-aware voice.
 * Never crashes the UI: the route always returns a friendly reply string.
 */
export function Tutor({ topic, mode }: { topic: string; mode: DsaMode }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const hintLevel = useRef(1);

  async function ask(question: string, type: "eli10" | "why") {
    const q = question.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/dsa/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, question: q, mode, type, hintLevel: hintLevel.current }),
      });
      const data = await res.json().catch(() => ({}));
      hintLevel.current = Math.min(3, hintLevel.current + 1);
      setMessages((m) => [
        ...m,
        { role: "bit", text: data.reply ?? "Hmm, let's try that again in a moment! 🤖", followUp: data.followUp },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "bit", text: "Oops, my circuits hiccuped! Try again in a sec. 🤖" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Bit mood="happy" size="sm" />
        <div>
          <h3 className="text-base font-bold text-slate-800">Ask Bit</h3>
          <p className="text-xs text-slate-500">Stuck? I&apos;ll give you a hint — not the whole answer 😉</p>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mb-3 max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "rounded-br-sm bg-brand-gradient text-white"
                    : "rounded-bl-sm border border-brand-100 bg-white text-slate-700",
                )}
              >
                {m.text}
                {m.followUp && <p className="mt-1.5 text-xs font-semibold text-brand-600">{m.followUp}</p>}
              </div>
            </div>
          ))}
          {loading && <p className="px-1 text-xs font-medium text-slate-400">Bit is thinking… 🤖</p>}
        </div>
      )}

      <div className="mb-2 flex flex-wrap gap-2">
        <button
          onClick={() => ask(input || `Explain ${topic} like I'm 10`, "eli10")}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-brand-100 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-200 disabled:opacity-50"
        >
          <Baby className="h-3.5 w-3.5" /> Explain like I&apos;m 10
        </button>
        <button
          onClick={() => ask(input || `Why does ${topic} work?`, "why")}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-200 disabled:opacity-50"
        >
          <HelpCircle className="h-3.5 w-3.5" /> Why does this work?
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input, "eli10");
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Bit anything about this topic…"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
