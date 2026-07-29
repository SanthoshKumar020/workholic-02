import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Affiliate Disclosure — HYRISE",
  description:
    "How HYRISE handles partner links: what we earn, how recommendations are chosen, and what we will never do.",
  alternates: { canonical: "https://hyrise.swache.in/affiliate-disclosure" },
};

/**
 * Affiliate networks require a visible disclosure page before they approve a
 * publisher, so this is a prerequisite for applying to Cuelinks, vCommission,
 * Amazon Associates and the rest.
 *
 * It is written to be genuinely informative rather than legal cover. The
 * commitments below are enforced in src/lib/affiliates.ts — the 2-link cap,
 * relevance-not-commission ordering, and showing nothing when there's no good
 * match are all in code, not just prose. If those change, this page must too.
 */
export default function AffiliateDisclosurePage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Affiliate disclosure</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: July 2026</p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-slate-700">
          <p>
            Some links on HYRISE are partner (affiliate) links. If you click one and buy
            something, we may receive a commission from that company. You pay exactly the same
            price either way — a partner link never costs you more, and never unlocks a worse
            deal than going direct.
          </p>

          <section>
            <h2 className="text-lg font-bold text-slate-900">How we choose what to recommend</h2>
            <p className="mt-2">
              Recommendations appear only where our analysis has found a specific gap. If the Job
              Match Analyzer tells you a posting wants Kubernetes and your resume doesn&apos;t
              mention it, we may show a course that teaches Kubernetes. We do not show
              recommendations on pages where they aren&apos;t relevant, and we don&apos;t run
              display advertising anywhere in the product.
            </p>
            <p className="mt-2">
              Where more than one partner covers a skill, we order them by how well they fit that
              skill — never by which pays us more. We cap it at two suggestions per gap. If
              nothing genuinely fits, you see nothing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">What we will not do</h2>
            <ul className="mt-2 space-y-2">
              {[
                "Change your ATS score, match percentage, or any other result to steer you toward a paid course. Your score is computed before we look at recommendations, and never influenced by them.",
                "Invent a skill gap you don't have in order to sell a course.",
                "Put partner links in the free ATS checker flow.",
                "Sell, rent, or share your resume or personal data with any partner. Clicking a partner link sends you to their site; it does not send them your information.",
                "Accept payment to rank one partner above another.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">What we track</h2>
            <p className="mt-2">
              When you click a partner link we record that a click happened, which partner it went
              to, and which skill prompted it. This tells us whether a recommendation was useful.
              We do not attach your resume text to that record. See our{" "}
              <Link href="/privacy" className="font-semibold text-brand-600 hover:underline">
                Privacy Policy
              </Link>{" "}
              for the full picture.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">Why we do this at all</h2>
            <p className="mt-2">
              HYRISE is free to start and Pro costs a small monthly amount. Partner commissions
              help keep the free tier genuinely useful rather than a trial stub. We would rather
              tell you plainly that we earn from some links than quietly bury it — if a
              recommendation ever feels like an advert rather than help, that&apos;s a bug and
              we&apos;d like to hear about it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">Questions</h2>
            <p className="mt-2">
              Write to{" "}
              <a href="mailto:admin@swache.in" className="font-semibold text-brand-600 hover:underline">
                admin@swache.in
              </a>
              .
            </p>
            <p className="mt-4 text-sm text-slate-500">
              HYRISE is operated by Swache Technologies (OPC) Private Limited, L 303, Rohan Upavan,
              Kyalasanahalli, Kothanur, Bangalore North, Karnataka 560077, India.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
