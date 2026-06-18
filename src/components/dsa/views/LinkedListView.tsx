"use client";

import type { StructureViewProps } from "@/lib/dsa/types";
import { cn } from "@/lib/utils";

/** Shared StructureView for singly linked lists: nodes + next arrows + a moving pointer. */
export interface ListState {
  nodes: { id: number; value: number | string }[];
  /** Named pointers, label → node index (-1 means "points at null/None"). */
  pointers?: Record<string, number>;
  /** A node floating in (being inserted) before it's linked. */
  incoming?: { value: number | string } | null;
  caption?: string;
}

function role(idx: number, h: StructureViewProps["highlight"]) {
  if (h.active?.includes(idx)) return "active";
  if (h.compare?.includes(idx)) return "compare";
  if (h.visited?.includes(idx)) return "visited";
  if (h.placed?.includes(idx)) return "placed";
  return "rest";
}

const ROLE: Record<string, string> = {
  active: "border-violet-500 bg-violet-100 ring-2 ring-violet-300",
  compare: "border-sky-400 bg-sky-100",
  visited: "border-slate-200 bg-slate-100 text-slate-400",
  placed: "border-emerald-400 bg-emerald-100",
  rest: "border-slate-300 bg-white",
};

export function LinkedListView({ state, highlight }: StructureViewProps) {
  const s = state as ListState;
  const nodes = s.nodes ?? [];

  const pointersAt: Record<number, string[]> = {};
  for (const [label, idx] of Object.entries(s.pointers ?? {})) {
    (pointersAt[idx] ??= []).push(label);
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {s.incoming && (
        <div className="motion-safe:animate-[dsa-fly_700ms_ease-out] flex flex-col items-center">
          <div className="flex h-12 items-center rounded-xl border-2 border-fuchsia-400 bg-fuchsia-50 px-3 font-bold text-fuchsia-700">
            {s.incoming.value}
          </div>
          <span className="text-[10px] font-bold text-fuchsia-500">new node</span>
        </div>
      )}

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        <span className="mr-1 text-xs font-bold text-slate-400">head →</span>
        {nodes.length === 0 ? (
          <span className="rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm text-slate-400">
            empty (None)
          </span>
        ) : (
          nodes.map((n, i) => (
            <div key={n.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="flex h-9 flex-col items-end justify-end">
                  {(pointersAt[i] ?? []).map((l) => (
                    <span key={l} className="text-[10px] font-extrabold leading-none text-violet-700">
                      {l}▾
                    </span>
                  ))}
                </div>
                <div
                  className={cn(
                    "flex items-center overflow-hidden rounded-xl border-2 text-sm font-bold transition-all",
                    ROLE[role(i, highlight)],
                  )}
                >
                  <span className="px-3 py-2">{n.value}</span>
                  <span className="border-l-2 border-inherit bg-slate-50 px-2 py-2 text-slate-400">•</span>
                </div>
              </div>
              <span className="px-1 text-lg text-slate-400">→</span>
            </div>
          ))
        )}
        <span className="text-xs font-bold text-slate-400">None</span>
      </div>

      {Object.entries(s.pointers ?? {}).some(([, idx]) => idx === -1) && (
        <p className="text-xs font-semibold text-slate-400">
          {Object.entries(s.pointers ?? {})
            .filter(([, idx]) => idx === -1)
            .map(([l]) => `${l} = None`)
            .join(", ")}
        </p>
      )}
      {s.caption && <p className="text-sm font-bold text-slate-600">{s.caption}</p>}
      <style>{`@keyframes dsa-fly { 0% { transform: translateY(0); opacity:1 } 100% { transform: translateY(-14px); opacity:0 } }`}</style>
    </div>
  );
}
