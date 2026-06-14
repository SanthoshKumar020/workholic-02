import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { InterviewClient } from "@/components/InterviewClient";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mock Interview — ResumeBoost" };

export default async function InterviewPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/interview");

  // Check daily session limit for free users
  const supabase = createClient();
  let sessionsTodayCount = 0;
  if (profile.plan === "free") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("interview_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .gte("created_at", today.toISOString());
    sessionsTodayCount = count ?? 0;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Mock Interview</h1>
          <p className="mt-2 text-slate-500">
            Practice with AI-generated questions. Get instant feedback on each answer.
            {profile.plan === "free" ? " Free plan: 1 session per day." : " Pro: unlimited sessions."}
          </p>
        </div>
        <InterviewClient
          plan={profile.plan}
          targetRole={profile.target_role || ""}
          sessionsToday={sessionsTodayCount}
        />
      </main>
      <Footer />
    </>
  );
}
