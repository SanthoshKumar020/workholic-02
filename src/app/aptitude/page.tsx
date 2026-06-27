import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AptitudeHubClient } from "@/components/AptitudeHubClient";
import { APTITUDE_CATEGORIES } from "@/lib/aptitude-topics";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { FREE_FEATURE_LIMIT } from "@/lib/usage";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Aptitude Prep — HYRISE",
  description: "Master aptitude, speed maths tricks, and logical reasoning with AI-powered lessons and quizzes.",
};
export const dynamic = "force-dynamic";

export default async function AptitudePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/aptitude");

  const totalTopics = APTITUDE_CATEGORIES.reduce((s, c) => s + c.topics.length, 0);
  const proUser = isUserPro(profile.plan, profile.email);
  let freeUsed = 0;
  if (!proUser) {
    const supabase = createClient();
    const { count } = await supabase
      .from("feature_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("feature", "aptitude");
    freeUsed = count ?? 0;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            ⚡ {proUser ? "Pro" : "Free"} · {totalTopics} topics · AI-powered lessons &amp; quizzes
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900">Aptitude Mastery</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            From speed maths tricks to probability — every topic explained so simply even a 5-year-old gets it,
            then built up to exam level. Click any topic to start learning.
          </p>
        </div>
        <AptitudeHubClient
          categories={APTITUDE_CATEGORIES}
          freeUsed={freeUsed}
          freeLimit={FREE_FEATURE_LIMIT}
          isPro={proUser}
        />
      </main>
      <Footer />
    </>
  );
}
