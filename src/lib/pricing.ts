/**
 * The single source of truth for what things cost and what they include.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 * "₹30/mo" was hardcoded in eleven places — the homepage, the pricing section,
 * the billing page, the OG image, the layout meta description, the about page,
 * the terms, two email templates. Repricing meant finding all eleven, and the
 * ones you miss are the ones a customer reads. Prices change; this changes once.
 *
 * ── The repricing (§2.1) ────────────────────────────────────────────────────
 * From ₹30/month recurring to ₹299 one-time for 90 days. Three separate
 * reasons, none of them "charge more":
 *
 *   1. Indian autopay mandates on small amounts fail constantly and setting one
 *      up is the single biggest drop-off in the funnel. A one-time UPI payment
 *      removes the mandate step entirely.
 *   2. ₹30/month is priced like a subscription people forget. ₹299 for a
 *      placement season is priced like a thing you buy once, for a reason,
 *      which is how this audience actually experiences job hunting.
 *   3. It caps tail risk. See ALLOWANCES below.
 *
 * ── Why explicit allowances instead of "unlimited" ──────────────────────────
 * "Unlimited" was both a lie and a liability. A 20-turn mock interview costs
 * roughly ₹3.60 of inference against ~₹24/month of net revenue; unlimited means
 * seven sessions makes a customer unprofitable, and the heaviest users are
 * exactly the ones who run twenty. Stating "50 AI actions and 10 mock
 * interviews a month" reads as generous — because it is, for everyone who is
 * not costing us money — and puts a floor under the margin.
 */

export const STUDENT_PLAN = {
  price: 299,
  priceLabel: "₹299",
  durationDays: 90,
  /** Shown wherever the plan is named. Keep the "one-time" — it is the pitch. */
  periodLabel: "one-time, 90 days",
  aiActionsPerMonth: 50,
  mockInterviewsPerMonth: 10,
} as const;

/**
 * The outcome-anchored line that replaced "less than a cup of chai".
 *
 * The chai line told a buyer the product was trivial — you do not compare
 * something that matters to a beverage. It also anchored against ₹20, which
 * makes ₹299 feel like ten times too much rather than a tenth of what one
 * interview is worth.
 */
export const PRICE_ANCHOR = "One interview going well is worth a hundred times this.";

/**
 * The four tools that ARE the consumer product (§5.1).
 *
 * The other seventeen stay built and available — they are the pitch to a
 * college, where breadth is the point — but leading a job seeker with
 * twenty-one options is the same as leading them with none. The order here is
 * the order of the actual journey: score it, fix it, aim it, rehearse it.
 */
export const CORE_TOOLS = [
  {
    key: "ats-check",
    name: "ATS score check",
    href: "/#ats",
    desc: "Upload your resume, get a score out of 100 and the six things holding it back.",
  },
  {
    key: "enhance",
    name: "AI rewrite",
    href: "/builder",
    desc: "Rewrite weak bullet points into measurable achievements a recruiter reads.",
  },
  {
    key: "match",
    name: "Job match",
    href: "/match",
    desc: "Paste a job description and see exactly which keywords your resume is missing.",
  },
  {
    key: "interview",
    name: "Mock interview",
    href: "/interview",
    desc: "Practise out loud and get a report card on your answers, not just a transcript.",
  },
] as const;

export type CoreToolKey = (typeof CORE_TOOLS)[number]["key"];

/**
 * Free-plan allowance: ONE use of each of the four core tools (§2.1).
 *
 * Down from three uses across all twenty-one tools — sixty-three free AI calls
 * per account, which nobody ever exhausted. An allowance you never hit is an
 * allowance that never converts, and it was also the largest single line in
 * the inference bill. One use is enough to see whether the tool is any good,
 * which is the only job the free tier has.
 */
export const FREE_USES_PER_CORE_TOOL = 1;

export const INSTITUTION_TIERS = [
  { size: "Up to 300 students", price: 60_000, priceLabel: "₹60,000" },
  { size: "Up to 750 students", price: 125_000, priceLabel: "₹1,25,000", featured: true },
  { size: "Up to 1,500 students", price: 200_000, priceLabel: "₹2,00,000" },
  { size: "Over 1,500", price: null, priceLabel: "Let's talk" },
] as const;

/** Copy used in meta descriptions and the OG image. One place, one wording. */
export const PRICE_BLURB = `Free to start. ${STUDENT_PLAN.priceLabel} for ${STUDENT_PLAN.durationDays} days, paid once.`;
