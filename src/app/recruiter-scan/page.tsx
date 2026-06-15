import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { RecruiterScanClient } from "@/components/RecruiterScanClient";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata = { title: "Recruiter Scan — HYRISE" };

export default async function RecruiterScanPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/recruiter-scan");

  const pro = isUserPro(profile.plan, profile.email ?? "");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Recruiter Scan</h1>
          <p className="mt-2 text-slate-500">
            Will your resume survive a 6-second recruiter scan? Get a callback likelihood score and the exact fixes.
          </p>
        </div>

        {!pro ? (
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Lock className="h-7 w-7 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Pro Feature</h2>
            <p className="max-w-sm text-slate-500">
              Recruiter Scan simulates how a real recruiter reads your resume in 6 seconds — giving you a callback likelihood
              score, keyword gaps, and prioritised fixes tied to a specific job description.
            </p>
            <Link href="/billing"
              className="rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition">
              Upgrade to Pro
            </Link>
          </div>
        ) : (
          <RecruiterScanClient />
        )}
      </main>
      <Footer />
    </>
  );
}
