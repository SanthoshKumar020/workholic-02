"use client";

import Link from "next/link";
import { Lock, Star, Crown, Check } from "lucide-react";
import { type Domain, isTopicUnlocked, isTopicAccessible } from "@/lib/domains/catalog";
import { BitSays } from "@/components/dsa/Mascot";
import { cn } from "@/lib/utils";

export function DomainRoadmapClient({
  domain,
  mastered,
  stars,
  pro,
}: {
  domain: Domain;
  mastered: string[];
  stars: Record<string, number>;
  pro: boolean;
}) {
  const masteredSet = new Set(mastered);
  const doneCount = masteredSet.size;

  return (
    <div className="space-y-6">
      <BitSays mood="happy" size="lg">
        {doneCount === 0
          ? `Welcome to ${domain.name}! Start at topic 1 — finish it to unlock the next. 🌟`
          : `You've mastered ${doneCount}/${domain.roadmap.length} topics. Keep climbing! 🚀`}
      </BitSays>

      <ol className="relative mx-auto max-w-2xl">
        <span className="absolute left-[26px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-brand-200" aria-hidden="true" />
        {domain.roadmap.map((t, i) => {
          const unlocked = isTopicUnlocked(i, masteredSet, domain.roadmap);
          const accessible = isTopicAccessible(i, domain, pro);
          const isMastered = masteredSet.has(t.slug);
          const topicStars = stars[t.slug] ?? 0;
          const prereqLocked = !unlocked;
          const proLocked = unlocked && !accessible;
          const locked = prereqLocked || proLocked;

          const card = (
            <div
              className={cn(
                "ml-12 flex-1 rounded-2xl border p-4 shadow-sm transition",
                locked ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Topic {i + 1}</span>
                {!domain.free && i >= 3 && <Crown className={cn("h-3.5 w-3.5", pro ? "text-amber-400" : "text-slate-300")} />}
              </div>
              <p className="mt-0.5 font-extrabold text-slate-800">{t.title}</p>
              {locked ? (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400">
                  <Lock className="h-3 w-3" /> {prereqLocked ? "Finish the previous topic first" : "Pro topic — upgrade to unlock"}
                </p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-slate-500">{t.blurb}</p>
                  <div className="mt-2 flex items-center gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star key={s} className={cn("h-4 w-4", s <= topicStars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
                    ))}
                  </div>
                </>
              )}
            </div>
          );

          return (
            <li key={t.slug} className="relative mb-5 flex">
              <span
                className={cn(
                  "absolute left-[18px] top-6 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow",
                  isMastered ? "bg-emerald-500" : locked ? "bg-slate-300" : "bg-brand-500",
                )}
                aria-hidden="true"
              >
                {isMastered ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {prereqLocked ? (
                <div aria-disabled className="flex w-full cursor-not-allowed">{card}</div>
              ) : proLocked ? (
                <Link href="/billing" className="flex w-full">{card}</Link>
              ) : (
                <Link href={`/domains/${domain.slug}/${t.slug}`} className="flex w-full">{card}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
