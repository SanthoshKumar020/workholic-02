import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO_ROLES, getSeoRole } from "@/lib/seo/roles";
import { roleAtsKeywords, roleResumeTips } from "@/lib/seo/content";
import { SITE_URL } from "@/lib/share";
import { CheckCircle } from "lucide-react";

interface Props {
  params: { role: string };
}

export function generateStaticParams() {
  return SEO_ROLES.map((r) => ({ role: r.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const role = getSeoRole(params.role);
  if (!role) return { title: "Resume Checker — HYRISE" };
  const title = `ATS Resume Checker for ${role.name}s — Free Score | HYRISE`;
  const description = `Free ATS resume checker for ${role.name}s. Score your resume against ${role.name} keywords like ${role.skills.slice(0, 3).join(", ")}, see what's missing, and fix it with AI.`;
  return {
    title,
    description,
    keywords: [`${role.name} resume`, `ATS resume checker ${role.name}`, `resume for ${role.name}`, ...role.skills.slice(0, 4)],
    alternates: { canonical: `/resume-checker/${role.slug}` },
    openGraph: { title, description, url: `/resume-checker/${role.slug}` },
  };
}

export default function ResumeCheckerRolePage({ params }: Props) {
  const role = getSeoRole(params.role);
  if (!role) notFound();

  const keywords = roleAtsKeywords(role);
  const tips = roleResumeTips(role);

  const faq = [
    {
      q: `What keywords should a ${role.name} resume include?`,
      a: `Recruiters and ATS software scan ${role.name} resumes for terms like ${keywords.slice(0, 6).join(", ")}. Include the ones you genuinely have in your skills section and work bullets.`,
    },
    {
      q: `How do I make my ${role.name} resume ATS-friendly?`,
      a: `Use a single-column layout, standard section headings, no tables or images, and mirror the keywords from the job description. Then check your score before applying.`,
    },
    {
      q: `Is the ${role.name} resume checker free?`,
      a: `Yes. You can check your ATS score for free and get specific, prioritised fixes in under a minute.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const otherRoles = SEO_ROLES.filter((r) => r.slug !== role.slug && r.category === role.category).slice(0, 6);

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <nav className="mb-6 text-sm text-slate-400">
          <Link href="/resume-checker" className="hover:text-brand-600">Resume Checker</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-500">{role.name}</span>
        </nav>

        <header>
          <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            {role.category}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            ATS Resume Checker for {role.name}s
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            {role.blurb} Before a recruiter sees your application, an ATS scores it against the job. Check your {role.name} resume free and see exactly what to fix.
          </p>
          <Link
            href="/#ats"
            className="mt-6 inline-block rounded-xl bg-brand-gradient px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Check my ATS score free →
          </Link>
        </header>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">Keywords ATS scans for in a {role.name} resume</h2>
          <p className="mt-2 text-slate-600">
            Applicant tracking systems rank {role.name} resumes largely on keyword match. Include these where they're true:
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span key={kw} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                {kw}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">How to optimise your {role.name} resume</h2>
          <ul className="mt-4 space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h2 className="text-xl font-bold text-brand-800">Build an ATS-ready {role.name} resume in minutes</h2>
          <p className="mt-1 text-sm text-brand-700">
            Our AI resume builder produces a clean, single-column, keyword-matched resume — and scores it as you go.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/builder" className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
              Build my resume
            </Link>
            <Link href="/#ats" className="rounded-xl border border-brand-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
              Check ATS score
            </Link>
            <Link href={`/interview-questions/${role.slug}`} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              {role.name} interview questions
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">FAQ</h2>
          <div className="mt-4 space-y-5">
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-slate-900">{f.q}</h3>
                <p className="mt-1 text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {otherRoles.length > 0 && (
          <section className="mt-12 border-t border-slate-100 pt-8">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Resume checkers for related roles</h2>
            <div className="flex flex-wrap gap-2">
              {otherRoles.map((r) => (
                <Link key={r.slug} href={`/resume-checker/${r.slug}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700">
                  {r.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
