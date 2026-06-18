"use client";

import Link from "next/link";
import { Lock, Star, Sparkles, Crown, CalendarClock } from "lucide-react";
import { ISLANDS, isIslandUnlocked, getIsland, type Island } from "@/lib/dsa/curriculum";
import { BitSays } from "@/components/dsa/Mascot";
import { cn } from "@/lib/utils";

export interface IslandProgress {
  stars: number;
  status: string;
}

export function WorldMapClient({
  progress,
  pro,
  dueCount,
}: {
  progress: Record<string, IslandProgress>;
  pro: boolean;
  dueCount: number;
}) {
  const masteredSet = new Set(
    Object.entries(progress)
      .filter(([, p]) => p.status === "mastered")
      .map(([slug]) => slug),
  );
  const masteredCount = masteredSet.size;
  const totalStars = Object.values(progress).reduce((sum, p) => sum + (p.stars ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Greeting + stats */}
      <div className="flex flex-col gap-4 rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-fuchsia-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <BitSays mood="wave" size="lg">
          {masteredCount === 0
            ? "Hi, I'm Bit! 🤖 Ready to explore? Tap the first island to begin our adventure!"
            : `Welcome back, explorer! You've mastered ${masteredCount} island${masteredCount > 1 ? "s" : ""}. Onward! 🚀`}
        </BitSays>
        <div className="flex shrink-0 gap-3">
          <Stat icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />} value={totalStars} label="stars" />
          <Stat icon={<Sparkles className="h-4 w-4 text-brand-500" />} value={masteredCount} label="mastered" />
          {dueCount > 0 && (
            <Link href="/dsa/review">
              <Stat
                icon={<CalendarClock className="h-4 w-4 text-emerald-500" />}
                value={dueCount}
                label="to review"
                highlight
              />
            </Link>
          )}
        </div>
      </div>

      {/* The journey path */}
      <ol className="relative mx-auto max-w-2xl">
        {/* dashed spine */}
        <span className="absolute left-[34px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-brand-200 sm:left-1/2" aria-hidden="true" />
        {ISLANDS.map((island, i) => (
          <IslandNode
            key={island.slug}
            island={island}
            index={i}
            unlocked={isIslandUnlocked(island, masteredSet)}
            accessible={island.free || pro}
            progress={progress[island.slug]}
            due={dueCount > 0 && masteredSet.has(island.slug)}
          />
        ))}
      </ol>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[64px] flex-col items-center rounded-2xl border px-3 py-2",
        highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white",
      )}
    >
      {icon}
      <span className="mt-0.5 text-lg font-extrabold text-slate-800">{value}</span>
      <span className="text-[10px] font-semibold text-slate-400">{label}</span>
    </div>
  );
}

function IslandNode({
  island,
  index,
  unlocked,
  accessible,
  progress,
  due,
}: {
  island: Island;
  index: number;
  unlocked: boolean;
  accessible: boolean;
  progress?: IslandProgress;
  due: boolean;
}) {
  const left = index % 2 === 0;
  const stars = progress?.stars ?? 0;
  const mastered = progress?.status === "mastered";
  const proLocked = unlocked && !accessible;
  const prereqLocked = !unlocked;
  const locked = proLocked || prereqLocked;
  const comingSoon = !island.built;

  const blockedReason = prereqLocked
    ? `Finish ${island.prereqs.map((s) => getIsland(s)?.kidName ?? s).join(" & ")} first`
    : proLocked
      ? "Pro island — upgrade to explore"
      : null;

  const card = (
    <div
      className={cn(
        "group relative w-full max-w-sm rounded-3xl border p-4 shadow-sm transition",
        locked ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white hover:-translate-y-1 hover:shadow-md",
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow",
            island.gradient,
            locked && "opacity-50 grayscale",
          )}
        >
          {island.emoji}
          {due && (
            <span className="absolute -right-1 -top-1 text-lg motion-safe:animate-pulse" title="Review due">
              ✨
            </span>
          )}
          {mastered && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
              ✓
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-extrabold text-slate-800">{island.kidName}</h3>
            {!island.free && (
              <Crown className={cn("h-3.5 w-3.5 shrink-0", accessible ? "text-amber-400" : "text-slate-300")} />
            )}
          </div>
          <p className="text-xs font-semibold text-brand-500">{island.techName}</p>
          {locked ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400">
              <Lock className="h-3 w-3" /> {blockedReason}
            </p>
          ) : comingSoon ? (
            <p className="mt-1 text-xs font-medium text-slate-400">Coming soon 🛠️</p>
          ) : (
            <div className="mt-1 flex items-center gap-0.5">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={cn("h-4 w-4", s <= stars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {!locked && !comingSoon && (
        <p className="mt-2 text-xs text-slate-500">{island.blurb}</p>
      )}
    </div>
  );

  return (
    <li className={cn("relative mb-6 flex sm:w-1/2", left ? "sm:pr-6" : "sm:ml-auto sm:justify-end sm:pl-6")}>
      {/* node dot on the spine */}
      <span
        className={cn(
          "absolute left-[26px] top-7 z-10 h-4 w-4 rounded-full border-2 border-white shadow sm:left-auto",
          left ? "sm:-right-2" : "sm:-left-2",
          mastered ? "bg-emerald-500" : locked ? "bg-slate-300" : "bg-brand-500",
        )}
        aria-hidden="true"
      />
      <div className="ml-12 sm:ml-0">
        {prereqLocked ? (
          <div aria-disabled className="cursor-not-allowed">{card}</div>
        ) : proLocked ? (
          <Link href="/billing" aria-label={`${island.kidName} — upgrade to Pro`}>{card}</Link>
        ) : (
          <Link href={`/dsa/${island.slug}`} aria-label={island.kidName}>{card}</Link>
        )}
      </div>
    </li>
  );
}
