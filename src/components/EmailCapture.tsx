"use client";

import { useState } from "react";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Something went wrong.");
      }
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-8">
      <div className="overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50 px-8 py-12 text-center">
        <span className="inline-flex items-center rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
          Free weekly tips
        </span>

        <h2 className="mx-auto mt-4 max-w-lg text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Get your free resume score + career tips every week
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
          No spam. Unsubscribe anytime. Delivered every Monday — actionable advice to help you
          land interviews faster.
        </p>

        {status === "done" ? (
          <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
            <p className="text-lg font-bold text-emerald-700">You&apos;re in! 🎉</p>
            <p className="mt-1 text-sm text-emerald-600">
              Check your inbox — first email arrives next Monday.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === "loading"}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {status === "loading" ? "Subscribing…" : "Get free tips"}
            </button>
          </form>
        )}

        {(status === "error" || errorMsg) && (
          <p className="mx-auto mt-3 max-w-sm text-xs text-red-600">{errorMsg}</p>
        )}

        <p className="mt-4 text-[11px] text-slate-400">
          No card required · Unsubscribe anytime
        </p>
      </div>
    </section>
  );
}
