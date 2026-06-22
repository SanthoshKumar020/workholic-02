"use client";

import type { ChartSpec } from "@/lib/domains/types";

const COLORS = ["bg-brand-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-fuchsia-500", "bg-rose-500"];

/** Dependency-free horizontal bar chart from an AI-supplied spec. */
export function BarChart({ spec }: { spec: ChartSpec }) {
  const data = spec.data ?? [];
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {spec.title && <p className="mb-3 text-sm font-bold text-slate-700">{spec.title}</p>}
      <div className="space-y-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-right text-xs font-semibold text-slate-500" title={d.label}>
              {d.label}
            </span>
            <div className="h-6 flex-1 overflow-hidden rounded-lg bg-slate-100">
              <div
                className={`flex h-full items-center justify-end rounded-lg pr-2 text-[11px] font-bold text-white transition-all ${COLORS[i % COLORS.length]}`}
                style={{ width: `${Math.max(8, (d.value / max) * 100)}%` }}
              >
                {d.value}{spec.unit ?? ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
