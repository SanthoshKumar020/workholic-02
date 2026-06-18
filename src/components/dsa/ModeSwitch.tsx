"use client";

import { Baby, Sparkles, Briefcase } from "lucide-react";
import type { DsaMode } from "@/lib/dsa/types";
import { cn } from "@/lib/utils";

const MODES: { value: DsaMode; label: string; hint: string; icon: typeof Baby }[] = [
  { value: "kid", label: "Kid", hint: "Stories & pictures, no code", icon: Baby },
  { value: "beginner", label: "Beginner", hint: "Plain English + optional code", icon: Sparkles },
  { value: "interview", label: "Interview", hint: "Code, complexity & tips", icon: Briefcase },
];

/**
 * The 3-way explanation-level switch shown at the top of every lesson.
 * Presentational — the parent owns the value and persistence.
 */
export function ModeSwitch({
  value,
  onChange,
}: {
  value: DsaMode;
  onChange: (m: DsaMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Explanation level"
      className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
    >
      {MODES.map((m) => {
        const active = value === m.value;
        const Icon = m.icon;
        return (
          <button
            key={m.value}
            role="radio"
            aria-checked={active}
            title={m.hint}
            onClick={() => onChange(m.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
              active
                ? "bg-brand-gradient text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            <Icon className="h-4 w-4" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
