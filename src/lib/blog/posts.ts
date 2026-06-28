/**
 * Blog content — the organic growth engine.
 * Each post is hand-written long-form SEO content targeting a high-intent query.
 * Add new posts by appending to BLOG_POSTS (same shape); they auto-appear on
 * /blog, get their own /blog/[slug] page, and enter the sitemap.
 */

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  /** ISO date string, e.g. "2026-01-15". */
  date: string;
  readingMinutes: number;
  /** Markdown body (rendered by <Markdown />). */
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "ats-resume-checker-guide",
    title: "ATS Resume Checker: How to Check and Beat the Bots in 2026",
    description:
      "What an ATS resume checker actually does, why 75% of resumes get rejected before a human reads them, and how to score 80+ on any ATS scan.",
    keywords: ["ATS resume checker", "ATS score", "applicant tracking system", "beat ATS"],
    category: "ATS & Resumes",
    date: "2026-01-20",
    readingMinutes: 7,
    body: `Most resumes are never read by a human. Before a recruiter ever sees your application, it passes through an **Applicant Tracking System (ATS)** — software that parses, scores, and ranks every resume against the job description. If your resume isn't formatted for the machine, it gets filtered out silently. No rejection email, no feedback. Just silence.

This guide explains exactly what an ATS resume checker does and how to consistently score above 80.

## What is an ATS resume checker?

An ATS resume checker simulates how applicant tracking software reads your resume. It evaluates three things:

- **Parsability** — can the software cleanly extract your name, contact details, work history, and skills?
- **Keyword match** — does your resume contain the words from the job description?
- **Formatting** — are there tables, columns, images, or graphics that break the parser?

The output is usually a score out of 100. A score below 60 means most systems will filter you out. 60–79 is workable but leaves interviews on the table. 80+ means you'll consistently reach a human reviewer.

You can [check your ATS score for free here](/#ats) — paste or upload your resume and get an instant score with specific fixes.

## Why 75% of resumes get rejected by ATS

The most common reasons resumes fail an ATS scan have nothing to do with your experience:

1. **Tables and columns.** Many "designer" templates use two-column layouts. ATS parsers read left-to-right, top-to-bottom, so a two-column resume gets scrambled into nonsense.
2. **Headers and footers.** Critical info (like your phone number) placed in the document header is often ignored entirely.
3. **Images, icons, and logos.** The ATS can't read them. A skills section built from icon bars is invisible to the machine.
4. **Creative section titles.** "Where I've Made Magic" instead of "Work Experience" confuses the parser.
5. **Missing keywords.** If the job asks for "project management" and your resume says "ran projects," the keyword match fails.

## How to pass an ATS scan: the rules

### Use a single-column layout
One column, top to bottom. This is the single biggest fix. It feels less "designed," but it parses perfectly.

### Use standard section headings
Stick to **Work Experience**, **Education**, **Skills**, **Projects**, and **Certifications**. The ATS is trained on these exact words.

### Mirror the job description's keywords
Read the job posting and pull out the hard skills and tools it names. If you genuinely have them, use the **same wording** on your resume. Don't write "JS" when the posting says "JavaScript."

### Save as PDF (usually)
Modern ATS handle PDF well, and PDF preserves your formatting. A few older systems prefer .docx — if a posting specifically asks for Word, give it Word.

### Quantify everything
"Increased signups" is weak. "Increased signups 38% in 6 months" is strong — and it naturally includes numbers recruiters scan for.

## Keyword matching, explained

Keyword matching is where most candidates lose points. Here's the method:

- Paste the job description into a [job match analyzer](/match) alongside your resume.
- It shows you which keywords matched and which are missing.
- Add the missing keywords **only where they're true** — in your skills section, a project bullet, or your summary.

This single step typically moves an ATS score up 15–25 points.

## Don't keyword-stuff

There's a myth that you should hide white keywords in the margins or repeat terms 20 times. Modern ATS and the recruiters behind them penalise this. Write naturally, match real keywords, and quantify your impact. That's the whole game.

## The fastest path to an 80+ score

1. [Check your current ATS score](/#ats) — takes 60 seconds.
2. Fix the formatting issues it flags (single column, standard headings).
3. Run a [keyword match](/match) against your target job and close the gaps.
4. Re-check. Most people go from the 50s to the 80s in one editing session.

Your resume's job is to get you to a human. Format for the machine first, impress the human second — in that order.`,
  },

  {
    slug: "how-to-pass-ats",
    title: "How to Pass an ATS: 12 Rules Recruiters Won't Tell You",
    description:
      "A practical, no-fluff checklist to get your resume past applicant tracking systems and in front of a real recruiter.",
    keywords: ["how to pass ATS", "beat applicant tracking system", "ATS friendly resume", "ATS tips"],
    category: "ATS & Resumes",
    date: "2026-01-22",
    readingMinutes: 6,
    body: `If you've applied to dozens of jobs and heard nothing back, the problem usually isn't you — it's the **applicant tracking system** filtering you out before a human looks. Here are 12 rules that get your resume through.

## 1. One column, always
Two-column resumes look modern and parse terribly. ATS software reads in a single flow, so a sidebar of skills often ends up merged into your job descriptions. Use one column.

## 2. Standard section headings
Use **Work Experience**, **Education**, **Skills**, **Projects**, **Certifications**. Clever headings like "My Journey" break automated parsing.

## 3. Put contact info in the body, not the header
Text inside a Word/PDF header region is frequently skipped. Put your name, phone, email, and city in the normal body at the top.

## 4. Match the job's exact keywords
If the posting says "stakeholder management," use that phrase — not "managing stakeholders." [Run a keyword match](/match) to see exactly what's missing.

## 5. Skip tables, text boxes, and columns
Anything that isn't a normal paragraph or bullet list is a risk. Tables are the most common cause of a scrambled parse.

## 6. No images, icons, or logos
The ATS can't read them. A skills bar made of icons is invisible. Company logos add nothing and can confuse the parser.

## 7. Use a common font
Arial, Calibri, Helvetica, Georgia, Times New Roman. Decorative fonts sometimes fail to embed and turn into gibberish.

## 8. Spell out then abbreviate
Write "Search Engine Optimization (SEO)" the first time. That way you match recruiters searching for either term.

## 9. Quantify your bullets
Numbers do double duty: they impress humans and they include the digits recruiters scan for. "Cut response time 40%" beats "improved response time."

## 10. Save with a clean filename
\`Firstname-Lastname-Resume.pdf\`. Not \`resume-final-v3-FINAL.pdf\`.

## 11. Use PDF unless told otherwise
PDF preserves layout and is well-supported. If a posting explicitly requests .docx, follow that.

## 12. Test before you send
Don't guess. [Check your ATS score](/#ats) in under a minute and fix what it flags. Re-check until you're above 80.

## The honest summary

Passing an ATS isn't about tricks — it's about removing friction. Plain formatting, real keywords, quantified results. Do those three things and you'll reach the recruiter, where your actual experience can do the talking.

Want it done for you? Our [AI resume builder](/builder) generates an ATS-friendly resume and scores it as you go.`,
  },

  {
    slug: "resume-format-for-freshers",
    title: "Resume Format for Freshers: The 1-Page Template That Gets Interviews",
    description:
      "The exact resume format for freshers and entry-level candidates — section order, what to include with no experience, and an ATS-friendly template.",
    keywords: ["resume format for freshers", "fresher resume", "entry level resume format", "resume for students"],
    category: "Resume Formats",
    date: "2026-01-25",
    readingMinutes: 6,
    body: `Writing your first resume is hard precisely because you don't have much to put on it. The trick is to use a format that highlights potential — projects, skills, and education — instead of leaving gaps where work experience would go. Here's the format that works.

## The right section order for freshers

When you have little or no work experience, lead with what's strongest:

1. **Header** — name, phone, email, city, LinkedIn/GitHub
2. **Summary** — 2 lines on who you are and what you're targeting
3. **Skills** — technical and tools, matched to the job
4. **Projects** — your biggest advantage as a fresher
5. **Education** — degree, institution, graduation year, notable scores
6. **Internships / Experience** — if any
7. **Certifications & Achievements**

Experienced candidates lead with work history. Freshers lead with **skills and projects**. That's the key difference.

## What to write when you have no experience

### Projects are your experience
A well-described project is worth more than an empty "Experience" section. For each project, write:

- What it does (one line)
- The tools/tech you used (keywords!)
- Your specific contribution
- A result or metric if you have one

Example: *"Built a food-delivery web app with React and Firebase; implemented live order tracking used by 30+ test users."*

### Turn coursework into signal
Relevant courses, a capstone, or a thesis all count. List the ones that match your target role.

### Internships, freelance, and volunteering count
Any real-world application of your skills belongs here, even if unpaid.

## Keep it to one page

Freshers should never exceed one page. Recruiters spend about 7 seconds on a first pass. One tight page beats two padded ones every time.

## ATS-friendly formatting

- Single column
- Standard headings
- No photos, no graphics, no tables
- A common font at 10.5–12pt
- Saved as PDF

A two-column "creative" template will get scrambled by applicant tracking software. Plain wins. ([Here's why](/blog/how-to-pass-ats).)

## Match keywords to the job

Read the job description and mirror its skill keywords in your Skills and Projects sections — wherever they're genuinely true. Use a [job match check](/match) to see what's missing before you apply.

## Fresher resume template (copy this structure)

\`\`\`
NAME
City · phone · email · linkedin.com/in/you · github.com/you

SUMMARY
Final-year CS student targeting a Frontend Developer role.
Built 4 React projects; strong in JavaScript, React, and UI design.

SKILLS
JavaScript, React, HTML, CSS, Git, Node.js, REST APIs, Figma

PROJECTS
Project Name — React, Firebase
- One-line description and your contribution
- A metric or outcome

EDUCATION
B.Tech Computer Science, XYZ University — 2026 — CGPA 8.4

CERTIFICATIONS
- Relevant certificate, issuer, year
\`\`\`

## Generate it in minutes

You don't have to format this by hand. Our [resume builder](/builder) produces a clean, single-column, ATS-friendly resume from a simple form — and scores it as you go. Looking for role-specific guidance? See our [resume checker for your target role](/resume-checker).`,
  },

  {
    slug: "how-to-write-a-cover-letter",
    title: "How to Write a Cover Letter for Any Job (with a Free Template)",
    description:
      "A simple 4-paragraph cover letter structure that works for any job, plus a fill-in-the-blanks template and common mistakes to avoid.",
    keywords: ["how to write a cover letter", "cover letter template", "cover letter for job", "cover letter example"],
    category: "Cover Letters",
    date: "2026-01-28",
    readingMinutes: 5,
    body: `A cover letter doesn't need to be a literary masterpiece. It needs to do one job: connect your experience to *this* role for *this* company, in a way a busy hiring manager can absorb in 30 seconds. Here's a structure that works for any job.

## The 4-paragraph structure

### Paragraph 1 — The hook (2–3 sentences)
State the role you're applying for and one specific reason you're a strong fit. Skip "I am writing to apply for…" — everyone writes that. Open with substance.

*"I'm applying for the Data Analyst role at Acme. In my last role I cut monthly reporting time from two days to two hours by automating dashboards in Power BI — exactly the kind of impact your job description calls for."*

### Paragraph 2 — Proof (3–4 sentences)
Pick the one or two achievements most relevant to the role and describe them with numbers. This is where you show, not tell.

### Paragraph 3 — Why this company (2–3 sentences)
Show you've done five minutes of homework. Reference a product, value, or recent move. This is what separates a tailored letter from a mass-blast.

### Paragraph 4 — Close (1–2 sentences)
A confident, simple call to action. Thank them and say you'd welcome the chance to discuss further.

## Fill-in-the-blanks template

\`\`\`
Dear [Hiring Manager name],

I'm applying for the [role] at [company]. [One specific, quantified reason
you're a strong fit.]

In my [current/previous] role at [company], I [achievement with a number].
I also [second relevant achievement]. These map directly to [specific
requirement from the job description].

I'm drawn to [company] because [specific, researched reason]. [One sentence
connecting their goal to what you do well.]

I'd welcome the chance to discuss how I can contribute to [team/goal].
Thank you for your time.

Sincerely,
[Your name]
\`\`\`

## Common mistakes to avoid

- **Restating your resume.** The cover letter adds context and narrative; it doesn't repeat bullets.
- **Being generic.** "I'm a hard worker and team player" says nothing. Use specifics.
- **Making it about you, not them.** Frame your experience around the company's needs.
- **Going long.** Half a page. Four short paragraphs. That's it.
- **No proofreading.** A typo in a cover letter is an instant credibility hit.

## Tailor it to the job

The single highest-leverage move is matching the letter to the specific posting — its keywords, its requirements, its language. If you're applying to many roles, that's a lot of rewriting.

Our [AI cover letter generator](/cover-letter) writes a tailored letter for any job in seconds: paste the job description, and it produces a focused, company-specific draft you can edit. Pair it with an [ATS-checked resume](/#ats) and you've got a complete, targeted application.`,
  },

  {
    slug: "resume-keywords-beat-ats",
    title: "Resume Keywords: How to Find and Use Them to Beat ATS",
    description:
      "Keywords are how applicant tracking systems rank you. Here's how to find the right resume keywords for any job and use them without keyword-stuffing.",
    keywords: ["resume keywords", "ATS keywords", "keyword optimization resume", "resume keyword match"],
    category: "ATS & Resumes",
    date: "2026-02-02",
    readingMinutes: 5,
    body: `Applicant tracking systems rank resumes largely on **keyword match** — how well your resume's language overlaps with the job description. Get the keywords right and you climb the ranking. Get them wrong and you're invisible, no matter how good your experience is. Here's the method.

## What counts as a keyword

Keywords fall into three buckets:

- **Hard skills** — "financial modelling," "Kubernetes," "SQL," "user research"
- **Tools and technologies** — "Salesforce," "Figma," "AWS," "Tableau"
- **Role-specific terms** — "stakeholder management," "A/B testing," "incident response"

Soft skills ("communication," "leadership") matter less to the ATS — they're everywhere and rarely searched.

## How to find the right keywords

### 1. Mine the job description
The job posting is your keyword list. Read it and highlight every hard skill, tool, and role-specific phrase. Those exact terms are what the ATS is scoring against.

### 2. Compare three postings for the same role
Look at three listings for your target job. The keywords that appear in all three are the non-negotiables for that role — make sure your resume has them.

### 3. Use a match tool
Manually comparing is slow. A [job match analyzer](/match) compares your resume to a job description and lists exactly which keywords matched and which are missing. This is the fastest way to find your gaps.

## How to use keywords correctly

### Use exact phrasing
If the posting says "project management," write "project management" — not "managed projects." The match is literal.

### Put them where they're true
Add keywords in your **Skills** section, in **project/experience bullets**, and in your **summary** — but only for skills you actually have. Lying gets exposed in the interview.

### Spell out abbreviations once
"Search Engine Optimization (SEO)" matches recruiters searching either form.

### Weave them into achievements
The best keyword placement is inside a quantified bullet: *"Built ETL pipelines in **Airflow** and **Spark**, cutting data latency 60%."* You match the keyword *and* prove you can use it.

## What NOT to do

- **Don't keyword-stuff.** Repeating "Java" 15 times or hiding white text in the margins gets penalised by modern ATS and looks absurd to the recruiter who eventually reads it.
- **Don't claim skills you lack.** A keyword gets you the interview; the interview exposes the bluff.
- **Don't ignore the skills section.** It's the highest-density place for keywords and the easiest to update per application.

## Put it together

1. Pull keywords from the job description.
2. [Run a match](/match) to find what's missing.
3. Add the true ones to your skills, bullets, and summary.
4. [Re-check your ATS score](/#ats) to confirm the lift.

Keyword optimisation is the highest-ROI edit you can make to a resume. Ten minutes of matching can be the difference between silence and an interview.`,
  },

  {
    slug: "star-method-interview-answers",
    title: "STAR Method: How to Answer Behavioral Interview Questions",
    description:
      "The STAR method explained with examples — how to structure answers to 'tell me about a time…' questions so they land with any interviewer.",
    keywords: ["STAR method", "behavioral interview questions", "interview answers", "tell me about a time"],
    category: "Interview Prep",
    date: "2026-02-05",
    readingMinutes: 6,
    body: `"Tell me about a time you handled conflict." "Describe a challenge you overcame." Behavioral questions trip up smart candidates because they ramble — they tell a story with no structure and lose the interviewer halfway through. The **STAR method** fixes that.

## What STAR stands for

- **S — Situation:** Set the scene in one or two sentences. Where, when, what was at stake.
- **T — Task:** What were *you* responsible for? Be specific about your role.
- **A — Action:** What did you actually do? This is the heart of the answer — use "I," not "we."
- **R — Result:** What happened? Quantify it if you can.

The magic is in the proportions: keep S and T short, spend most of your time on A, and always finish with R.

## A STAR example

**Question:** "Tell me about a time you missed a deadline."

- **Situation:** "On a product launch, our design files arrived three days late, putting the whole release at risk."
- **Task:** "As the front-end lead, I owned shipping the marketing site on the original date."
- **Action:** "I broke the work into must-have vs nice-to-have, shipped the core pages on time with placeholder visuals, and scheduled the polish for a fast-follow two days later. I kept stakeholders updated daily."
- **Result:** "We launched on schedule, the fast-follow shipped on time, and we adopted the must-have/nice-to-have split as standard for future launches."

Notice it's honest about a failure but ends on growth and a result. That's what interviewers want.

## Common behavioral questions to prepare

Prepare one STAR story for each of these themes — most behavioral questions are variations:

- A conflict with a teammate
- A time you failed or missed a target
- A project you led
- A time you handled pressure or a tight deadline
- A time you persuaded someone
- Your biggest professional achievement

One strong, quantified story per theme covers 80% of behavioral interviews.

## Tips that make STAR answers land

- **Lead with the result sometimes.** "I'll tell you about a launch we saved — here's what happened." A strong hook earns attention.
- **Use 'I' for your actions.** Interviewers are assessing *you*, not your team.
- **Quantify the result.** Numbers make it memorable and credible.
- **Keep it under two minutes.** Practise out loud — most people run long.

## Practise out loud, not in your head

Reading STAR examples isn't enough — you need reps. Our [AI mock interview](/interview) asks you real behavioral questions for your target role, records your answers, and scores them on structure, pacing, and filler words. It's the fastest way to turn shaky stories into confident, STAR-structured answers.

Preparing for a specific role? See our [role-specific interview questions](/interview-questions) to practise the exact themes your interviewer will probe.`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Newest first. */
export function sortedPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}
