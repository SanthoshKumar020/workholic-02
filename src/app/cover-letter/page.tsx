import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { CoverLetterClient } from "@/components/CoverLetterClient";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata = { title: "Cover Letter Generator — HYRISE" };

export default async function CoverLetterPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/cover-letter");

  if (profile.plan !== "pro") {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <div className="max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
              <Lock className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Cover Letter Generator</h1>
            <p className="mt-3 text-slate-500">Generate tailored cover letters for any job in seconds. Available on Pro.</p>
            <Link href="/billing" className="mt-6 inline-flex items-center rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white shadow-md hover:opacity-90">
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
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Cover Letter Generator</h1>
          <p className="mt-2 text-slate-500">Paste your resume and a job description to generate a tailored cover letter.</p>
        </div>
        <CoverLetterClient />
      </main>
      <Footer />
    </>
  );
}
