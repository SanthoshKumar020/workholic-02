import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MentorClient } from "@/components/MentorClient";
import { getCurrentProfile, isPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { ProGate } from "@/components/ui/ProGate";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Career Mentor — HYRISE" };

export default async function MentorPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/mentor");

  if (profile.plan !== "pro") {
    return (
      <>
        <Navbar />
        <PageShell width="form">
          <ProGate
            headingLevel="h1"
            title="AI Career Mentor"
            iconTone="amber"
            blurb="A personal AI mentor that remembers your resume, goals, and progress — and gives you a fresh weekly action plan every Monday."
          />
        </PageShell>
        <Footer />
      </>
    );
  }

  const supabase = createClient();
  const [{ data: memory }, { data: messages }] = await Promise.all([
    supabase.from("mentor_memory").select("*").eq("user_id", profile.id).single(),
    supabase.from("mentor_messages").select("*").eq("user_id", profile.id).order("created_at", { ascending: true }).limit(40),
  ]);

  return (
    <>
      <Navbar />
      <PageShell width="wide">
        <MentorClient
          initialMemory={memory ?? null}
          initialMessages={messages ?? []}
          profileName={profile.full_name ?? "there"}
          profileTargetRole={profile.target_role ?? ""}
        />
      </PageShell>
      <Footer />
    </>
  );
}
