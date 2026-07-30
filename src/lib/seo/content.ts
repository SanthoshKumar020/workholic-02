import type { CompanyData } from "@/lib/company-data";
import type { SeoRole } from "./roles";

/** ATS keywords a recruiter scans for, for this role. */
export function roleAtsKeywords(role: SeoRole): string[] {
  return [...role.skills, ...role.tools];
}

/** Role-specific resume tips (substantive, unique per role via skills/tools). */
export function roleResumeTips(role: SeoRole): string[] {
  const topSkills = role.skills.slice(0, 3).join(", ");
  const topTools = role.tools.slice(0, 3).join(", ");
  return [
    `Lead your skills section with the exact terms from the job post — for ${role.name} roles that usually means ${topSkills}.`,
    `List your tools explicitly (${topTools}, …). ATS keyword matching is literal, so name them rather than implying them.`,
    `Quantify impact in every bullet. "Reduced report time 40%" beats "improved reporting" and includes the numbers recruiters scan for.`,
    `Use a single-column layout with standard headings (Work Experience, Skills, Projects) so the ATS parses your ${role.name} resume cleanly.`,
    `Mirror the seniority language of the posting. If it says "${role.skills[0]}", use that phrase verbatim where it's genuinely true.`,
  ];
}

/** Generate a substantive, role-specific set of mock interview questions. */
export function roleInterviewQuestions(role: SeoRole): { section: string; questions: string[] }[] {
  const behavioral = [
    "Tell me about yourself and why you're targeting this role.",
    "Describe a project you're most proud of. What was your specific contribution?",
    "Tell me about a time you missed a deadline or failed. What did you learn?",
    "How do you prioritise when everything feels urgent?",
    "Describe a disagreement with a teammate and how you resolved it.",
  ];

  const technical = role.skills.slice(0, 5).map(
    (skill) => `Walk me through how you've applied ${skill} in a real ${role.name.toLowerCase()} project.`
  );

  const tools = role.tools.slice(0, 4).map(
    (tool) => `What's your experience with ${tool}, and when would you choose it over an alternative?`
  );

  const roleSpecific = [
    `What does success look like in a ${role.name} role in the first 90 days?`,
    `How do you stay current with changes in ${role.category.toLowerCase()}?`,
    `Describe how you'd approach a typical problem a ${role.name} faces day to day.`,
  ];

  return [
    { section: "Behavioral & fit", questions: behavioral },
    { section: `Technical — core ${role.name} skills`, questions: technical },
    { section: "Tools & technologies", questions: tools },
    { section: "Role-specific", questions: roleSpecific },
  ];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Company pages (/companies/[company])
 *
 * Every string below is derived from the fields already present in
 * `COMPANIES`. Nothing is invented — no success rates, no "X% of candidates",
 * no salary figures beyond the ranges already in the data. There is also
 * deliberately no rating or review markup anywhere on these pages: fabricated
 * `aggregateRating` / `Review` JSON-LD was removed from this site because it
 * is a Google manual-action risk. Do not reintroduce it.
 * ──────────────────────────────────────────────────────────────────────────── */

/** One-line summary used in metadata descriptions and hub cards. */
export function companySummary(c: CompanyData): string {
  return `${c.avgRounds} rounds · ${c.difficulty} · ${c.prepWeeks} of prep`;
}

/** Substantive FAQ for a company page, built entirely from company-data.ts. */
export function companyFaq(c: CompanyData): { q: string; a: string }[] {
  const steps = c.interviewProcess;
  const roundNames = steps.map((s) => s.name);
  const technicalRounds = steps.filter((s) => s.type === "dsa" || s.type === "system_design");
  const finalRound = steps.length > 0 ? steps[steps.length - 1] : undefined;

  const faq: { q: string; a: string }[] = [
    {
      q: `How many rounds are there in the ${c.name} interview process?`,
      a: `${c.name} usually runs ${c.avgRounds} rounds: ${roundNames.join(" → ")}. The exact number varies by role, level, and whether you apply on-campus, off-campus, or through a referral.`,
    },
    {
      q: `What does each ${c.name} interview round cover?`,
      a: steps
        .map((s) => `Round ${s.step} — ${s.name} (${s.duration}): ${s.focus}.`)
        .join(" "),
    },
    {
      q: `Is the ${c.name} interview hard?`,
      a: `On this list we place ${c.name} at ${c.difficulty} difficulty. ${technicalRounds.length} of the ${c.avgRounds} rounds are technical (coding or system design). ${c.tagline}.`,
    },
    {
      q: `How long should I prepare for a ${c.name} interview?`,
      a: `Plan for roughly ${c.prepWeeks} of focused preparation. That figure assumes consistent daily practice rather than last-minute cramming, and it shifts with your starting point — this is guidance, not a promise about your outcome.`,
    },
    {
      q: `Which roles does ${c.name} hire for?`,
      a: `The roles most commonly seen in ${c.name} hiring cycles are ${c.hiringFor.join(", ")}. Open positions change constantly, so always check the official careers page before you prepare for a specific title.`,
    },
    {
      q: `What salary range does ${c.name} offer?`,
      a: `Reported ranges for ${c.name} sit around ${c.avgSalary}. Actual offers depend on level, location, interview performance, and the year you join, so treat this as a rough band rather than a number to expect.`,
    },
    {
      q: `What does ${c.name} look for beyond technical skill?`,
      a: `${c.name} interviewers assess against ${c.values.join(", ")}. On culture: ${c.culture}`,
    },
    {
      q: `How should I prepare for the ${c.name} interview?`,
      a: c.tips.slice(0, 3).map((t) => `${t}.`).join(" "),
    },
  ];

  if (finalRound) {
    faq.push({
      q: `What is the last round of the ${c.name} interview?`,
      a: `The final stage is usually "${finalRound.name}" (${finalRound.duration}), focused on ${finalRound.focus.toLowerCase()}. ${finalRound.what}`,
    });
  }

  return faq;
}

/**
 * Behavioral question themes derived from the company's own stated values.
 * These are the standard STAR-format prompts for each value — grounded in
 * `values`, not invented question banks.
 */
export function companyValueQuestions(c: CompanyData): string[] {
  return c.values.map((v) => `Tell me about a time you demonstrated ${v.toLowerCase()}.`);
}

/** What to expect per round, phrased as questions a candidate would search for. */
export function companyRoundQuestions(c: CompanyData): string[] {
  return c.interviewProcess.map(
    (s) => `${s.name} (${s.duration}) — what is assessed: ${s.focus}. ${s.what}`
  );
}
