"use client";

import { ArrowDown } from "lucide-react";
import type { DiagramSpec } from "@/lib/domains/types";

/**
 * Renders an AI-supplied flow diagram as a clean top-to-bottom pipeline:
 * each node is a box, connected by labelled arrows. Robust and mobile-friendly
 * for the common "A → B → C" learning diagrams.
 */
export function DiagramView({ spec }: { spec: DiagramSpec }) {
  const nodes = spec.nodes ?? [];
  if (nodes.length === 0) return null;

  // Find an edge label connecting node i → node i+1 (by id), if any.
  const labelBetween = (fromId: string, toId: string) =>
    spec.edges?.find((e) => e.from === fromId && e.to === toId)?.label;

  // Cross-links that aren't between consecutive nodes — shown as notes below.
  const idIndex = new Map(nodes.map((n, i) => [n.id, i]));
  const crossLinks = (spec.edges ?? []).filter((e) => {
    const a = idIndex.get(e.from);
    const b = idIndex.get(e.to);
    return a != null && b != null && b !== a + 1;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-brand-50/40 p-5">
      {spec.title && <p className="mb-3 text-center text-sm font-bold text-slate-600">{spec.title}</p>}
      <div className="flex flex-col items-center">
        {nodes.map((n, i) => (
          <div key={n.id} className="flex w-full flex-col items-center">
            <div className="max-w-xs rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-center text-sm font-bold text-slate-700 shadow-sm">
              {n.label}
            </div>
            {i < nodes.length - 1 && (
              <div className="flex flex-col items-center py-1 text-slate-400">
                <ArrowDown className="h-5 w-5" />
                {labelBetween(n.id, nodes[i + 1].id) && (
                  <span className="-mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {labelBetween(n.id, nodes[i + 1].id)}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {crossLinks.length > 0 && (
        <div className="mt-4 space-y-1 border-t border-slate-200 pt-3">
          {crossLinks.map((e, i) => {
            const from = nodes[idIndex.get(e.from)!]?.label;
            const to = nodes[idIndex.get(e.to)!]?.label;
            return (
              <p key={i} className="text-center text-xs text-slate-500">
                {from} → {to}{e.label ? ` (${e.label})` : ""}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
