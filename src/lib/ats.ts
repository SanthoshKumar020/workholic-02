import "server-only";
import { callAi, type AiContext } from "@/lib/ai";

/**
 * The ATS check — the single most valuable thing on the site.
 *
 * It is the only tool a stranger can use without an account, it is the hero of
 * the homepage, and the result screen is where the most motivated visitor we
 * ever get decides whether to stay. Everything here exists to serve that
 * moment, so the logic lives in one place shared by:
 *
 *   • /api/ats-check          — the live check
 *   • /api/cron/capacity-drain — the retry when both providers were down
 *   • /api/ats-report          — emailing the full report after email capture
 *
 * ── Why six named categories instead of a list of tips ──────────────────────
 * The old response was `improvements: string[]` — five unlabelled sentences.
 * That reads as advice, and advice is easy to skim and forget. Six *named*
 * categories with a pass/warn/fail state reads as a diagnosis: the visitor can
 * see at a glance which parts of their resume are fine and which are not, and
 * a partial view ("2 of 6 shown") is legible as something incomplete rather
 * than something arbitrary. That legibility is what makes the email gate feel
 * like unlocking a report rather than paying a toll.
 */

export const ATS_CATEGORIES = [
  { key: "keywords", label: "Keyword coverage", cta: { label: "Fix it with AI rewrite", href: "/builder" } },
  { key: "formatting", label: "Formatting & parsing", cta: { label: "Rebuild it on an ATS-safe template", href: "/builder" } },
  { key: "impact", label: "Measurable impact", cta: { label: "Add numbers with AI rewrite", href: "/builder" } },
  { key: "verbs", label: "Action verbs & phrasing", cta: { label: "Sharpen the wording", href: "/builder" } },
  { key: "contact", label: "Contact details & sections", cta: { label: "Fix the structure", href: "/builder" } },
  { key: "targeting", label: "Job-description targeting", cta: { label: "Match it to a job description", href: "/match" } },
] as const;

export type AtsCategoryKey = (typeof ATS_CATEGORIES)[number]["key"];

/** How many categories an un-emailed visitor sees in full (§5.2). */
export const FREE_VISIBLE_CATEGORIES = 2;

export type AtsFinding = {
  key: AtsCategoryKey;
  label: string;
  status: "pass" | "warn" | "fail";
  /** One sentence naming what is actually wrong in *this* resume. */
  summary: string;
  /** Concrete edits. Empty for a passing category. */
  fixes: string[];
};

export type AtsReport = {
  score: number;
  findings: AtsFinding[];
};

const SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) analyst reviewing a resume for an Indian job seeker, usually a fresher or someone with under five years of experience.

Return JSON exactly in this shape:
{
  "score": <integer 0-100>,
  "findings": [
    { "key": "keywords",   "status": "pass"|"warn"|"fail", "summary": "...", "fixes": ["...", "..."] },
    { "key": "formatting", "status": "pass"|"warn"|"fail", "summary": "...", "fixes": ["..."] },
    { "key": "impact",     "status": "pass"|"warn"|"fail", "summary": "...", "fixes": ["..."] },
    { "key": "verbs",      "status": "pass"|"warn"|"fail", "summary": "...", "fixes": ["..."] },
    { "key": "contact",    "status": "pass"|"warn"|"fail", "summary": "...", "fixes": ["..."] },
    { "key": "targeting",  "status": "pass"|"warn"|"fail", "summary": "...", "fixes": ["..."] }
  ]
}

Rules:
- Return all six keys, in that order, every time.
- "summary" is ONE sentence and must reference something actually present in or missing from THIS resume. Never generic advice.
- "fixes" are concrete edits the person can make in ten minutes. Quote their actual wording where you suggest a rewrite. 1-3 fixes per category; use [] when status is "pass".
- Score honestly. Most fresher resumes score 45-70. Do not inflate.
- Do not invent experience, employers, or numbers the resume does not contain.`;

/** Coerce whatever the model returned into a complete, ordered six-category report. */
function normalise(raw: unknown): AtsReport {
  const r = (raw ?? {}) as { score?: unknown; findings?: unknown };

  const score =
    typeof r.score === "number" && Number.isFinite(r.score)
      ? Math.round(Math.min(100, Math.max(0, r.score)))
      : 50;

  const byKey = new Map<string, Partial<AtsFinding>>();
  if (Array.isArray(r.findings)) {
    for (const f of r.findings as Partial<AtsFinding>[]) {
      if (f && typeof f.key === "string") byKey.set(f.key, f);
    }
  }

  // Build from ATS_CATEGORIES rather than from the model's array, so a missing
  // or reordered category degrades to "we couldn't assess this" instead of
  // silently shortening the report and making the email gate look like it hid
  // something that was never there.
  const findings: AtsFinding[] = ATS_CATEGORIES.map((cat) => {
    const f = byKey.get(cat.key);
    const status =
      f?.status === "pass" || f?.status === "warn" || f?.status === "fail" ? f.status : "warn";
    return {
      key: cat.key,
      label: cat.label,
      status,
      summary:
        typeof f?.summary === "string" && f.summary.trim()
          ? f.summary.trim()
          : "We couldn't assess this section from the text provided.",
      fixes: Array.isArray(f?.fixes)
        ? f!.fixes.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 3)
        : [],
    };
  });

  return { score, findings };
}

/** Run the check. Throws `AllProvidersFailedError` when both lanes are down. */
export async function scoreResume(resumeText: string, ctx: AiContext): Promise<AtsReport> {
  const { result } = await callAi<unknown>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Analyse this resume for ATS compatibility:\n\n${resumeText.slice(0, 6000)}` },
    ],
    ctx
  );
  return normalise(result);
}

/**
 * The single contextual CTA below the score (§5.2).
 *
 * Deliberately one, not a menu. The old result screen offered every tool at
 * once, which is the same as offering none — the visitor picks nothing and
 * leaves. Pointing at the worst category is both more useful and more likely
 * to be clicked.
 */
export function primaryCta(report: AtsReport): { label: string; href: string; because: string } | null {
  const worst =
    report.findings.find((f) => f.status === "fail") ?? report.findings.find((f) => f.status === "warn");
  if (!worst) return null;

  const cat = ATS_CATEGORIES.find((c) => c.key === worst.key);
  if (!cat) return null;

  return { label: cat.cta.label, href: cat.cta.href, because: worst.summary };
}

/** Visible/locked split for a visitor who hasn't given us an email yet. */
export function gateReport(report: AtsReport): {
  score: number;
  findings: AtsFinding[];
  lockedCount: number;
  lockedLabels: string[];
} {
  const visible = report.findings.slice(0, FREE_VISIBLE_CATEGORIES);
  const locked = report.findings.slice(FREE_VISIBLE_CATEGORIES);
  return {
    score: report.score,
    findings: visible,
    lockedCount: locked.length,
    // Show the *names* of what's locked. "4 more categories" is vague; naming
    // them ("Measurable impact, Action verbs…") is what makes the trade legible
    // enough to be worth an email address.
    lockedLabels: locked.map((f) => f.label),
  };
}

const BAND = (score: number) =>
  score >= 75
    ? { label: "Strong", colour: "#059669" }
    : score >= 55
      ? { label: "Needs work", colour: "#d97706" }
      : { label: "At risk", colour: "#dc2626" };

const STATUS_STYLE: Record<AtsFinding["status"], { label: string; colour: string }> = {
  pass: { label: "OK", colour: "#059669" },
  warn: { label: "Needs work", colour: "#d97706" },
  fail: { label: "Fix this", colour: "#dc2626" },
};

/**
 * The full report as an email.
 *
 * Table-based and inline-styled because that is what survives Gmail, Outlook
 * and the Android Gmail app, which is where essentially all of this audience
 * reads mail.
 */
export function reportEmailHtml(report: AtsReport, opts: { appUrl: string; unsubscribeUrl?: string }): string {
  const band = BAND(report.score);
  const cta = primaryCta(report);

  const rows = report.findings
    .map((f) => {
      const s = STATUS_STYLE[f.status];
      const fixes = f.fixes.length
        ? `<ul style="margin:8px 0 0;padding-left:18px;color:#475569;font-size:14px;line-height:1.6">${f.fixes
            .map((x) => `<li style="margin-bottom:4px">${escapeHtml(x)}</li>`)
            .join("")}</ul>`
        : "";
      return `
      <tr><td style="padding:16px 0;border-bottom:1px solid #e2e8f0">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:15px;font-weight:700;color:#0f172a">${escapeHtml(f.label)}</td>
          <td align="right" style="font-size:12px;font-weight:700;color:${s.colour}">${s.label}</td>
        </tr></table>
        <p style="margin:6px 0 0;font-size:14px;line-height:1.6;color:#475569">${escapeHtml(f.summary)}</p>
        ${fixes}
      </td></tr>`;
    })
    .join("");

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;padding:24px 0">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
    <tr><td>
      <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8">Your ATS report</p>
      <p style="margin:12px 0 0;font-size:48px;font-weight:800;line-height:1;color:${band.colour}">${report.score}<span style="font-size:20px;color:#94a3b8">/100</span></p>
      <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:${band.colour}">${band.label}</p>
      <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569">
        Here is the full breakdown across all six checks an applicant tracking system runs on your resume.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">${rows}</table>

      ${
        cta
          ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px"><tr><td align="center">
              <p style="margin:0 0 12px;font-size:14px;color:#475569">${escapeHtml(cta.because)}</p>
              <a href="${opts.appUrl}${cta.href}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px">${escapeHtml(cta.label)} →</a>
            </td></tr></table>`
          : ""
      }

      <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">
        HYRISE improves how your resume is written and parsed. Hiring decisions are still made by people — be sceptical of anyone who promises otherwise.
        ${opts.unsubscribeUrl ? `<br><a href="${opts.unsubscribeUrl}" style="color:#94a3b8">Unsubscribe</a>` : ""}
      </p>
    </td></tr>
  </table>
</div>`;
}

/** Model output goes into an HTML email — escape it. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
