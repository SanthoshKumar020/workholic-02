import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUserPro } from "@/lib/plan";
import { checkFreeLimit, recordUsage, limitReachedResponse } from "@/lib/usage";
import { callAi, capacityResponse, AllProvidersFailedError } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The AI Resume Studio backend — powers two things inside /builder once a
 * resume has been generated:
 *
 *   • "edit"      — a chat-style instruction ("add a Projects section",
 *                    "make this more formal") applied to the full resume text.
 *   • "tailor_jd" — paste a job description, get the resume rewritten to
 *                    match it, with a before/after ATS-fit score.
 *
 * Pro-only by design (§ product decision): this is a heavier, multi-turn AI
 * surface than the one-shot /api/enhance, so it is gated the same way
 * /api/tailor already gates company-specific tailoring, and additionally
 * metered against the Pro monthly AI-action allowance in lib/usage.ts so a
 * long back-and-forth editing session can't quietly blow past the plan's
 * cost envelope.
 */

const MAX_RESUME_CHARS = 8000;
const MAX_INSTRUCTION_CHARS = 500;
const MAX_JD_CHARS = 4000;

function clampScore(n: unknown, fallback = 50): number {
  return typeof n === "number" && Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : fallback;
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 12) : [];
}

const EDIT_SYSTEM_PROMPT = `You are an expert resume editor helping a job seeker improve their resume through natural-language requests.

You will receive the CURRENT FULL RESUME TEXT and a REQUESTED CHANGE. Apply ONLY the requested change and leave everything else in the resume exactly as it was — same section order, same formatting style, same content the user didn't ask you to touch.

Language note: the REQUESTED CHANGE may arrive in English, in Tamil script, or in Thanglish (Tamil and English mixed in the same sentence, written in Latin letters — e.g. "experience kku keela projects section add pannunga, athu student management system, tools use pannathu detail ah sollunga"). This is common because the instruction may come from speech-to-text of spoken Tamil/English. Understand the intent regardless of which of these three forms it's written in — do not ask the user to rephrase in plain English. Regardless of what language the instruction was given in, write the resume content itself in professional English (the standard language of resumes reviewed by Indian recruiters and ATS systems), unless the existing resume text you were given is itself in another language, in which case match that.

Rules:
- Never invent facts, employers, dates, degrees, or numbers that are not already present in the resume or explicitly supplied in the instruction.
- If asked to add a section the resume doesn't have (e.g. "add a Projects section"), add a sensibly-placed heading. Only fill in content the instruction actually supplies — if it gives no details, leave a short bracketed placeholder like "[Add your project details here]" rather than inventing one.
- If asked to change tone, wording, or emphasis, rewrite in place — do not shorten unrelated sections.
- Keep the resume's existing section headings and overall structure unless the instruction specifically asks to reorganize.
- Return the ENTIRE resume text back, not just the changed part.

Respond with ONLY valid JSON — no markdown, no code fences, no explanation:
{
  "updatedResume": "<the full resume text with the change applied>",
  "changeSummary": "<one short sentence describing exactly what you changed>",
  "atsScore": <integer 0-100 estimating ATS compatibility of the updated resume>
}`;

const TAILOR_SYSTEM_PROMPT = `You are an expert resume writer and ATS optimization specialist. You will receive a candidate's FULL RESUME and a JOB DESCRIPTION. Rewrite the resume so it aligns closely with this specific job description while staying completely truthful.

Language note: the job description may be pasted in English, Tamil script, or Thanglish (mixed Tamil/English). Understand it regardless of form. Always write the rewritten resume itself in professional English, since that's what Indian recruiters and ATS systems expect, unless the candidate's original resume text is itself in another language.

Rules:
- Reword the professional summary and relevant experience/project bullets using the job description's terminology and priorities, but only where the candidate's actual background genuinely supports it. Never invent employers, titles, skills, tools, or metrics that are not already in the resume.
- Reorder or re-emphasize existing bullets and skills so the most JD-relevant ones are more prominent.
- Keep every section heading and the resume's overall structure intact — it must still read as a normal resume, not a cover letter.
- Use standard, ATS-parseable section headings; never use tables, columns, or symbols as headers.
- "addedKeywords" must list ONLY job-description keywords you deliberately did NOT insert because the candidate's resume doesn't clearly support them — these are suggestions for the user to add themselves, only if true. Never put a keyword in both matchedKeywords and addedKeywords.

Respond with ONLY valid JSON — no markdown, no code fences, no explanation:
{
  "updatedResume": "<the full tailored resume text>",
  "atsScoreBefore": <integer 0-100 — ATS/JD-fit score of the ORIGINAL resume against this JD>,
  "atsScoreAfter": <integer 0-100 — ATS/JD-fit score of the UPDATED resume against this JD>,
  "matchedKeywords": ["<JD keyword genuinely reflected in the resume>"],
  "addedKeywords": ["<JD keyword NOT added — user should confirm before adding>"],
  "changeSummary": "<1-2 sentences summarizing what was tailored>"
}`;

type EditResult = { updatedResume?: string; changeSummary?: string; atsScore?: number };
type TailorResult = {
  updatedResume?: string;
  atsScoreBefore?: number;
  atsScoreAfter?: number;
  matchedKeywords?: unknown;
  addedKeywords?: unknown;
  changeSummary?: string;
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json(
      { error: "The AI resume editor and job-description tailoring are Pro features.", upgrade: true },
      { status: 403 }
    );
  }

  const limit = await checkFreeLimit(supabase, user.id, user.email, "resume-edit");
  if (!limit.allowed) return limitReachedResponse(limit);

  let body: {
    action?: "edit" | "tailor_jd";
    resumeText?: string;
    instruction?: string;
    jobDescription?: string;
    resumeId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const resumeText = (body.resumeText || "").trim();
  if (resumeText.length < 30) {
    return NextResponse.json({ error: "There's no resume text to edit yet." }, { status: 400 });
  }

  const userId = user.id;

  async function persist(enhancedText: string, atsScore: number) {
    if (!body.resumeId) return;
    await supabase
      .from("resumes")
      .update({ enhanced_text: enhancedText, ats_score: atsScore })
      .eq("id", body.resumeId)
      .eq("user_id", userId);
  }

  try {
    if (body.action === "edit") {
      const instruction = (body.instruction || "").trim();
      if (!instruction) {
        return NextResponse.json({ error: "Tell the AI what you'd like to change." }, { status: 400 });
      }

      const { result } = await callAi<EditResult>(
        [
          { role: "system", content: EDIT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Current resume:\n${resumeText.slice(0, MAX_RESUME_CHARS)}\n\nRequested change:\n${instruction.slice(0, MAX_INSTRUCTION_CHARS)}`,
          },
        ],
        { feature: "resume-edit", userId: user.id }
      );

      const updatedResume = (result?.updatedResume || "").trim() || resumeText;
      const atsScore = clampScore(result?.atsScore);
      await recordUsage(supabase, user.id, "resume-edit");
      await persist(updatedResume, atsScore);

      return NextResponse.json({
        updatedResume,
        changeSummary: (result?.changeSummary || "").trim() || "Applied your requested change.",
        atsScore,
      });
    }

    if (body.action === "tailor_jd") {
      const jobDescription = (body.jobDescription || "").trim();
      if (jobDescription.length < 30) {
        return NextResponse.json(
          { error: "Paste the full job description (at least a couple of sentences)." },
          { status: 400 }
        );
      }

      const { result } = await callAi<TailorResult>(
        [
          { role: "system", content: TAILOR_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Resume:\n${resumeText.slice(0, MAX_RESUME_CHARS)}\n\nJob description:\n${jobDescription.slice(0, MAX_JD_CHARS)}`,
          },
        ],
        { feature: "resume-edit", userId: user.id }
      );

      const updatedResume = (result?.updatedResume || "").trim() || resumeText;
      const atsScoreBefore = clampScore(result?.atsScoreBefore);
      const atsScoreAfter = clampScore(result?.atsScoreAfter, atsScoreBefore);
      await recordUsage(supabase, user.id, "resume-edit");
      await persist(updatedResume, atsScoreAfter);

      return NextResponse.json({
        updatedResume,
        atsScoreBefore,
        atsScoreAfter,
        matchedKeywords: strArray(result?.matchedKeywords),
        addedKeywords: strArray(result?.addedKeywords),
        changeSummary: (result?.changeSummary || "").trim() || "Tailored your resume to this job description.",
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    if (err instanceof AllProvidersFailedError) return capacityResponse("resume-edit");
    console.error("[resume-edit]", err);
    return NextResponse.json({ error: "Could not process that request. Please try again." }, { status: 502 });
  }
}
