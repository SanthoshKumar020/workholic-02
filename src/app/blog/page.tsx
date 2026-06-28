import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { sortedPosts } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Career Blog — Resume, ATS & Interview Guides | HYRISE",
  description:
    "Practical, no-fluff guides on beating the ATS, formatting your resume, writing cover letters, and acing interviews.",
  alternates: { canonical: "/blog" },
};

const CATEGORY_COLORS: Record<string, string> = {
  "ATS & Resumes": "bg-brand-50 text-brand-700",
  "Resume Formats": "bg-emerald-50 text-emerald-700",
  "Cover Letters": "bg-violet-50 text-violet-700",
  "Interview Prep": "bg-amber-50 text-amber-700",
};

export default function BlogIndexPage() {
  const posts = sortedPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <header className="mb-10 text-center">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            HYRISE Blog
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Career guides that actually get you hired
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            No-fluff guides on beating the ATS, formatting your resume, writing cover letters, and acing interviews.
          </p>
        </header>

        {/* Featured post */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-8 block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="h-1.5 w-full bg-brand-gradient" />
            <div className="p-7">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[featured.category] ?? "bg-slate-100 text-slate-600"}`}>
                {featured.category}
              </span>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 transition group-hover:text-brand-700">
                {featured.title}
              </h2>
              <p className="mt-2 text-slate-600">{featured.description}</p>
              <p className="mt-4 text-xs font-medium text-slate-400">
                {new Date(featured.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {featured.readingMinutes} min read
              </p>
            </div>
          </Link>
        )}

        {/* Grid of the rest */}
        <div className="grid gap-5 sm:grid-cols-2">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-600"}`}>
                {post.category}
              </span>
              <h3 className="mt-3 font-bold text-slate-900 transition group-hover:text-brand-700">
                {post.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm text-slate-500 line-clamp-3">{post.description}</p>
              <p className="mt-4 text-xs font-medium text-slate-400">
                {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {post.readingMinutes} min read
              </p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
