"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { DOMAINS } from "@/lib/domains/catalog";
import { BitSays } from "@/components/dsa/Mascot";
import { cn } from "@/lib/utils";
import { PlanUsageBadge, UpgradeWall } from "@/components/ui/PlanUsageBadge";

export function DomainsHubClient({
  progress,
  pro,
  freeUsed = 0,
  freeLimit = 3,
  isPro = false,
}: {
  progress: Record<string, number>;
  pro: boolean;
  freeUsed?: number;
  freeLimit?: number;
  isPro?: boolean;
}) {
  const exhausted = !isPro && freeUsed >= freeLimit;
  return (
    <div className="space-y-6">
      {!isPro && (
        <PlanUsageBadge used={freeUsed} limit={freeLimit} feature="domains" />
      )}
      {exhausted && <UpgradeWall limit={freeLimit} feature="domain lessons" />}
      <BitSays mood="wave" size="lg">
        Pick a field and I&apos;ll take you from <b>A to Z</b> — a roadmap of bite-sized lessons, each with diagrams,
        a quick game, and a quiz. Master one topic to unlock the next! 🚀
      </BitSays>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((d) => {
          const mastered = progress[d.slug] ?? 0;
          const total = d.roadmap.length;
          const pct = Math.round((mastered / total) * 100);
          const locked = !d.free && !pro;
          return (
            <Link
              key={d.slug}
              href={`/domains/${d.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className={cn("mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow", d.gradient)}>
                {d.emoji}
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">{d.name}</h3>
                {!d.free && <Crown className={cn("h-4 w-4", pro ? "text-amber-400" : "text-slate-300")} />}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{d.blurb}</p>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs font-semibold text-slate-400">
                  <span>{total} topics</span>
                  <span>{mastered}/{total} done</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn("h-full rounded-full bg-gradient-to-r", d.gradient)} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {locked && (
                <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Pro
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
