import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ResumeBuilderClient } from "@/components/ResumeBuilderClient";
import { PageShell } from "@/components/ui/PageShell";
import { getCurrentProfile, isPro, isSuperAdmin } from "@/lib/plan";
import { FREE_ENHANCE_LIMIT } from "@/lib/usage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getCurrentProfile();

  const proUser = isPro(profile?.plan) || isSuperAdmin(user?.email);

  // Count the free-plan usage directly from saved resumes (permanent source of truth).
  let resumesUsed = 0;
  if (!proUser && user) {
    const { count } = await supabase
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    resumesUsed = count ?? 0;
  }

  return (
    <>
      <Navbar />
      <PageShell
        width="wide"
        title="Resume Builder"
        description="Fill in the detailed form or upload an existing resume (PDF, DOCX, TXT). AI will enhance it, score it for ATS, and let you export a polished PDF."
      >
        <ResumeBuilderClient
          isPro={proUser}
          defaultName=""
          defaultEmail={user?.email ?? ""}
          resumesUsed={resumesUsed}
          freeLimit={FREE_ENHANCE_LIMIT}
        />
      </PageShell>
      <Footer />
    </>
  );
}
