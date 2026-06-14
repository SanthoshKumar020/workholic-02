import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { CompanyPrepClient } from "@/components/CompanyPrepClient";
import { redirect } from "next/navigation";

export const metadata = { title: "Company Interview Prep — ResumeBoost" };

export default async function CompanyPrepPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/company-prep");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8">
          <div className="mb-2 inline-block rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-bold text-brand-600 uppercase tracking-wide">
            Free Feature
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Company Interview Prep</h1>
          <p className="mt-2 text-slate-500">
            Deep-dive into 12 top companies — interview process, culture, salary, and a real question bank
            sourced from actual interview experiences. Select a company to begin.
          </p>
        </div>
        <CompanyPrepClient />
      </main>
      <Footer />
    </>
  );
}
