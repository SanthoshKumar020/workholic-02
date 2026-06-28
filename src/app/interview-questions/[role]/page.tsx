import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO_ROLES, getSeoRole } from "@/lib/seo/roles";
import { roleInterviewQuestions } from "@/lib/seo/content";

interface Props {
  params: { role: string };
}

export function generateStaticParams() {
  return SEO_ROLES.map((r) => ({ role: r.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const role = getSeoRole(params.role);
  if (!role) return { title: "Interview Questions — HYRISE" };
  const title = `${role.name} Interview Questions (with Practice) | HYRISE`;
  const description = `Common ${role.name} interview questions — behavioral, technical (${role.skills.slice(0, 3).join(", ")}), and role-specific. Practice with a free AI mock interview.`;
  return {
    title,
    description,
    keywords: [`${role.name} interview questions`, `mock interview ${role.name}`, `${role.name} interview prep`, ...role.skills.slice(0, 3)],
    alternates: { canonical: `/interview-questions/${role.slug}` },
    openGraph: { title, description, url: `/interview-questions/${role.slug}` },
  };
}

export default function InterviewQuestionsRolePage({ params }: Props) {
  const role = getSeoRole(params.role);
  if (!role) notFound();

  const groups = roleInterviewQuestions(role);
  const allQuestions = groups.flatMap((g) => g.questions);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allQuestions.slice(0, 10).map((q) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Practice answering "${q}" with the STAR method and a free AI mock interview on HYRISE.`,
      },
    })),
  };

  const otherRoles = SEO_ROLES.filter((r) => r.slug !== role.slug && r.category === role.category).slice(0, 6);

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <nav className="mb-6 text-sm text-slate-400">
          <Link href="/interview-questions" className="hover:text-brand-600">Interview Questions</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-500">{role.name}</span>
        </nav>

        <header>
          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            {role.category}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {role.name} Interview Questions
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            The questions you&apos;re most likely to face in a {role.name} interview — behavioral, technical, and role-specific. Then practise them out loud with a free AI mock interview.
          </p>
          <Link
            href="/interview"
            className="mt-6 inline-block rounded-xl bg-brand-gradient px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Practise with AI mock interview →
          </Link>
        </header>

        {groups.map((group) => (
          <section key={group.section} className="mt-10">
            <h2 className="text-xl font-bold text-slate-900">{group.section}</h2>
            <ol className="mt-3 space-y-2.5">
              {group.questions.map((q, i) => (
                <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
                  <span className="font-bold text-brand-500">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section className="mt-12 rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h2 className="text-xl font-bold text-brand-800">Don&apos;t just read them — practise out loud</h2>
          <p className="mt-1 text-sm text-brand-700">
            Reading questions isn&apos;t enough. Our AI mock interview asks you {role.name} questions, records your answers, and scores you on structure, pacing, and filler words.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/interview" className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
              Start mock interview
            </Link>
            <Link href="/blog/star-method-interview-answers" className="rounded-xl border border-brand-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
              Learn the STAR method
            </Link>
            <Link href={`/resume-checker/${role.slug}`} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              {role.name} resume checker
            </Link>
          </div>
        </section>

        {otherRoles.length > 0 && (
          <section className="mt-12 border-t border-slate-100 pt-8">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Interview questions for related roles</h2>
            <div className="flex flex-wrap gap-2">
              {otherRoles.map((r) => (
                <Link key={r.slug} href={`/interview-questions/${r.slug}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700">
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
