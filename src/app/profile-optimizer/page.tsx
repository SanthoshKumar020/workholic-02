import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { ProfileOptimizerClient } from "@/components/ProfileOptimizerClient";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { ProGate } from "@/components/ui/ProGate";

export const metadata = { title: "Profile Optimizer — HYRISE" };

export default async function ProfileOptimizerPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/profile-optimizer");

  if (profile.plan !== "pro") {
    return (
      <>
        <Navbar />
        <PageShell width="form">
          <ProGate
            headingLevel="h1"
            title="Profile Optimizer"
            iconTone="amber"
            blurb="Get AI-powered optimization suggestions for your LinkedIn and Naukri profiles. Available on Pro."
          />
        </PageShell>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageShell width="narrow">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered · Pro feature
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Profile Optimizer</h1>
          <p className="mt-2 text-slate-500">
            Upload your resume and get instant, actionable suggestions to optimize your LinkedIn or Naukri profile — with ready-to-paste rewrites for every section.
          </p>
        </div>
        <ProfileOptimizerClient />
      </PageShell>
      <Footer />
    </>
  );
}
