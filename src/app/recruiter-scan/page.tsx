import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { RecruiterScanClient } from "@/components/RecruiterScanClient";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { ProGate } from "@/components/ui/ProGate";

export const metadata = { title: "Recruiter Scan — HYRISE" };

export default async function RecruiterScanPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/recruiter-scan");

  const pro = isUserPro(profile.plan, profile.email ?? "");

  return (
    <>
      <Navbar />
      <PageShell
        title="Recruiter Scan"
        description="Will your resume survive a 6-second recruiter scan? Get a callback likelihood score and the exact fixes."
      >
        {!pro ? (
          <ProGate blurb="Recruiter Scan simulates how a real recruiter reads your resume in 6 seconds — giving you a callback likelihood score, keyword gaps, and prioritised fixes tied to a specific job description." />
        ) : (
          <RecruiterScanClient />
        )}
      </PageShell>
      <Footer />
    </>
  );
}
