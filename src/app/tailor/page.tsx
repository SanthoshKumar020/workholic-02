import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { TailorClient } from "@/components/TailorClient";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { ProGate } from "@/components/ui/ProGate";

export const metadata = { title: "Company Tailoring — HYRISE" };

export default async function TailorPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/tailor");

  const pro = isUserPro(profile.plan, profile.email ?? "");

  return (
    <>
      <Navbar />
      <PageShell
        title="Company Tailoring"
        description="Paste a job description. Get a resume rewrite + cover letter optimised for that one specific posting."
      >
        {!pro ? (
          <ProGate blurb="Company Tailoring rewrites your summary and experience bullets using the exact language of the job posting, and generates a bespoke cover letter — all in one place." />
        ) : (
          <TailorClient targetRole={profile.target_role ?? ""} />
        )}
      </PageShell>
      <Footer />
    </>
  );
}
