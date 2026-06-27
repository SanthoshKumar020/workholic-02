import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { MatchClient } from "@/components/MatchClient";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FREE_FEATURE_LIMIT } from "@/lib/usage";

export const metadata = { title: "Job Match Analyzer — HYRISE" };
export const dynamic = "force-dynamic";

export default async function MatchPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/match");

  const proUser = isUserPro(profile.plan, profile.email);
  let freeUsed = 0;
  if (!proUser) {
    const supabase = createClient();
    const { count } = await supabase
      .from("feature_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("feature", "match");
    freeUsed = count ?? 0;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Job Match Analyzer</h1>
          <p className="mt-2 text-slate-500">
            Paste your resume and a job description to see how well you match and get ATS improvement tips.
            {!proUser ? " Full keyword tips available on Pro." : ""}
          </p>
        </div>
        <MatchClient
          plan={profile.plan ?? "free"}
          freeUsed={freeUsed}
          freeLimit={FREE_FEATURE_LIMIT}
          isPro={proUser}
        />
      </main>
      <Footer />
    </>
  );
}
