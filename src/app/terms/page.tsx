import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Terms of Service — HYRISE",
  description: "The terms governing your use of the HYRISE career platform.",
};

const LAST_UPDATED = "27 June 2026";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Legal
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of terms</h2>
            <p className="mt-2">
              By creating an account or using HYRISE (operated by <strong>Santo Square Automation</strong>,
              accessible at <strong>hyrise.swache.in</strong>), you agree to these Terms of Service.
              If you do not agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">2. Description of service</h2>
            <p className="mt-2">
              HYRISE is an AI-powered career platform for job seekers. It provides tools including
              resume enhancement, ATS scoring, mock interviews, job matching, learning roadmaps,
              cover letter generation, and related career features. The platform uses the Groq API
              for AI processing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">3. Accounts</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>You must be at least 13 years old to create an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate information when registering.</li>
              <li>One account per person. Creating multiple accounts to circumvent free plan limits is prohibited.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">4. Free plan &amp; paid plans</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>The free plan includes a limited number of AI feature uses as described on the pricing page. These limits are permanent and are not restored by deleting and recreating content.</li>
              <li>Pro plan subscribers get unlimited access to all AI features for the subscription period.</li>
              <li>Prices are displayed in Indian Rupees (₹). We reserve the right to change prices with 30 days&apos; notice.</li>
              <li>Refunds are handled on a case-by-case basis — contact us within 7 days of a charge if you believe you were billed in error.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">5. Your content</h2>
            <p className="mt-2">
              You retain ownership of any resume content, documents, or text you upload or paste into
              HYRISE. By submitting content, you grant us a limited licence to process it through our AI
              pipeline solely to deliver the service to you. We do not claim ownership of your content
              and do not use it to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">6. Acceptable use</h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Use the platform for any unlawful purpose.</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the API.</li>
              <li>Upload content that infringes third-party intellectual property rights.</li>
              <li>Share account credentials or resell access to the platform.</li>
              <li>Use automated scripts to generate bulk AI requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">7. AI-generated content disclaimer</h2>
            <p className="mt-2">
              AI outputs (enhanced resumes, interview questions, roadmaps, etc.) are generated
              automatically and may not always be accurate, complete, or appropriate for your situation.
              Always review AI-generated content before using it professionally.{" "}
              <strong>
                HYRISE does not guarantee interview calls, job offers, or employment outcomes.
              </strong>{" "}
              Results vary based on many factors beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">8. Intellectual property</h2>
            <p className="mt-2">
              The HYRISE name, logo, platform design, and proprietary code are owned by Santo Square
              Automation. You may not copy, reproduce, or distribute them without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">9. Termination</h2>
            <p className="mt-2">
              We reserve the right to suspend or terminate accounts that violate these terms, with or
              without notice. You may delete your account at any time from settings or by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">10. Limitation of liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, Santo Square Automation is not liable for any
              indirect, incidental, or consequential damages arising from your use of HYRISE. Our total
              liability to you in any month shall not exceed the amount you paid us in that month.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">11. Governing law</h2>
            <p className="mt-2">
              These terms are governed by the laws of India. Any disputes shall be resolved in the
              courts of jurisdiction applicable to Santo Square Automation&apos;s registered address.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">12. Contact</h2>
            <p className="mt-2">
              Questions about these terms? Email us at{" "}
              <a href="mailto:support@swache.in" className="text-brand-600 hover:underline">
                support@swache.in
              </a>.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
