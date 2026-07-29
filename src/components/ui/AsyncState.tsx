import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * Shared empty / loading / error panels.
 *
 * Most tool pages in this app currently render a bare form on first landing,
 * a spinning submit button during a 15–30 second AI call, and — in several
 * cases — nothing at all when the request fails. That reads as broken even
 * when the underlying feature works perfectly.
 *
 * These three components give every tool the same answer to "what do I see
 * before, during, and after?". Modelled on the one page that already did this
 * well (ProfileOptimizerClient's "Takes 15–25 seconds" panel).
 */

// ── Empty ─────────────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  blurb,
  action,
  hints,
  className,
}: {
  /** An emoji or small SVG. Keep it one glyph. */
  icon?: React.ReactNode;
  title: string;
  /** One or two sentences on what this tool gives them. */
  blurb?: string;
  /** Primary CTA — usually "focus the input" or a link. */
  action?: React.ReactNode;
  /** Optional example prompts / tips shown as chips. */
  hints?: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
          {icon}
        </span>
      )}
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {blurb && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{blurb}</p>
      )}

      {hints && hints.length > 0 && (
        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {hints.map((h) => (
            <li
              key={h}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              {h}
            </li>
          ))}
        </ul>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────

/**
 * An in-place progress panel for long AI calls.
 *
 * `eta` matters more than the animation: telling someone "usually 15–25
 * seconds" is the difference between waiting and assuming it's broken.
 */
export function LoadingPanel({
  label = "Working on it…",
  eta,
  steps,
  className,
}: {
  label?: string;
  /** e.g. "Usually takes 15–25 seconds" */
  eta?: string;
  /** Optional list of what's happening, for longer multi-stage calls. */
  steps?: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-brand-100 bg-brand-50/50 px-6 py-12 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
      <p className="mt-4 text-sm font-semibold text-slate-800">{label}</p>
      {eta && <p className="mt-1 text-xs text-slate-500">{eta}</p>}

      {steps && steps.length > 0 && (
        <ul className="mt-5 space-y-1.5 text-left">
          {steps.map((s) => (
            <li key={s} className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Grey block placeholder for content that's still loading. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/70", className)} />;
}

/** A card-shaped skeleton — the default page-level loading shape. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Skeleton className="h-5 w-1/3" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

// ── Error ─────────────────────────────────────────────────────────────────────

/**
 * A failure the user can act on. Always offer a retry — several places in this
 * app currently only `console.error`, leaving a button that appears to do
 * nothing at all.
 */
export function ErrorPanel({
  title = "That didn't work",
  error,
  onRetry,
  className,
}: {
  title?: string;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center",
        className
      )}
      role="alert"
    >
      <p className="text-sm font-bold text-red-800">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-red-700/90">
        {error || "Something went wrong on our side. It's usually temporary."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  );
}
