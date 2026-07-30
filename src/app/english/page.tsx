import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { EnglishClient } from "@/components/EnglishClient";
import { PageShell } from "@/components/ui/PageShell";
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
      <PageShell
        width="narrow"
        title="English for Professionals"
        description="Learn workplace English through lessons, quizzes, and live conversation practice."
      >
        <EnglishClient
          plan={profile.plan}
          preferredLanguage={profile.preferred_language || "en"}
          freeUsed={freeUsed}
          freeLimit={FREE_FEATURE_LIMIT}
          isPro={proUser}
        />
      </PageShell>
      <Footer />
    </>
  );
}
