"use client";

import type { StructureViewProps } from "@/lib/dsa/types";
import { cn } from "@/lib/utils";

/** Shared StructureView for grid problems: maze backtracking and DP tables. */
export interface GridState {
  rows: number;
  cols: number;
  /** Cell indices (r*cols + c) that are walls / blocked. */
  walls?: number[];
  /** Cell index → text label (e.g. "S", "G", or a DP value). */
  labels?: Record<number, string>;
  caption?: string;
}

function roleOf(idx: number, h: StructureViewProps["highlight"]) {
  if (h.swap?.includes(idx)) return "swap";
  if (h.active?.includes(idx)) return "active";
  if (h.placed?.includes(idx)) return "placed";
  if (h.compare?.includes(idx)) return "compare";
  if (h.visited?.includes(idx)) return "visited";
  return "rest";
}
const CELL: Record<string, string> = {
  swap: "bg-amber-200 text-amber-800 ring-2 ring-amber-400",
  active: "bg-violet-500 text-white ring-2 ring-violet-300",
  placed: "bg-emerald-300 text-emerald-900",
  compare: "bg-sky-200 text-sky-800",
  visited: "bg-slate-200 text-slate-400",
  rest: "bg-white text-slate-600",
};

export function GridView({ state, highlight }: StructureViewProps) {
  const s = state as GridState;
  const walls = new Set(s.walls ?? []);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${s.cols}, minmax(0, 1fr))`, maxWidth: s.cols * 56 }}
      >
        {Array.from({ length: s.rows * s.cols }, (_, idx) => {
          const isWall = walls.has(idx);
          const role = roleOf(idx, highlight);
          const label = s.labels?.[idx];
          return (
            <div
              key={idx}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold transition-all sm:h-12 sm:w-12",
                isWall ? "bg-slate-800 text-slate-800" : CELL[role],
              )}
            >
              {isWall ? "" : label ?? ""}
            </div>
          );
        })}
      </div>
      {s.caption && <p className="text-center text-sm font-bold text-slate-600">{s.caption}</p>}
    </div>
  );
}
