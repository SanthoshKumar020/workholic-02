import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { TailorClient } from "@/components/TailorClient";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata = { title: "Company Tailoring — HYRISE" };

export default async function TailorPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/tailor");

  const pro = isUserPro(profile.plan, profile.email ?? "");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Company Tailoring</h1>
          <p className="mt-2 text-slate-500">
            Paste a job description. Get a resume rewrite + cover letter optimised for that one specific posting.
          </p>
        </div>

        {!pro ? (
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Lock className="h-7 w-7 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Pro Feature</h2>
            <p className="max-w-sm text-slate-500">
              Company Tailoring rewrites your summary and experience bullets using the exact language of the job posting,
              and generates a bespoke cover letter — all in one place.
            </p>
            <Link href="/billing"
              className="rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition">
              Upgrade to Pro
            </Link>
          </div>
        ) : (
          <TailorClient targetRole={profile.target_role ?? ""} />
        )}
      </main>
      <Footer />
    </>
  );
}
