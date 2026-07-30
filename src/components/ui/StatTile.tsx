import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

/**
 * A single headline number.
 *
 * This shape — big figure, bold label, faint sub-line, inside a p-5 white card —
 * had been re-written locally in the institution dashboard, the DSA island, the
 * aptitude hub and the interview summary, each with a slightly different figure
 * size and a different set of tone colours. Since the tone is doing real work
 * here (red = "this batch is at risk"), it needs to mean the same thing on
 * every screen, which a per-file copy cannot guarantee.
 *
 * `tone` colours the number only. The label stays slate so a grid of tiles
 * still reads as a grid rather than as a warning.
 */
const toneClasses = {
  default: "text-slate-900",
  brand: "text-brand-600",
  good: "text-emerald-600",
  warn: "text-amber-600",
  bad: "text-red-600",
} as const;

export type StatTone = keyof typeof toneClasses;

export interface StatTileProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  value: React.ReactNode;
  label: React.ReactNode;
  /** Context for the number — "% of the batch", "best score per student". */
  sub?: React.ReactNode;
  tone?: StatTone;
  /** Small glyph or icon shown above the value. */
  icon?: React.ReactNode;
}

const StatTile = React.forwardRef<HTMLDivElement, StatTileProps>(
  ({ value, label, sub, tone = "default", icon, className, ...props }, ref) => (
    <Card ref={ref} padding="md" className={className} {...props}>
      {icon && <div className="mb-2 text-slate-400">{icon}</div>}
      <p className={cn("text-3xl font-extrabold leading-none", toneClasses[tone])}>
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </Card>
  )
);
StatTile.displayName = "StatTile";

export { StatTile };
