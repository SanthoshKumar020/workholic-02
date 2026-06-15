import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BillingClient } from "@/components/BillingClient";
import { getCurrentProfile, isPro } from "@/lib/plan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Upgrade to Pro — HYRISE" };

export default async function BillingPage() {
  const profile = await getCurrentProfile();
  const pro = isPro(profile?.plan);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8f9ff]">
        <div className="mx-auto max-w-lg px-4 py-12">
          {!pro && (
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Upgrade to Pro</h1>
              <p className="mt-1 text-sm text-slate-500">Pick a plan. Cancel anytime.</p>
            </div>
          )}
          {pro && (
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
              <p className="mt-1 text-sm text-slate-500">Manage your HYRISE Pro plan.</p>
            </div>
          )}
          <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
            <BillingClient isPro={pro} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
