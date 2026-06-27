"use client";
import Link from "next/link";

export function PlanUsageBadge({
  used,
  limit,
  feature,
}: {
  used: number;
  limit: number;
  feature: string;
}) {
  const exhausted = used >= limit;
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm ${
        exhausted
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <span>
        {exhausted
          ? `Free limit reached — you've used all ${limit} free ${feature} uses.`
          : `Free plan: ${used} / ${limit} uses · ${limit - used} remaining`}
      </span>
      <Link
        href="/billing"
        className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition text-center"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}

export function UpgradeWall({ limit, feature }: { limit: number; feature: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
      <p className="text-base font-semibold text-red-700">
        You&apos;ve used all {limit} free {feature} uses.
      </p>
      <p className="text-sm text-red-600">
        Upgrade to Pro for unlimited access to all AI features.
      </p>
      <Link
        href="/billing"
        className="inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
      >
        Upgrade to Pro →
      </Link>
    </div>
  );
}
