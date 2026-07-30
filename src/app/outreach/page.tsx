import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { OutreachClient } from "@/components/OutreachClient";
import { PageShell } from "@/components/ui/PageShell";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FREE_FEATURE_LIMIT } from "@/lib/usage";

export const metadata = { title: "Outreach Generator — HYRISE" };
export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/outreach");

  const proUser = isUserPro(profile.plan, profile.email);
  let freeUsed = 0;
  if (!proUser) {
    const supabase = createClient();
    const { count } = await supabase
      .from("feature_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("feature", "outreach");
    freeUsed = count ?? 0;
  }

  return (
    <>
      <Navbar />
      <PageShell
        width="narrow"
        title="Outreach Generator"
        description="LinkedIn DMs, cold emails, and referral asks — crafted for your target company and role. Networking is the highest-leverage job tactic."
      >
        <OutreachClient
          defaultName=""
          defaultRole={profile.target_role ?? ""}
          freeUsed={freeUsed}
          freeLimit={FREE_FEATURE_LIMIT}
          isPro={proUser}
        />
      </PageShell>
      <Footer />
    </>
  );
}
