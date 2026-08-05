import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { InterviewClient } from "@/components/InterviewClient";
import { PageShell } from "@/components/ui/PageShell";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FREE_FEATURE_LIMIT } from "@/lib/usage";

export const metadata = { title: "Mock Interview — HYRISE" };

export default async function InterviewPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/interview");

  const supabase = createClient();
  const proUser = isUserPro(profile.plan, profile.email);

  // Daily session limit (existing) + permanent free limit (new)
  let sessionsTodayCount = 0;
  let freeUsed = 0;

  if (!proUser) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [dailyResult, usageResult] = await Promise.all([
      supabase
        .from("interview_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .gte("created_at", today.toISOString()),
      supabase
        .from("feature_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("feature", "interview-questions"),
    ]);
    sessionsTodayCount = dailyResult.count ?? 0;
    freeUsed = usageResult.count ?? 0;
  }

  return (
    <>
      <Navbar />
      <PageShell
        width="narrow"
        title="Mock Interview"
        description={
          <>
            Practice with AI-generated questions. Get instant feedback on each answer.
            {!proUser ? " Free plan: 1 mock interview." : " Student plan: 10 mock interviews a month."}
          </>
        }
      >
        <InterviewClient
          plan={profile.plan}
          targetRole={profile.target_role || ""}
          sessionsToday={sessionsTodayCount}
          freeUsed={freeUsed}
          freeLimit={FREE_FEATURE_LIMIT}
          isPro={proUser}
        />
      </PageShell>
      <Footer />
    </>
  );
}
