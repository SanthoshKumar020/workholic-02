"use client";

import type { StructureViewProps } from "@/lib/dsa/types";
import { cn } from "@/lib/utils";

/**
 * Shared StructureView for the whole "array family":
 * arrays, binary search, sorting, two pointers, sliding window, big-O.
 * A topic just emits this state shape; no per-topic drawing code needed.
 */
export interface ArrayState {
  values: (number | string)[];
  /** Named pointers, label → index. e.g. {low:0, mid:3, high:6} or {left:0, right:5}. */
  pointers?: Record<string, number>;
  /** Inclusive highlighted window for sliding-window problems. */
  window?: { start: number; end: number } | null;
  variant?: "boxes" | "bars";
  /** A small running-total / result caption shown under the array. */
  caption?: string;
}

const POINTER_COLOR: Record<string, string> = {
  low: "text-sky-600", left: "text-sky-600", l: "text-sky-600", slow: "text-sky-600", start: "text-sky-600",
  high: "text-rose-600", right: "text-rose-600", r: "text-rose-600", fast: "text-rose-600", end: "text-rose-600",
  mid: "text-violet-700", m: "text-violet-700",
  i: "text-amber-600", j: "text-fuchsia-600", k: "text-emerald-600",
};

function cellRole(idx: number, h: StructureViewProps["highlight"]) {
  if (h.swap?.includes(idx)) return "swap";
  if (h.placed?.includes(idx)) return "placed";
  if (h.active?.includes(idx)) return "active";
  if (h.compare?.includes(idx)) return "compare";
  if (h.visited?.includes(idx)) return "visited";
  return "rest";
}

const ROLE_BOX: Record<string, string> = {
  swap: "border-amber-400 bg-amber-100 text-amber-800 ring-2 ring-amber-300",
  placed: "border-emerald-400 bg-emerald-100 text-emerald-800",
  active: "border-violet-500 bg-violet-100 text-violet-800 ring-2 ring-violet-300",
  compare: "border-sky-400 bg-sky-100 text-sky-800",
  visited: "border-slate-200 bg-slate-100 text-slate-400",
  rest: "border-slate-300 bg-white text-slate-700",
};

const ROLE_BAR: Record<string, string> = {
  swap: "bg-amber-400",
  placed: "bg-emerald-400",
  active: "bg-violet-500",
  compare: "bg-sky-400",
  visited: "bg-slate-200",
  rest: "bg-brand-300",
};

export function ArrayView({ state, highlight }: StructureViewProps) {
  const s = state as ArrayState;
  const variant = s.variant ?? "boxes";
  const values = s.values ?? [];
  const inWindow = (i: number) => s.window && i >= s.window.start && i <= s.window.end;

  // Group pointer labels per column.
  const pointersAt: Record<number, string[]> = {};
  for (const [label, idx] of Object.entries(s.pointers ?? {})) {
    (pointersAt[idx] ??= []).push(label);
  }

  const max = variant === "bars" ? Math.max(1, ...values.map((v) => Number(v) || 0)) : 1;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex items-end justify-center gap-1.5 overflow-x-auto pb-1">
        {values.map((v, i) => {
          const role = cellRole(i, highlight);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              {/* pointer markers */}
              <div className="flex h-9 flex-col items-center justify-end gap-0.5">
                {(pointersAt[i] ?? []).map((label) => (
                  <span
                    key={label}
                    className={cn("text-[10px] font-extrabold leading-none", POINTER_COLOR[label] ?? "text-slate-600")}
                  >
                    {label}▾
                  </span>
                ))}
              </div>

              {variant === "bars" ? (
                <div
                  className={cn(
                    "flex w-9 items-end justify-center rounded-t-md pb-1 text-xs font-bold text-white transition-all sm:w-10",
                    ROLE_BAR[role],
                    inWindow(i) && role === "rest" && "bg-brand-400",
                  )}
                  style={{ height: 28 + (Number(v) / max) * 120 }}
                >
                  {v}
                </div>
              ) : (
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all sm:h-12 sm:w-12",
                    ROLE_BOX[role],
                    inWindow(i) && role === "rest" && "border-brand-400 bg-brand-50",
                  )}
                >
                  {v}
                </div>
              )}

              {/* index */}
              <span className="text-[10px] font-semibold text-slate-400">{i}</span>
            </div>
          );
        })}
      </div>

      {s.window && (
        <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
          window: indices {s.window.start}–{s.window.end}
        </span>
      )}
      {s.caption && <p className="text-sm font-bold text-slate-600">{s.caption}</p>}
    </div>
  );
}
