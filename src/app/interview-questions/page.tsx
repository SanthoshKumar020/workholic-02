import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO_ROLES, roleCategories } from "@/lib/seo/roles";
import { COMPANIES } from "@/lib/company-data";

export const metadata: Metadata = {
  title: "Mock Interview Questions by Role | HYRISE",
  description: `Common interview questions for ${SEO_ROLES.length} roles — behavioral, technical, and role-specific. Practice with a free AI mock interview that scores your answers.`,
  alternates: { canonical: "/interview-questions" },
};

export default function InterviewQuestionsHub() {
  const categories = roleCategories();

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <header className="text-center">
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Interview Questions
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Mock interview questions by role
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Pick your role for the questions you&apos;re most likely to face — then practise them out loud with a free AI mock interview.
          </p>
          <Link href="/interview" className="mt-6 inline-block rounded-xl bg-brand-gradient px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:opacity-90">
            Start a mock interview →
          </Link>
        </header>

        {categories.map((cat) => (
          <section key={cat} className="mt-10">
            <h2 className="mb-3 text-lg font-bold text-slate-900">{cat}</h2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {SEO_ROLES.filter((r) => r.category === cat).map((r) => (
                <Link
                  key={r.slug}
                  href={`/interview-questions/${r.slug}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm"
                >
                  {r.name} interview questions
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-12 border-t border-slate-100 pt-8">
          <h2 className="mb-1 text-lg font-bold text-slate-900">Company-specific interview questions</h2>
          <p className="mb-4 text-sm text-slate-500">
            Interviewing somewhere specific? See the full process — every round, its duration, and what it assesses.
          </p>
          <div className="flex flex-wrap gap-2">
            {COMPANIES.map((c) => (
              <Link
                key={c.id}
                href={`/companies/${c.id}`}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                {c.name} interview questions
              </Link>
            ))}
            <Link
              href="/companies"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              All companies
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
