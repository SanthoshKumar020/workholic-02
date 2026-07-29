"use client";
import { Flame, Star, Award } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const XP_LEVELS = [
  { min: 0, max: 100, label: "Beginner" },
  { min: 100, max: 300, label: "Explorer" },
  { min: 300, max: 600, label: "Achiever" },
  { min: 600, max: 1000, label: "Pro Candidate" },
  { min: 1000, max: 2000, label: "Career Champion" },
  { min: 2000, max: Infinity, label: "Legend" },
];

/**
 * Badges are XP milestones, and they now say so.
 *
 * They previously carried activity names — "First Resume" at 10 XP,
 * "Interviewer" at 30, "Letter Writer" at 80 — but were all awarded purely on
 * total XP. Finishing one DSA island (30+ XP) handed you "First Resume" and
 * "Interviewer" without ever opening the resume builder. A badge that claims
 * you did something you didn't is worse than no badge: it tells the user the
 * progress display is decorative and can be ignored.
 *
 * Naming them honestly as milestones keeps them meaningful. Wiring genuine
 * per-activity achievements needs real per-feature counters (feature_usage
 * already records them) — worth doing, but not something to fake in the
 * meantime.
 */
const BADGES = [
  { id: "xp_10", label: "First Steps", icon: "🌱", xpRequired: 10 },
  { id: "xp_30", label: "Getting Going", icon: "⚡", xpRequired: 30 },
  { id: "xp_50", label: "Halfway Habit", icon: "🎯", xpRequired: 50 },
  { id: "week_streak", label: "7-Day Streak", icon: "🔥", xpRequired: 0, streakRequired: 7 },
  { id: "xp_100", label: "Century", icon: "💯", xpRequired: 100 },
  { id: "xp_250", label: "Serious About This", icon: "🏆", xpRequired: 250 },
];

export function StreakWidget({
  xp,
  streak,
  plan,
}: {
  xp: number;
  streak: number;
  plan: string;
}) {
  const level = XP_LEVELS.find((l) => xp >= l.min && xp < l.max) ?? XP_LEVELS[0];
  const nextLevel = XP_LEVELS.find((l) => l.min > xp);
  const progress = nextLevel
    ? Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const earnedBadges = BADGES.filter(
    (b) => xp >= b.xpRequired && (!b.streakRequired || streak >= b.streakRequired)
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* XP + Level */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{level.label}</span>
              {plan === "pro" && <Badge variant="default" className="text-xs">Pro</Badge>}
            </div>
            <p className="text-sm text-slate-500">{xp} XP</p>
            {nextLevel && (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-slate-400">{nextLevel.min - xp} to {nextLevel.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${streak > 0 ? "bg-orange-500" : "bg-slate-100"}`}>
            <Flame className={`h-5 w-5 ${streak > 0 ? "text-white" : "text-slate-400"}`} />
          </div>
          <div>
            <p className="font-bold text-slate-900">{streak} day{streak !== 1 ? "s" : ""}</p>
            <p className="text-xs text-slate-500">current streak</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Badges earned</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((b) => (
              <div
                key={b.id}
                title={b.label}
                className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-800"
              >
                <span>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
