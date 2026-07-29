"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { track } from "@/lib/analytics";

/**
 * Student-facing join form.
 *
 * The batch label is optional and free text, because a placement cell filters
 * its dashboard by it ("CSE 2026") but a student shouldn't be blocked at the
 * door for not knowing the exact wording. A blank label still counts toward
 * the cohort.
 */
export function JoinInstitutionClient({
  initialCode,
  existing,
}: {
  initialCode: string;
  existing: { name: string; role: string; batch: string | null } | null;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [batch, setBatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<string | null>(null);

  if (existing && !joined) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="text-4xl">🎓</span>
        <h1 className="mt-3 text-xl font-bold text-slate-900">
          You&apos;re already with {existing.name}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {existing.role === "admin"
            ? "You have placement-cell access."
            : "Every Pro tool is unlocked for you while your college's access is active."}
          {existing.batch ? ` Batch: ${existing.batch}.` : ""}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={existing.role === "admin" ? "/institution" : "/dashboard"}
            className="rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            {existing.role === "admin" ? "Open placement dashboard" : "Go to dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <span className="text-4xl">🎉</span>
        <h1 className="mt-3 text-xl font-bold text-slate-900">You&apos;re in — {joined}</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Every Pro tool is unlocked for you. Start with your resume — everything else builds on it.
        </p>
        <Link
          href="/builder"
          className="mt-6 inline-block rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Build my resume →
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/institution/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), batchLabel: batch.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not join.");
      track("institution_joined", { alreadyMember: Boolean(data.alreadyMember) });
      setJoined(data.institution ?? "your college");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <span className="text-3xl">🎓</span>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Join your college</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
        Enter the code from your placement cell. It unlocks every Pro tool for you at no cost while
        your college&apos;s access is active.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-semibold text-slate-700">
            College code
          </label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="RVCE-2026"
            autoComplete="off"
            required
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-base tracking-wider outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <div>
          <label htmlFor="batch" className="block text-sm font-semibold text-slate-700">
            Your batch <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="batch"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="CSE 2026"
            maxLength={40}
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          <p className="mt-1 text-xs text-slate-400">
            Helps your placement cell see results by department. Skip it if you&apos;re unsure.
          </p>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Join
        </Button>
      </form>

      {/* Students will wonder. Answer it before they have to ask. */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          What your college can see
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Batch averages only — things like the cohort&apos;s average ATS score and the most common
          skill gaps. Your placement cell <strong>cannot</strong> see your resume, your individual
          score, or your interview feedback. Nobody at your college sees your results as an
          individual.
        </p>
      </div>
    </div>
  );
}
