"use client";

const TOOLS = [
  "ATS Score Checker",
  "AI Resume Rewriter",
  "Mock Interviews",
  "Job Match Analyzer",
  "Cover Letters",
  "DSA Practice",
  "Aptitude Prep",
  "Salary Coach",
  "Career Mentor",
  "Outreach Writer",
  "Recruiter Scan",
  "Learning Roadmaps",
];

/** Infinite logo-cloud style marquee — pure CSS, duplicated list, edge-faded. */
export function ToolMarquee() {
  const row = [...TOOLS, ...TOOLS];
  return (
    <div className="mask-fade-x overflow-hidden" aria-hidden>
      <div className="flex w-max animate-marquee gap-3 pr-3">
        {row.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-[#8a8f98]"
          >
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#7170ff]" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
