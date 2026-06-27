import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { DomainsHubClient } from "@/components/domains/DomainsHubClient";
import { redirect } from "next/navigation";
import { FREE_FEATURE_LIMIT } from "@/lib/usage";

export const metadata = { title: "Learning Domains — HYRISE" };
export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/domains");

  const supabase = createClient();
  const proUser = isUserPro(profile.plan, profile.email);

  const [progressResult, usageResult] = await Promise.all([
    supabase
      .from("domain_progress")
      .select("domain, status")
      .eq("user_id", profile.id)
      .eq("status", "mastered"),
    !proUser
      ? supabase
          .from("feature_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("feature", "domains")
      : Promise.resolve({ count: 0 }),
  ]);

  const progress: Record<string, number> = {};
  for (const r of progressResult.data ?? []) progress[r.domain] = (progress[r.domain] ?? 0) + 1;

  const freeUsed = (usageResult as { count: number | null }).count ?? 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900">
            Learn any <span className="text-gradient">Domain</span> 🧭
          </h1>
          <p className="mt-2 text-slate-500">
            Choose a field, follow the roadmap, and master every topic with games, diagrams, and quizzes.
          </p>
        </div>
        <DomainsHubClient
          progress={progress}
          pro={proUser}
          freeUsed={freeUsed}
          freeLimit={FREE_FEATURE_LIMIT}
          isPro={proUser}
        />
      </main>
      <Footer />
    </>
  );
}
