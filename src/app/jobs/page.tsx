import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JobsClient } from "@/components/JobsClient";
import { getCurrentProfile, isPro } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const profile = await getCurrentProfile();
  const pro = isPro(profile?.plan);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Job Search</h1>
          <p className="mt-1 text-slate-600">
            Upload your resume or fill in your details — find jobs that exactly match your role, location, and work mode.
          </p>
        </div>

        {pro ? (
          <JobsClient />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-xl font-semibold text-amber-900">Job Alerts is a Pro feature</h2>
            <p className="mt-2 text-sm text-amber-800">
              Upgrade to Pro to search jobs and receive daily email alerts tailored to your role.
            </p>
            <Link
              href="/billing"
              className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Upgrade to Pro
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
