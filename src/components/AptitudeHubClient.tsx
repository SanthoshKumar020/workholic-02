"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { BitSays } from "@/components/dsa/Mascot";
import type { AptitudeCategory } from "@/lib/aptitude-topics";
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from "@/lib/aptitude-topics";
import { PlanUsageBadge, UpgradeWall } from "@/components/ui/PlanUsageBadge";

interface Props {
  categories: AptitudeCategory[];
  freeUsed?: number;
  freeLimit?: number;
  isPro?: boolean;
}

export function AptitudeHubClient({ categories, freeUsed = 0, freeLimit = 5, isPro = false }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const allTopics = useMemo(
    () => categories.flatMap((c) => c.topics.map((t) => ({ ...t, category: c.category, categoryIcon: c.icon, categoryColor: c.color }))),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allTopics.filter((t) => {
      const matchSearch = !q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      const matchCategory = activeCategory === "All" || t.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [search, activeCategory, allTopics]);

  const categoryTabs = ["All", ...categories.map((c) => c.category)];

  // Track completed topics from localStorage
  const [completed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = JSON.parse(localStorage.getItem("aptitude_completed") ?? "[]");
      return new Set(stored);
    } catch { return new Set(); }
  });

  const exhausted = !isPro && freeUsed >= freeLimit;

  return (
    <div className="space-y-6">
      {!isPro && (
        <PlanUsageBadge used={freeUsed} limit={freeLimit} feature="aptitude" />
      )}
      {exhausted && <UpgradeWall limit={freeLimit} feature="aptitude lessons" />}
      <BitSays mood="wave">
        Hi, I&apos;m Bit! 🤖 Pick any topic and I&apos;ll teach it the easy way — a simple explanation first, then a fun quiz. Let&apos;s go!
      </BitSays>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search topics… e.g. percentages, trains, probability"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categoryTabs.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-xl px-4 py-1.5 text-sm font-semibold transition ${
              activeCategory === cat
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat === "All" ? "All Topics" : cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-400">
        {filtered.length} topic{filtered.length !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
        {completed.size > 0 && ` · ${completed.size} completed`}
      </p>

      {/* Topic grid — grouped by category when showing all */}
      {activeCategory === "All" && !search ? (
        <div className="space-y-10">
          {categories.map((cat) => (
            <div key={cat.category}>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <h2 className="text-base font-bold text-slate-800">{cat.category}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {cat.topics.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cat.topics.map((topic) => {
                  const done = completed.has(topic.id);
                  return (
                    <Link
                      key={topic.id}
                      href={`/aptitude/${topic.id}`}
                      className="group relative flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl border border-slate-100 group-hover:bg-brand-50 transition">
                        {topic.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition line-clamp-2 text-sm leading-snug">
                          {topic.title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIFFICULTY_COLOR[topic.difficulty]}`}>
                            {DIFFICULTY_LABEL[topic.difficulty]}
                          </span>
                          {done && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              ✓ Done
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat grid for search / filtered view */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-slate-400">
              No topics found for &ldquo;{search}&rdquo;
            </div>
          ) : (
            filtered.map((topic) => {
              const done = completed.has(topic.id);
              return (
                <Link
                  key={topic.id}
                  href={`/aptitude/${topic.id}`}
                  className="group relative flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl border border-slate-100 group-hover:bg-brand-50 transition">
                    {topic.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-400 mb-0.5">
                      {topic.categoryIcon} {topic.category}
                    </p>
                    <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition line-clamp-2 text-sm leading-snug">
                      {topic.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIFFICULTY_COLOR[topic.difficulty]}`}>
                        {DIFFICULTY_LABEL[topic.difficulty]}
                      </span>
                      {done && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          ✓ Done
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
