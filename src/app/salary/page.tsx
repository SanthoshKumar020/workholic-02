import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { SalaryCoachClient } from "@/components/SalaryCoachClient";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata = { title: "Salary Negotiation Coach — ResumeBoost" };

export default async function SalaryPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/salary");

  const pro = isUserPro(profile.plan, profile.email ?? "");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Salary Negotiation Coach</h1>
          <p className="mt-2 text-slate-500">
            Real market data, proven scripts, and live role-play with an AI hiring manager.
          </p>
        </div>

        {!pro ? (
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Lock className="h-7 w-7 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Pro Feature</h2>
            <p className="max-w-sm text-slate-500">
              The Salary Coach gives you market percentile data, negotiation scripts with
              objection handlers, and live role-play with an AI hiring manager.
            </p>
            <Link href="/billing"
              className="rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition">
              Upgrade to Pro
            </Link>
          </div>
        ) : (
          <SalaryCoachClient targetRole={profile.target_role ?? ""} />
        )}
      </main>
      <Footer />
    </>
  );
}
