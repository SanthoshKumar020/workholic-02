"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, MinusCircle } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

export function CareerChat({ isPro }: { isPro: boolean }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage() {
    const msg = input.trim();
    if (!msg) return;
    const updated: ChatMessage[] = [...messages, { role: "user", content: msg }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: messages.slice(-12) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages([...updated, { role: "assistant", content: data.error || "Something went wrong." }]);
      } else {
        setMessages([...updated, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages([...updated, { role: "assistant", content: "Sorry, I couldn't respond. Please check your connection." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient shadow-lg transition hover:scale-105 hover:shadow-glow-sm"
        aria-label="Open career chat"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl transition-all ${minimized ? "h-14" : "h-[480px]"}`}>
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-brand-gradient px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-white" />
          <span className="text-sm font-semibold text-white">Career Mentor</span>
          {!isPro && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">Pro</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized((m) => !m)} className="rounded p-1 text-white/80 hover:text-white">
            <MinusCircle className="h-4 w-4" />
          </button>
          <button onClick={() => setOpen(false)} className="rounded p-1 text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!isPro && (
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                Career chat is a Pro feature. <a href="/billing" className="font-semibold underline">Upgrade</a> to get unlimited guidance.
              </div>
            )}
            {messages.length === 0 && isPro && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-slate-500">Hi! I&apos;m your AI career mentor. Ask me anything about job searching, interviews, or career growth.</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["Help me prep for interviews", "How to negotiate salary?", "Tips for job searching"].map((q) => (
                    <button key={q} onClick={() => setInput(q)} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-700 hover:bg-brand-100">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-3 py-2">
                  <span className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:"0ms"}} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:"150ms"}} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:"300ms"}} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={isPro ? "Ask anything..." : "Upgrade to chat"}
              disabled={!isPro}
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || !isPro}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
