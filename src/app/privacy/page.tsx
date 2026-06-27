import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy — HYRISE",
  description: "How HYRISE collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "27 June 2026";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Legal
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-900">1. Who we are</h2>
            <p className="mt-2">
              HYRISE is an AI-powered career platform operated by <strong>Santo Square Automation</strong>,
              India. Our website is <strong>hyrise.swache.in</strong>. If you have questions about this
              policy, contact us at{" "}
              <a href="mailto:support@swache.in" className="text-brand-600 hover:underline">
                support@swache.in
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">2. What data we collect</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Account data:</strong> email address and password (stored securely via Supabase Auth).</li>
              <li><strong>Profile data:</strong> your name, target role, preferred language, and career preferences you choose to provide.</li>
              <li><strong>Resume content:</strong> text you paste or files (PDF, DOCX, TXT) you upload for enhancement or ATS scoring.</li>
              <li><strong>Usage data:</strong> which features you use and how often (stored in our database to enforce free plan limits and show your progress).</li>
              <li><strong>Payment data:</strong> billing is handled by our payment processor. We do not store your card number or banking details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">3. How we use your data</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>To provide and improve the HYRISE platform and its AI features.</li>
              <li>To process your resume and career documents through our AI pipeline (Groq API, server-side only — see §4).</li>
              <li>To send transactional emails (job alerts you opt into, account notifications).</li>
              <li>To enforce plan limits and manage your subscription.</li>
              <li>We do <strong>not</strong> sell your data to third parties.</li>
              <li>We do <strong>not</strong> use your resume content to train AI models.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">4. AI processing &amp; third-party services</h2>
            <p className="mt-2">
              Resume enhancement, ATS scoring, mock interview questions, and all other AI features are
              processed <strong>server-side</strong> using the{" "}
              <strong>Groq API (llama-3.3-70b)</strong>. Your resume text is sent to Groq&apos;s servers
              solely to generate AI responses. Groq&apos;s data handling is governed by their own
              privacy policy. We do not share your data with any other third-party AI or automation services.
            </p>
            <p className="mt-3">Other third-party services we use:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Supabase</strong> — authentication and database storage (servers in the EU/US).</li>
              <li><strong>Payment processor</strong> — for Pro plan billing. Cardholder data is handled by the processor directly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">5. Data retention</h2>
            <p className="mt-2">
              Your account data and saved resumes are retained as long as your account is active.
              You can delete your account and all associated data at any time from your account settings,
              or by emailing us at{" "}
              <a href="mailto:support@swache.in" className="text-brand-600 hover:underline">
                support@swache.in
              </a>. We will process deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">6. Cookies</h2>
            <p className="mt-2">
              We use session cookies strictly necessary for authentication. We do not use
              advertising cookies or third-party tracking pixels.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">7. Your rights</h2>
            <p className="mt-2">
              You have the right to access, correct, or delete your personal data. To exercise
              these rights, email us at{" "}
              <a href="mailto:support@swache.in" className="text-brand-600 hover:underline">
                support@swache.in
              </a>. We aim to respond within 14 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">8. Security</h2>
            <p className="mt-2">
              We use industry-standard security measures including encrypted connections (HTTPS),
              hashed passwords, and row-level security on our database. No system is 100% secure —
              if you discover a vulnerability, please disclose it responsibly to{" "}
              <a href="mailto:support@swache.in" className="text-brand-600 hover:underline">
                support@swache.in
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">9. Changes to this policy</h2>
            <p className="mt-2">
              We may update this policy from time to time. We will notify you of material changes
              via email or a notice on the platform. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">10. Contact</h2>
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
