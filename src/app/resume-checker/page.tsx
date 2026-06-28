import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO_ROLES, roleCategories } from "@/lib/seo/roles";

export const metadata: Metadata = {
  title: "Free ATS Resume Checker by Role | HYRISE",
  description:
    "Free ATS resume checker tailored to your role. Score your resume, see the keywords recruiters scan for, and fix it with AI — for 30+ roles.",
  alternates: { canonical: "/resume-checker" },
};

export default function ResumeCheckerHub() {
  const categories = roleCategories();

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <header className="text-center">
          <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            ATS Resume Checker
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Free ATS resume checker for your role
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Pick your role to see the exact keywords recruiters and ATS software scan for — then check your resume score free.
          </p>
          <Link href="/#ats" className="mt-6 inline-block rounded-xl bg-brand-gradient px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:opacity-90">
            Check my ATS score now →
          </Link>
        </header>

        {categories.map((cat) => (
          <section key={cat} className="mt-10">
            <h2 className="mb-3 text-lg font-bold text-slate-900">{cat}</h2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {SEO_ROLES.filter((r) => r.category === cat).map((r) => (
                <Link
                  key={r.slug}
                  href={`/resume-checker/${r.slug}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm"
                >
                  Resume checker for {r.name}s
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
