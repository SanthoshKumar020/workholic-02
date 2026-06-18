"use client";

import type { StructureViewProps } from "@/lib/dsa/types";

/** Shared StructureView for graphs (BFS/DFS). Nodes carry fixed positions. */
export interface GNode {
  id: number;
  label: string;
  x: number;
  y: number;
}
export interface GraphState {
  nodes: GNode[];
  edges: [number, number][];
  directed?: boolean;
  pointers?: Record<string, number>;
  caption?: string;
}

const R = 20;

function roleOf(id: number, h: StructureViewProps["highlight"]) {
  if (h.active?.includes(id)) return "active";
  if (h.compare?.includes(id)) return "compare";
  if (h.placed?.includes(id)) return "placed";
  if (h.visited?.includes(id)) return "visited";
  return "rest";
}
const FILL: Record<string, string> = { active: "#8b5cf6", compare: "#38bdf8", placed: "#34d399", visited: "#cbd5e1", rest: "#ffffff" };
const TXT: Record<string, string> = { active: "#fff", compare: "#075985", placed: "#065f46", visited: "#64748b", rest: "#334155" };

export function GraphView({ state, highlight }: StructureViewProps) {
  const s = state as GraphState;
  const byId = new Map(s.nodes.map((n) => [n.id, n]));
  const width = Math.max(...s.nodes.map((n) => n.x)) + R + 24;
  const height = Math.max(...s.nodes.map((n) => n.y)) + R + 24;

  const pointersAt: Record<number, string[]> = {};
  for (const [label, id] of Object.entries(s.pointers ?? {})) (pointersAt[id] ??= []).push(label);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="max-w-full" style={{ height: Math.min(height, 300) }}>
        {s.directed && (
          <defs>
            <marker id="gv-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
            </marker>
          </defs>
        )}
        {s.edges.map(([a, b], i) => {
          const na = byId.get(a);
          const nb = byId.get(b);
          if (!na || !nb) return null;
          return (
            <line
              key={i}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke="#cbd5e1"
              strokeWidth={2.5}
              markerEnd={s.directed ? "url(#gv-arrow)" : undefined}
            />
          );
        })}
        {s.nodes.map((n) => {
          const role = roleOf(n.id, highlight);
          const labels = pointersAt[n.id] ?? [];
          return (
            <g key={n.id}>
              {labels.length > 0 && (
                <text x={n.x} y={n.y - R - 6} textAnchor="middle" className="fill-violet-700 text-[10px] font-extrabold">
                  {labels.join(",")}
                </text>
              )}
              <circle cx={n.x} cy={n.y} r={R} fill={FILL[role]} stroke={role === "rest" ? "#94a3b8" : FILL[role]} strokeWidth={2.5} />
              <text x={n.x} y={n.y + 5} textAnchor="middle" fill={TXT[role]} className="text-sm font-bold">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      {s.caption && <p className="text-center text-sm font-bold text-slate-600">{s.caption}</p>}
    </div>
  );
}
