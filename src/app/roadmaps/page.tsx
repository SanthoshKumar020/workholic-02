import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RoadmapsListClient } from "@/components/RoadmapsListClient";
import { ProHistoryGate } from "@/components/ui/ProHistoryGate";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isPro } from "@/lib/plan";
import type { RoadmapRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RoadmapsPage() {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const pro = isPro(profile?.plan);

  const { data } = await supabase
    .from("roadmaps")
    .select("*")
    .order("updated_at", { ascending: false });

  const roadmaps = (data as RoadmapRow[]) ?? [];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8f9ff] dark:bg-slate-950">
        <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Learning Roadmaps</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {roadmaps.length === 0
                    ? "No roadmaps yet — generate your first one."
                    : `${roadmaps.length} roadmap${roadmaps.length > 1 ? "s" : ""} · click any to continue learning`}
                </p>
              </div>
              <Link
                href="/roadmap"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New roadmap
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-10">
          {pro ? (
            <RoadmapsListClient initialRoadmaps={roadmaps} />
          ) : (
            <ProHistoryGate
              title="Saved roadmaps are a Pro feature"
              blurb="Generate a roadmap anytime on the free plan. Upgrade to Pro to save your roadmaps, track progress across sessions, and revisit them here."
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
