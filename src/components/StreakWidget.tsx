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

const BADGES = [
  { id: "first_resume", label: "First Resume", icon: "📄", xpRequired: 10 },
  { id: "first_interview", label: "Interviewer", icon: "🎤", xpRequired: 30 },
  { id: "roadmap_creator", label: "Roadmap Builder", icon: "🗺️", xpRequired: 50 },
  { id: "week_streak", label: "7-Day Streak", icon: "🔥", xpRequired: 70, streakRequired: 7 },
  { id: "cover_letter", label: "Letter Writer", icon: "✉️", xpRequired: 80 },
  { id: "quiz_master", label: "Quiz Master", icon: "🎓", xpRequired: 100 },
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
