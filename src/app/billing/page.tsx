import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BillingClient } from "@/components/BillingClient";
import { PageShell } from "@/components/ui/PageShell";
import { getCurrentProfile, isPro } from "@/lib/plan";
import { STUDENT_PLAN } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Unique to this page (§4.3). Every page used to inherit the homepage
// description, which ended "₹30/mo Pro" — wrong on two counts now.
export const metadata = {
  title: `HYRISE Student — ${STUDENT_PLAN.priceLabel} for ${STUDENT_PLAN.durationDays} days`,
  description: `Unlock all 21 HYRISE tools for ${STUDENT_PLAN.durationDays} days with one ${STUDENT_PLAN.priceLabel} payment. ${STUDENT_PLAN.aiActionsPerMonth} AI actions and ${STUDENT_PLAN.mockInterviewsPerMonth} mock interviews a month. No subscription, no auto-renewal.`,
  robots: { index: true, follow: true },
};

export default async function BillingPage() {
  const profile = await getCurrentProfile();
  const pro = isPro(profile?.plan);

  return (
    <>
      <Navbar />
      <PageShell width="form">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">{pro ? "Your plan" : "Get HYRISE Student"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pro
              ? "What you have, and how long it runs."
              : "One payment. No subscription to set up or cancel."}
          </p>
        </div>
        <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
          <BillingClient isPro={pro} planExpiresAt={profile?.plan_expires_at ?? null} />
        </Suspense>
      </PageShell>
      <Footer />
    </>
  );
}
