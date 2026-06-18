"use client";

import type { StructureViewProps } from "@/lib/dsa/types";
import { cn } from "@/lib/utils";

/** Shared StructureView for binary trees: BST, traversals, and heaps. */
export interface TreeNodeT {
  id: number;
  value: number | string;
  left?: number | null;
  right?: number | null;
}
export interface TreeState {
  nodes: TreeNodeT[];
  root: number | null;
  /** Named pointers, label → node id. */
  pointers?: Record<string, number>;
  caption?: string;
}

const GAPX = 52;
const GAPY = 70;
const R = 20;
const PAD = 26;

function roleOf(id: number, h: StructureViewProps["highlight"]) {
  if (h.swap?.includes(id)) return "swap";
  if (h.placed?.includes(id)) return "placed";
  if (h.active?.includes(id)) return "active";
  if (h.compare?.includes(id)) return "compare";
  if (h.visited?.includes(id)) return "visited";
  return "rest";
}

const FILL: Record<string, string> = {
  swap: "#fbbf24",
  placed: "#34d399",
  active: "#8b5cf6",
  compare: "#38bdf8",
  visited: "#cbd5e1",
  rest: "#ffffff",
};
const TEXT: Record<string, string> = {
  swap: "#78350f",
  placed: "#065f46",
  active: "#ffffff",
  compare: "#075985",
  visited: "#64748b",
  rest: "#334155",
};

export function TreeView({ state, highlight }: StructureViewProps) {
  const s = state as TreeState;
  const byId = new Map(s.nodes.map((n) => [n.id, n]));
  const pos = new Map<number, { x: number; y: number }>();
  let slot = 0;
  let maxDepth = 0;

  const walk = (id: number | null | undefined, depth: number) => {
    if (id == null) return;
    const n = byId.get(id);
    if (!n) return;
    walk(n.left, depth + 1);
    pos.set(id, { x: PAD + slot * GAPX + R, y: PAD + depth * GAPY + R });
    slot++;
    maxDepth = Math.max(maxDepth, depth);
    walk(n.right, depth + 1);
  };
  walk(s.root, 0);

  if (s.root == null || pos.size === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="rounded-2xl border-2 border-dashed border-slate-300 px-6 py-4 text-sm text-slate-400">
          empty tree
        </span>
        {s.caption && <p className="text-sm font-bold text-slate-600">{s.caption}</p>}
      </div>
    );
  }

  const width = PAD * 2 + slot * GAPX;
  const height = PAD * 2 + (maxDepth + 1) * GAPY;

  const pointersAt: Record<number, string[]> = {};
  for (const [label, id] of Object.entries(s.pointers ?? {})) {
    (pointersAt[id] ??= []).push(label);
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="max-w-full" style={{ height: Math.min(height, 320) }}>
        {/* edges */}
        {s.nodes.map((n) =>
          (["left", "right"] as const).map((side) => {
            const childId = n[side];
            if (childId == null) return null;
            const a = pos.get(n.id);
            const b = pos.get(childId);
            if (!a || !b) return null;
            return <line key={`${n.id}-${side}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth={2} />;
          }),
        )}
        {/* nodes */}
        {s.nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          const role = roleOf(n.id, highlight);
          const labels = pointersAt[n.id] ?? [];
          return (
            <g key={n.id}>
              {labels.length > 0 && (
                <text x={p.x} y={p.y - R - 6} textAnchor="middle" className="fill-violet-700 text-[10px] font-extrabold">
                  {labels.join(",")}▾
                </text>
              )}
              <circle cx={p.x} cy={p.y} r={R} fill={FILL[role]} stroke={role === "rest" ? "#94a3b8" : FILL[role]} strokeWidth={2} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fill={TEXT[role]} className="text-[13px] font-bold">
                {n.value}
              </text>
            </g>
          );
        })}
      </svg>
      {s.caption && <p className="text-sm font-bold text-slate-600">{s.caption}</p>}
    </div>
  );
}
