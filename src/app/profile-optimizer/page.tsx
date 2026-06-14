import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { ProfileOptimizerClient } from "@/components/ProfileOptimizerClient";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, Lock } from "lucide-react";

export const metadata = { title: "Profile Optimizer — ResumeBoost" };

export default async function ProfileOptimizerPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/profile-optimizer");

  if (profile.plan !== "pro") {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <div className="max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
              <Lock className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Profile Optimizer</h1>
            <p className="mt-3 text-slate-500">
              Get AI-powered optimization suggestions for your LinkedIn and Naukri profiles. Available on Pro.
            </p>
            <Link
              href="/billing"
              className="mt-6 inline-flex items-center rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white shadow-md hover:opacity-90"
            >
              Upgrade to Pro
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
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
      </main>
      <Footer />
    </>
  );
}
