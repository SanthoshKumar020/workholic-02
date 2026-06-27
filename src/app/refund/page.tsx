import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Refund Policy — HYRISE",
  description: "HYRISE refund and cancellation policy.",
};

const LAST_UPDATED = "27 June 2026";

export default function RefundPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Legal
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Refund Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-900">Our commitment</h2>
            <p className="mt-2">
              We want you to be happy with HYRISE. If something went wrong with your subscription
              or payment, contact us at{" "}
              <a href="mailto:support@swache.in" className="text-brand-600 hover:underline">
                support@swache.in
              </a>{" "}
              and we will make it right.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">Eligibility for a refund</h2>
            <p className="mt-2">You may request a refund if:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>You were charged by mistake or twice for the same period.</li>
              <li>You did not use any Pro features after upgrading and request a refund within <strong>7 days</strong> of the charge.</li>
              <li>A technical issue on our platform prevented you from using features you paid for, and we were unable to resolve it within a reasonable time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">Non-refundable situations</h2>
            <p className="mt-2">We do not issue refunds if:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>You used Pro features after upgrading and then changed your mind.</li>
              <li>You forgot to cancel before a renewal date (though we can cancel your subscription going forward).</li>
              <li>You did not achieve the job outcome you hoped for — we provide tools, not guarantees.</li>
              <li>More than 7 days have passed since the charge.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">How to cancel</h2>
            <p className="mt-2">
              You can cancel your Pro subscription at any time from your{" "}
              <strong>Dashboard → Billing</strong> page. Cancellation stops future charges; it does
              not remove your Pro access for the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">How to request a refund</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5">
              <li>
                Email{" "}
                <a href="mailto:support@swache.in" className="text-brand-600 hover:underline">
                  support@swache.in
                </a>{" "}
                with the subject line <strong>&ldquo;Refund Request&rdquo;</strong>.
              </li>
              <li>Include your registered email address and the date of the charge.</li>
              <li>Briefly describe the reason for the request.</li>
            </ol>
            <p className="mt-3">
              We process refund requests within <strong>5–7 business days</strong>. Refunds are
              returned to the original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">Free plan</h2>
            <p className="mt-2">
              The free plan has no charges. There is nothing to refund. Free usage limits are
              permanent and cannot be restored by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">Contact</h2>
            <p className="mt-2">
              Santo Square Automation, India.{" "}
              <a href="mailto:support@swache.in" className="text-brand-600 hover:underline">
                support@swache.in
              </a>
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
