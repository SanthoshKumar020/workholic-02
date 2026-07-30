import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ApplicationTrackerClient } from "@/components/ApplicationTrackerClient";
import { ProHistoryGate } from "@/components/ui/ProHistoryGate";
import { PageShell } from "@/components/ui/PageShell";
import { getCurrentProfile, isPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Application Tracker — HYRISE" };

export default async function TrackerPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/tracker");

  const pro = isPro(profile.plan);

  const supabase = createClient();
  const { data } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <PageShell
        width="wide"
        title="Application Tracker"
        description="Track every application from submitted to offer. Get AI-drafted follow-up emails in one click."
      >
        {pro ? (
          <ApplicationTrackerClient initialApplications={data ?? []} />
        ) : (
          <ProHistoryGate
            title="Application Tracker is a Pro feature"
            blurb="Track every application from submitted to offer, with AI-drafted follow-ups. Upgrade to Pro to unlock your application history."
          />
        )}
      </PageShell>
      <Footer />
    </>
  );
}
