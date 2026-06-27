import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "About — HYRISE",
  description: "Learn about HYRISE — the AI career platform built to help job seekers in India land their next job faster.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            About
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Built for job seekers who are serious about landing their next role
          </h1>
          <p className="mt-3 text-slate-600 leading-relaxed">
            HYRISE is an AI-powered career platform that puts enterprise-level resume tools in the
            hands of every job seeker — for free to start, and at a price that makes sense.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-900">Why we built HYRISE</h2>
            <p className="mt-3">
              Most job seekers spend hours tweaking their resume, writing cover letters, and
              preparing for interviews — with little guidance on whether any of it is working.
              Applicant tracking systems (ATS) filter out 75% of resumes before a human ever
              reads them, and most people don&apos;t even know their resume is being filtered.
            </p>
            <p className="mt-3">
              HYRISE fixes that. We use the Groq AI API (llama-3.3-70b) to score your resume
              against ATS systems, rewrite it with stronger language, match it to specific job
              descriptions, and coach you through mock interviews — all in one place.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">The team</h2>
            <p className="mt-3">
              HYRISE is built by <strong>Santo Square Automation</strong>, a software product
              company based in India. We build tools that make complex workflows simple and
              accessible — HYRISE is our flagship product for job seekers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">Our principles</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Transparent pricing.</strong> Free plan always free. Pro is ₹30/month — no hidden fees, no annual lock-in.</li>
              <li><strong>Privacy by default.</strong> We never sell your data. AI processing is server-side. We do not use your resume to train models.</li>
              <li><strong>Honest AI.</strong> We never claim AI outputs are perfect. Always review before sending. We are a tool, not a guarantee.</li>
              <li><strong>Built for India.</strong> Prices in ₹. Features tuned for the Indian job market, including Naukri and LinkedIn optimization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">Contact us</h2>
            <p className="mt-3">
              Questions, feedback, or partnership enquiries? We&apos;d love to hear from you.
            </p>
            <p className="mt-2">
              Email:{" "}
              <a href="mailto:support@swache.in" className="font-semibold text-brand-600 hover:underline">
                support@swache.in
              </a>
            </p>
            <p className="mt-1">Or use the{" "}
              <Link href="/contact" className="font-semibold text-brand-600 hover:underline">
                contact form
              </Link>.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
