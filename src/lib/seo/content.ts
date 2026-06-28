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
