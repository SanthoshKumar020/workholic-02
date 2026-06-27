import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RoadmapClient } from "@/components/RoadmapClient";
import { RoadmapRenderer } from "@/components/RoadmapRenderer";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { FREE_FEATURE_LIMIT } from "@/lib/usage";
import type { RoadmapRow } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { id?: string };
}

export default async function RoadmapPage({ searchParams }: Props) {
  const id = searchParams.id?.trim();
  const profile = await getCurrentProfile();
  const supabase = createClient();

  let savedRoadmap: RoadmapRow | null = null;
  if (id) {
    const { data } = await supabase.from("roadmaps").select("*").eq("id", id).single();
    savedRoadmap = (data as RoadmapRow) ?? null;
  }

  const proUser = profile ? isUserPro(profile.plan, profile.email) : false;
  let freeUsed = 0;
  if (!proUser && profile) {
    const { count } = await supabase
      .from("feature_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("feature", "roadmap");
    freeUsed = count ?? 0;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8f9ff]">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {savedRoadmap ? savedRoadmap.topic : "Learning Roadmap"}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {savedRoadmap
                    ? "Pick up where you left off — your progress is auto-saved."
                    : "Enter a role or skill to generate a personalised step-by-step learning plan."}
                </p>
              </div>
              <Link href="/roadmaps" className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                My roadmaps
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-10">
          {savedRoadmap ? (
            <RoadmapRenderer
              initialRoadmap={savedRoadmap}
              userName={profile?.email?.split("@")[0] || "Learner"}
              lang={profile?.preferred_language || "en"}
            />
          ) : id ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <h2 className="text-lg font-semibold text-amber-900">Roadmap not found</h2>
              <p className="mt-1 text-sm text-amber-700">
                That roadmap doesn&apos;t exist or doesn&apos;t belong to your account.
              </p>
              <Link href="/roadmap" className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                Generate a new roadmap
              </Link>
            </div>
          ) : (
            <RoadmapClient freeUsed={freeUsed} freeLimit={FREE_FEATURE_LIMIT} isPro={proUser} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
