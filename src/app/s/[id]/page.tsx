import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AtsScoreRing } from "@/components/AtsScoreRing";
import { PageShell } from "@/components/ui/PageShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/share";

export const runtime = "nodejs";
// Cache the rendered page for an hour — share pages are read-heavy and never
// change after creation. Keeps Supabase reads low if something goes viral.
export const revalidate = 3600;

type SharedScan = {
  id: string;
  score: number;
  visible_tips: string[];
  locked_count: number;
  display_name: string | null;
  created_at: string;
};

async function getScan(id: string): Promise<SharedScan | null> {
  // Ids are random and short; reject anything that isn't the shape we issue
  // before it ever reaches the database.
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(id)) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("shared_scans")
    .select("id, score, visible_tips, locked_count, display_name, created_at")
    .eq("id", id)
    .maybeSingle();

  return (data as SharedScan) ?? null;
}

function cardImageUrl(scan: SharedScan): string {
  const params = new URLSearchParams({
    score: String(scan.score),
    issues: String(scan.visible_tips.length + scan.locked_count),
  });
  if (scan.display_name) params.set("name", scan.display_name);
  return `${SITE_URL}/api/og/score?${params.toString()}`;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const scan = await getScan(params.id);
  if (!scan) return { title: "Share link not found" };

  const who = scan.display_name ? `${scan.display_name}'s resume` : "This resume";
  const title = `${who} scored ${scan.score}/100 on the ATS check`;
  const description =
    "See the score, the issues an ATS would flag, and check your own resume free in 20 seconds — no signup needed.";
  const image = cardImageUrl(scan);
  const url = `${SITE_URL}/s/${scan.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    // Individual share pages are thin and near-duplicate — good for social
    // previews, bad for the site's overall SEO profile if Google indexes
    // thousands of them. Let crawlers follow the links without indexing.
    robots: { index: false, follow: true },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharedScanPage({ params }: { params: { id: string } }) {
  const scan = await getScan(params.id);
  if (!scan) notFound();

  const total = scan.visible_tips.length + scan.locked_count;
  const who = scan.display_name ? `${scan.display_name}'s resume` : "This resume";

  // Rough popularity signal, not a precise counter: the page is cached for an
  // hour, so this increments once per regeneration rather than once per view.
  // That's a deliberate trade — a viral share page shouldn't hammer Supabase.
  try {
    await createAdminClient().rpc("increment_share_view", { share_id: scan.id });
  } catch {
    /* counting views is never worth a 500 */
  }

  return (
    <>
      <Navbar />

      <PageShell width="narrow">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-brand-100/40">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <AtsScoreRing score={scan.score} />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                ATS Resume Score
              </p>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
                {who} scored {scan.score}/100
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {scan.score < 60
                  ? "Most applicant tracking systems would filter this out before a human sees it."
                  : scan.score < 80
                  ? "A solid base — a few targeted fixes would push it into the top tier."
                  : "Strong score. This resume reads cleanly to an ATS."}
              </p>
            </div>
          </div>

          {scan.visible_tips.length > 0 && (
            <div className="mt-7 rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-red-600">
                {total > 0 ? `${total} issue${total !== 1 ? "s" : ""} found` : "Issues"}
              </p>
              <ul className="space-y-2">
                {scan.visible_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    {tip}
                  </li>
                ))}
              </ul>

              {scan.locked_count > 0 && (
                <div className="relative mt-3 overflow-hidden rounded-lg border border-red-200 bg-white/70 p-3">
                  <ul className="space-y-2 select-none blur-[5px]" aria-hidden="true">
                    {Array.from({ length: scan.locked_count }).map((_, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                        <span className="h-3 flex-1 rounded bg-slate-300" />
                      </li>
                    ))}
                  </ul>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                    <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white">
                      🔒 {scan.locked_count} more fix{scan.locked_count !== 1 ? "es" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* The reason this page exists: convert the visitor into a scanner. */}
          <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-6 text-center">
            <h2 className="text-lg font-bold text-slate-900">
              What would your resume score?
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
              Upload a PDF or DOCX and get your ATS score in about 20 seconds. No signup, no card.
            </p>
            <Link
              href="/#ats"
              className="mt-5 inline-block rounded-xl bg-brand-gradient px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Check my resume — free →
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Shared from HYRISE · Scores are an estimate of ATS readability, not a hiring prediction.
        </p>
      </PageShell>

      <Footer />
    </>
  );
}
