import "server-only";

/**
 * Affiliate partner registry and skill-gap → resource mapping.
 *
 * ── Rules this file exists to enforce ───────────────────────────────────────
 * 1. MAX 2 recommendations per gap. Three or more reads as an ad unit and
 *    conversion collapses — and more importantly, the tool stops feeling like
 *    a tool.
 * 2. Every partner link is disclosed at the point of the link, not only on a
 *    policy page. Required by the FTC and by ASCI's guidelines in India, and
 *    it's simply what a user is owed.
 * 3. Only recommend for a gap the analysis ACTUALLY found. Never fill space.
 *    If there's no good match for a skill, show nothing — an empty slot costs
 *    us a few rupees; a bad recommendation costs the trust that makes someone
 *    upgrade.
 * 4. Nothing here is a paid placement. Ordering reflects relevance to the
 *    skill, never commission rate. If that ever stops being true, this comment
 *    should be deleted and the disclosure page rewritten to say so.
 *
 * To activate a partner: set its env var to your tracking URL. Partners with
 * no configured URL are skipped entirely, so this ships safely before any
 * affiliate application is approved.
 */

export type Partner = {
  id: string;
  name: string;
  /** Env var holding the tracking/deep link. Unset → partner is inactive. */
  envVar: string;
  /** Shown under the recommendation so the user knows what they're clicking. */
  blurb: string;
};

const PARTNERS: Record<string, Partner> = {
  coursera: {
    id: "coursera",
    name: "Coursera",
    envVar: "AFFILIATE_URL_COURSERA",
    blurb: "University and industry certificates, audit free",
  },
  scaler: {
    id: "scaler",
    name: "Scaler",
    envVar: "AFFILIATE_URL_SCALER",
    blurb: "Structured DSA and system design, India-based",
  },
  udemy: {
    id: "udemy",
    name: "Udemy",
    envVar: "AFFILIATE_URL_UDEMY",
    blurb: "One-off paid courses, frequent discounts",
  },
  educative: {
    id: "educative",
    name: "Educative",
    envVar: "AFFILIATE_URL_EDUCATIVE",
    blurb: "Text-based, interactive, no video",
  },
  cambly: {
    id: "cambly",
    name: "Cambly",
    envVar: "AFFILIATE_URL_CAMBLY",
    blurb: "Live spoken-English practice with native speakers",
  },
  hostinger: {
    id: "hostinger",
    name: "Hostinger",
    envVar: "AFFILIATE_URL_HOSTINGER",
    blurb: "Domain and hosting for a portfolio site",
  },
};

/**
 * Skill keyword → partners, most relevant first.
 * Keys are matched case-insensitively as substrings of the detected gap.
 */
const SKILL_MAP: { match: RegExp; partners: string[]; label: string }[] = [
  { match: /\bkubernetes|k8s|docker|devops|ci\/cd\b/i, partners: ["coursera", "udemy"], label: "DevOps & containers" },
  { match: /\bsystem design|scalab|architecture\b/i, partners: ["educative", "scaler"], label: "System design" },
  { match: /\bdsa|data structure|algorithm|leetcode\b/i, partners: ["scaler", "educative"], label: "DSA" },
  { match: /\baws|azure|gcp|cloud\b/i, partners: ["coursera", "udemy"], label: "Cloud" },
  { match: /\bmachine learning|deep learning|\bml\b|tensorflow|pytorch\b/i, partners: ["coursera", "udemy"], label: "Machine learning" },
  { match: /\bsql|database|postgres|mysql\b/i, partners: ["coursera", "udemy"], label: "SQL & databases" },
  { match: /\bpython\b/i, partners: ["coursera", "udemy"], label: "Python" },
  { match: /\breact|frontend|javascript|typescript\b/i, partners: ["udemy", "coursera"], label: "Frontend" },
  { match: /\bspoken english|communication|fluency|verbal\b/i, partners: ["cambly"], label: "Spoken English" },
  { match: /\bportfolio|personal website|github pages\b/i, partners: ["hostinger"], label: "Portfolio site" },
  { match: /\bdata analy|power bi|tableau|excel\b/i, partners: ["coursera", "udemy"], label: "Data analysis" },
];

export type Recommendation = {
  partnerId: string;
  partnerName: string;
  blurb: string;
  url: string;
  skillLabel: string;
};

function partnerUrl(p: Partner): string | null {
  const url = process.env[p.envVar];
  return url && url.trim() ? url.trim() : null;
}

/** True when at least one partner is configured — used to hide UI entirely. */
export function affiliatesEnabled(): boolean {
  return Object.values(PARTNERS).some((p) => partnerUrl(p) !== null);
}

/**
 * Recommendations for one detected skill gap. Returns [] when nothing
 * genuinely matches, or when no partner is configured yet.
 */
export function recommendFor(skill: string, limit = 2): Recommendation[] {
  if (!skill || !skill.trim()) return [];

  const entry = SKILL_MAP.find((s) => s.match.test(skill));
  if (!entry) return []; // No confident match — show nothing rather than filler.

  const out: Recommendation[] = [];
  for (const id of entry.partners) {
    const partner = PARTNERS[id];
    if (!partner) continue;
    const url = partnerUrl(partner);
    if (!url) continue; // Not yet approved / configured.
    out.push({
      partnerId: partner.id,
      partnerName: partner.name,
      blurb: partner.blurb,
      url,
      skillLabel: entry.label,
    });
    if (out.length >= Math.min(limit, 2)) break; // Hard cap of 2. See rule 1.
  }
  return out;
}

/** Recommendations across several gaps, deduplicated, capped overall. */
export function recommendForGaps(skills: string[], maxTotal = 3): Recommendation[] {
  const seen = new Set<string>();
  const out: Recommendation[] = [];
  for (const skill of skills) {
    for (const rec of recommendFor(skill)) {
      const key = `${rec.partnerId}:${rec.skillLabel}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(rec);
      if (out.length >= maxTotal) return out;
    }
  }
  return out;
}

/** The exact wording shown beside every partner link. Keep it plain. */
export const DISCLOSURE_SHORT =
  "Partner link — we may earn a commission. It costs you nothing extra, and we only suggest this for gaps the analysis actually found.";
