import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { EnglishClient } from "@/components/EnglishClient";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FREE_FEATURE_LIMIT } from "@/lib/usage";

export const metadata = { title: "English Learning — HYRISE" };
export const dynamic = "force-dynamic";

export default async function EnglishPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/english");

  const proUser = isUserPro(profile.plan, profile.email);
  let freeUsed = 0;
  if (!proUser) {
    const supabase = createClient();
    const { count } = await supabase
      .from("feature_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("feature", "english");
    freeUsed = count ?? 0;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">English for Professionals</h1>
          <p className="mt-2 text-slate-500">
            Learn workplace English through lessons, quizzes, and live conversation practice.
          </p>
        </div>
        <EnglishClient
          plan={profile.plan}
          preferredLanguage={profile.preferred_language || "en"}
          freeUsed={freeUsed}
          freeLimit={FREE_FEATURE_LIMIT}
          isPro={proUser}
        />
      </main>
      <Footer />
    </>
  );
}
