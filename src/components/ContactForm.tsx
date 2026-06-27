"use client";

import { useState } from "react";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Something went wrong. Please email us directly.");
      }
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-xl font-bold text-emerald-700">Message sent! 🎉</p>
        <p className="mt-2 text-sm text-emerald-600">
          We&apos;ll get back to you at <strong>{form.email}</strong> within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label>
        <select
          value={form.subject}
          onChange={(e) => set("subject", e.target.value)}
          required
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        >
          <option value="">Select a topic…</option>
          <option value="billing">Billing / payment</option>
          <option value="refund">Refund request</option>
          <option value="bug">Bug report</option>
          <option value="feature">Feature request</option>
          <option value="account">Account issue</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
        <textarea
          required
          rows={6}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Describe your question or issue in detail…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      {errorMsg && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-brand-gradient py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
