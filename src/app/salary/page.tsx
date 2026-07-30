import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { SalaryCoachClient } from "@/components/SalaryCoachClient";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { ProGate } from "@/components/ui/ProGate";

export const metadata = { title: "Salary Negotiation Coach — HYRISE" };

export default async function SalaryPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/salary");

  const pro = isUserPro(profile.plan, profile.email ?? "");

  return (
    <>
      <Navbar />
      <PageShell
        title="Salary Negotiation Coach"
        description="Real market data, proven scripts, and live role-play with an AI hiring manager."
      >
        {!pro ? (
          <ProGate blurb="The Salary Coach gives you market percentile data, negotiation scripts with objection handlers, and live role-play with an AI hiring manager." />
        ) : (
          <SalaryCoachClient targetRole={profile.target_role ?? ""} />
        )}
      </PageShell>
      <Footer />
    </>
  );
}
