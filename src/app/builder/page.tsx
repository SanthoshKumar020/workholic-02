import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ResumeBuilderClient } from "@/components/ResumeBuilderClient";
import { getCurrentProfile, isPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getCurrentProfile();

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Resume Builder</h1>
          <p className="mt-1 text-slate-600">
            Fill in the detailed form or upload an existing resume (PDF, DOCX, TXT). AI will enhance it,
            score it for ATS, and let you export a polished PDF.
          </p>
        </div>
        <ResumeBuilderClient
          isPro={isPro(profile?.plan)}
          defaultName=""
          defaultEmail={user?.email ?? ""}
        />
      </main>
      <Footer />
    </>
  );
}
