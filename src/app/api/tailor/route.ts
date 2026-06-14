import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUserPro } from "@/lib/plan";
import { sanitizeJson } from "@/lib/json-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json({ error: "Company Tailoring is a Pro feature." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { resumeText, jobDescription, companyName, role, action } = body;
  if (!resumeText?.trim() || !jobDescription?.trim()) {
    return NextResponse.json({ error: "Resume and job description are required." }, { status: 400 });
  }

  const ctx = `Company: ${companyName || "the company"}\nRole: ${role || "the position"}`;

  if (action === "resume") {
    const prompt = `You are an expert resume coach who tailors resumes for specific job postings.

Candidate's resume:
${resumeText.slice(0, 3000)}

Target posting:
${ctx}
Job Description:
${jobDescription.slice(0, 2000)}

Rewrite the resume summary and key experience bullets to precisely match this JD's language, priorities, and keywords. Identify jobs in the resume and provide tailored bullets for each.

Return ONLY valid JSON (all strings on ONE LINE — no literal newlines):
{
  "fitScore": <0-100 — current fit before tailoring>,
  "tailoredFitScore": <0-100 — projected fit after applying these changes>,
  "tailoredSummary": "<rewritten professional summary 3-4 sentences using JD keywords naturally>",
  "experienceTailoring": [
    {
      "jobTitle": "<job title + company from their resume>",
      "tailoredBullets": ["<rewritten bullet 1 with impact + JD keywords>", "<bullet 2>", "<bullet 3>"]
    }
  ],
  "skillsToHighlight": ["<skill from resume that matches JD 1>", "<skill 2>", "<skill 3>", "<skill 4>", "<skill 5>"],
  "keywordsToAdd": ["<keyword from JD not in resume 1>", "<keyword 2>", "<keyword 3>"],
  "tips": ["<specific tailoring tip 1>", "<tip 2>"]
}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          max_tokens: 2500,
        }),
        signal: AbortSignal.timeout(40000),
      });
      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const d = await res.json();
      const text = d.choices?.[0]?.message?.content ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(sanitizeJson(match[0])));
    } catch (err) {
      console.error("[tailor/resume]", err);
      return NextResponse.json({ error: "Could not tailor resume." }, { status: 502 });
    }
  }

  if (action === "cover_letter") {
    const prompt = `You are an expert cover letter writer. Write a compelling, specific cover letter.

Candidate's background:
${resumeText.slice(0, 2500)}

${ctx}
Job Description:
${jobDescription.slice(0, 2000)}

Write a cover letter that:
- Opens with something specific about this company — NOT "I am writing to express my interest"
- Highlights the 2-3 strongest candidate-to-role matches using specifics from the resume
- Matches the tone of the JD (startup = energetic; corporate = measured)
- Is 3-4 paragraphs, reads like a human wrote it
- Ends with a clear, confident call to action

Return ONLY valid JSON (use \\n for paragraph breaks inside coverLetter string):
{
  "subject": "<email subject line — specific and attention-grabbing>",
  "coverLetter": "<full cover letter with \\n between paragraphs>",
  "highlights": ["<strongest match 1>", "<match 2>", "<match 3>"],
  "tips": ["<personalization tip 1>", "<tip 2>"]
}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(35000),
      });
      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const d = await res.json();
      const text = d.choices?.[0]?.message?.content ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(sanitizeJson(match[0])));
    } catch (err) {
      console.error("[tailor/cover_letter]", err);
      return NextResponse.json({ error: "Could not generate cover letter." }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
