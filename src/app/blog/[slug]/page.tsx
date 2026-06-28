import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Markdown } from "@/components/Markdown";
import { getBlogPost, sortedPosts, BLOG_POSTS } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/share";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return { title: "Article not found — HYRISE" };
  const url = `/blog/${post.slug}`;
  return {
    title: `${post.title} | HYRISE`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      publishedTime: post.date,
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const related = sortedPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  // Article structured data for rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "HYRISE" },
    publisher: { "@type": "Organization", name: "HYRISE" },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    keywords: post.keywords.join(", "),
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <nav className="mb-6 text-sm text-slate-400">
          <Link href="/blog" className="hover:text-brand-600">← All articles</Link>
        </nav>

        <article>
          <header className="mb-8 border-b border-slate-100 pb-8">
            <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {post.category}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-3 text-lg text-slate-500">{post.description}</p>
            <p className="mt-4 text-xs font-medium text-slate-400">
              {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {post.readingMinutes} min read
            </p>
          </header>

          <Markdown content={post.body} />
        </article>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
          <p className="text-base font-bold text-brand-800">Check your resume against the ATS — free</p>
          <p className="mt-1 text-sm text-brand-600">Get an instant ATS score and the exact fixes to reach a recruiter.</p>
          <Link
            href="/#ats"
            className="mt-4 inline-block rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Check my ATS score →
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Keep reading</h2>
            <div className="space-y-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm"
                >
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500 line-clamp-1">{r.description}</p>
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
