import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Upgrade prompt shown to free users in place of a saved-history list.
 * History (saved resumes, roadmaps, application tracker, …) is a Pro-only feature.
 */
export function ProHistoryGate({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
        <Lock className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{blurb}</p>
      <Link
        href="/billing"
        className="mt-6 inline-block rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
      >
        Upgrade to Pro →
      </Link>
    </div>
  );
}
