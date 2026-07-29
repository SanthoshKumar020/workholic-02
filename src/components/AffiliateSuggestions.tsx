"use client";

import { track } from "@/lib/analytics";

/**
 * Partner recommendations for detected skill gaps.
 *
 * Renders NOTHING when there are no recommendations — which is the normal case
 * until affiliate partners are configured, and also whenever the analysis found
 * no gap we have a genuine match for. An empty slot is correct; filler is not.
 *
 * The disclosure sits next to the links, not only on the policy page. A user
 * should never discover after clicking that we earn from it.
 */

export type Suggestion = {
  partnerId: string;
  partnerName: string;
  blurb: string;
  url: string;
  skillLabel: string;
};

export function AffiliateSuggestions({
  suggestions,
  surface,
  disclosure,
}: {
  suggestions: Suggestion[];
  /** Where this rendered — 'match_result' | 'blog' | 'roadmap' | 'domains'. */
  surface: string;
  disclosure: string;
}) {
  if (!suggestions || suggestions.length === 0) return null;

  // Belt and braces: the library caps at 2 per gap and 3 overall, but the cap
  // is the whole design, so enforce it at render too.
  const shown = suggestions.slice(0, 3);

  function logClick(s: Suggestion) {
    track("affiliate_clicked", { partner: s.partnerId, skill: s.skillLabel, surface });
    // Fire-and-forget — must not delay the navigation.
    void fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: s.partnerId, skillLabel: s.skillLabel, surface }),
      keepalive: true,
    }).catch(() => null);
  }

  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Ways to close these gaps
      </p>

      <ul className="mt-3 space-y-2.5">
        {shown.map((s) => (
          <li key={`${s.partnerId}-${s.skillLabel}`}>
            <a
              href={s.url}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              onClick={() => logClick(s)}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 transition hover:border-brand-300 hover:bg-brand-50/40"
            >
              <span className="mt-0.5 text-brand-500">↗</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800">
                  {s.skillLabel} · {s.partnerName}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{s.blurb}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* Disclosure at the point of the link. rel="sponsored" above also tells
          Google these are paid links, which is what keeps the programmatic SEO
          pages clear of the thin-affiliate penalty. */}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{disclosure}</p>
    </aside>
  );
}
