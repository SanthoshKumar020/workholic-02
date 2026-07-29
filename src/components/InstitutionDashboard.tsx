"use client";

import { useCallback, useEffect, useState } from "react";
import { LoadingPanel, ErrorPanel, EmptyState } from "@/components/ui/AsyncState";

/**
 * Batch-readiness view for a placement officer.
 *
 * Built around the one question a TPO has to answer to their management:
 * "how ready is this batch, and what should we run a workshop on?" So the
 * headline numbers are at-risk count and the biggest shared gap — not vanity
 * metrics like total logins.
 *
 * Everything here is aggregate. There is deliberately no way to drill into an
 * individual student.
 */

type Analytics = {
  institution: { name: string; seatLimit: number; expiresAt: string | null };
  batches: string[];
  selectedBatch: string | null;
  cohortSize: number;
  suppressed: boolean;
  reason?: string;
  resumes?: {
    withResume: number;
    withoutResume: number;
    averageScore: number | null;
    atRisk: number;
    readyToApply: number;
    distribution: { label: string; count: number }[];
  };
  interviews?: { practised: number; notPractised: number };
  engagement?: {
    activeUsers: number;
    inactiveUsers: number;
    topFeatures: { feature: string; count: number }[];
  };
};

function Stat({
  value,
  label,
  tone = "default",
  sub,
}: {
  value: string | number;
  label: string;
  tone?: "default" | "good" | "warn" | "bad";
  sub?: string;
}) {
  const color =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
      ? "text-amber-600"
      : tone === "bad"
      ? "text-red-600"
      : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className={`text-3xl font-extrabold leading-none ${color}`}>{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function InstitutionDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batch, setBatch] = useState<string>("");

  const load = useCallback(async (selected: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = selected ? `?batch=${encodeURIComponent(selected)}` : "";
      const res = await fetch(`/api/institution/analytics${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Could not load analytics.");
      setData(json as Analytics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(batch);
  }, [batch, load]);

  if (loading && !data) return <LoadingPanel label="Loading batch analytics…" />;
  if (error) return <ErrorPanel error={error} onRetry={() => load(batch)} />;
  if (!data) return null;

  const { institution, resumes, interviews, engagement } = data;
  const pct = (n: number) => (data.cohortSize ? Math.round((n / data.cohortSize) * 100) : 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500">
            Placement readiness
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            {institution.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.cohortSize} students enrolled
            {institution.seatLimit > 0 && ` of ${institution.seatLimit} seats`}
            {institution.expiresAt &&
              ` · access until ${new Date(institution.expiresAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`}
          </p>
        </div>

        {data.batches.length > 0 && (
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">All batches</option>
            {data.batches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        )}
      </div>

      {data.suppressed ? (
        <div className="mt-8">
          <EmptyState
            icon="🔒"
            title="Not enough students yet"
            blurb={data.reason}
            hints={["Share your join code with the batch", "Analytics unlock at 5 students"]}
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              value={resumes?.averageScore ?? "—"}
              label="Average ATS score"
              tone={
                (resumes?.averageScore ?? 0) >= 75
                  ? "good"
                  : (resumes?.averageScore ?? 0) >= 60
                  ? "warn"
                  : "bad"
              }
              sub="Best score per student"
            />
            <Stat
              value={resumes?.atRisk ?? 0}
              label="At risk (below 60)"
              tone="bad"
              sub={`${pct(resumes?.atRisk ?? 0)}% of the batch`}
            />
            <Stat
              value={resumes?.readyToApply ?? 0}
              label="Application-ready (75+)"
              tone="good"
              sub={`${pct(resumes?.readyToApply ?? 0)}% of the batch`}
            />
            <Stat
              value={resumes?.withoutResume ?? 0}
              label="No resume yet"
              tone="warn"
              sub="Haven't uploaded anything"
            />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {/* Score distribution */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Score distribution</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Most ATS filters screen out below 75
              </p>
              <div className="mt-5 space-y-3">
                {(resumes?.distribution ?? []).map((b) => {
                  const total = resumes?.withResume || 1;
                  const width = Math.round((b.count / total) * 100);
                  const bad = b.label === "0–39" || b.label === "40–59";
                  return (
                    <div key={b.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">{b.label}</span>
                        <span className="text-slate-400">{b.count}</span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${bad ? "bg-red-400" : "bg-brand-500"}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Practice + engagement */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Preparation activity</h2>
              <p className="mt-0.5 text-xs text-slate-400">Where to target your next workshop</p>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Practised a mock interview</span>
                    <span className="font-bold text-slate-900">
                      {interviews?.practised ?? 0}/{data.cohortSize}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${pct(interviews?.practised ?? 0)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Used any tool</span>
                    <span className="font-bold text-slate-900">
                      {engagement?.activeUsers ?? 0}/{data.cohortSize}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct(engagement?.activeUsers ?? 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              {(engagement?.topFeatures?.length ?? 0) > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Most used
                  </p>
                  <ul className="mt-2.5 flex flex-wrap gap-2">
                    {engagement!.topFeatures.map((f) => (
                      <li
                        key={f.feature}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {f.feature.replace(/-/g, " ")} · {f.count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-slate-400">
            All figures are batch aggregates. HYRISE does not show individual student scores,
            resumes, or interview feedback to institutions — students share that data with us for
            their own career preparation, not for assessment.
          </p>
        </>
      )}
    </div>
  );
}
