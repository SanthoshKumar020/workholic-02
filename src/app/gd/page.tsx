import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { GDPracticeClient } from "@/components/GDPracticeClient";
import { PageShell } from "@/components/ui/PageShell";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FREE_FEATURE_LIMIT } from "@/lib/usage";

export const metadata = { title: "GD Practice — HYRISE" };
export const dynamic = "force-dynamic";

export default async function GDPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/gd");

  const proUser = isUserPro(profile.plan, profile.email);
  let freeUsed = 0;
  if (!proUser) {
    const supabase = createClient();
    const { count } = await supabase
      .from("feature_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("feature", "gd");
    freeUsed = count ?? 0;
  }

  return (
    <>
      <Navbar />
      <PageShell
        width="narrow"
        title="Group Discussion Practice"
        description="AI gives you a topic. You respond (voice or text). It scores your fluency, structure, and content — then shows you a model response."
      >
        <GDPracticeClient freeUsed={freeUsed} freeLimit={FREE_FEATURE_LIMIT} isPro={proUser} />
      </PageShell>
      <Footer />
    </>
  );
}
