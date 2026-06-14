"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { RoadmapRow } from "@/lib/types";

function computeProgress(row: RoadmapRow) {
  const steps = row.content?.steps ?? [];
  if (!steps.length) return 0;
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}

function ProgressPill({ pct }: { pct: number }) {
  const color =
    pct === 100
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
      : pct >= 50
      ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{pct}%</span>;
}

function MiniBar({ pct }: { pct: number }) {
  const fill = pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-brand-500" : "bg-slate-300";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function RoadmapsListClient({ initialRoadmaps }: { initialRoadmaps: RoadmapRow[] }) {
  const [roadmaps, setRoadmaps] = useState(initialRoadmaps);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/roadmap/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setRoadmaps((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silently fail — user can retry
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  }

  if (roadmaps.length === 0) return <EmptyState />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {roadmaps.map((rm) => {
        const pct = computeProgress(rm);
        const totalSteps = rm.content?.steps?.length ?? 0;
        const doneSteps = rm.content?.steps?.filter((s) => s.done).length ?? 0;
        const weeks = rm.content?.estimatedWeeks;
        const isConfirming = confirmId === rm.id;
        const isDeleting = deleting === rm.id;

        return (
          <div
            key={rm.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-600"
          >
            {/* Gradient top */}
            <div className={`h-1 w-full ${pct === 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-brand-gradient"}`} />

            {/* Delete button — top right */}
            <div className="absolute right-3 top-3 z-10">
              {isConfirming ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2 py-1 shadow-sm dark:border-red-800 dark:bg-slate-900">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Delete?</span>
                  <button
                    onClick={() => handleDelete(rm.id)}
                    disabled={isDeleting}
                    className="rounded px-1.5 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/30"
                  >
                    {isDeleting ? "…" : "Yes"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded px-1.5 py-0.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.preventDefault(); setConfirmId(rm.id); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-400 opacity-0 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  title="Delete roadmap"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Link href={`/roadmap?id=${rm.id}`} className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-8">
                <h3 className="font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-400">
                  {rm.topic}
                </h3>
                <ProgressPill pct={pct} />
              </div>

              {rm.content?.summary && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {rm.content.summary}
                </p>
              )}

              <div className="mt-auto pt-4 space-y-2">
                <MiniBar pct={pct} />
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>{doneSteps}/{totalSteps} steps{pct === 100 && " ✓"}</span>
                  {weeks && <span>{weeks} weeks</span>}
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400 dark:text-slate-600">
                Updated {new Date(rm.updated_at).toLocaleDateString()}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">No roadmaps yet</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Generate your first personalised learning roadmap — it takes about 30 seconds.
      </p>
      <Link
        href="/roadmap"
        className="mt-6 inline-block rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
      >
        Generate a roadmap
      </Link>
    </div>
  );
}
