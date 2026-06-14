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
    return NextResponse.json({ error: "Recruiter Scan is a Pro feature." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { resumeText, jobDescription } = body;
  if (!resumeText?.trim() || !jobDescription?.trim()) {
    return NextResponse.json({ error: "Resume text and job description are required." }, { status: 400 });
  }

  const prompt = `You are a senior tech recruiter who reviews 200+ resumes per week. You have exactly 6 seconds to scan a resume and decide if it makes the shortlist.

Resume:
${resumeText.slice(0, 3000)}

Job Description:
${jobDescription.slice(0, 2000)}

Evaluate this resume against the job description from a recruiter's perspective. Be specific and brutally honest.

Return ONLY valid JSON (all strings on ONE LINE — no literal newlines inside JSON string values):
{
  "callbackLikelihood": <0-100 integer — realistic % chance this resume gets a callback for this role>,
  "grade": "<A|B|C|D|F>",
  "sixSecondVerdict": "<honest one-sentence verdict a real recruiter would have after 6 seconds of scanning>",
  "sections": [
    { "name": "Contact & Header", "score": <0-100>, "feedback": "<specific observation>" },
    { "name": "Summary / Headline", "score": <0-100>, "feedback": "<specific observation>" },
    { "name": "Work Experience", "score": <0-100>, "feedback": "<specific observation>" },
    { "name": "Skills Match", "score": <0-100>, "feedback": "<specific observation against the JD>" },
    { "name": "ATS Compatibility", "score": <0-100>, "feedback": "<specific observation>" }
  ],
  "keywordGaps": ["<keyword from JD missing from resume 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
  "criticalFixes": [
    { "priority": 1, "fix": "<exact actionable fix — specific, not generic>", "impact": "high" },
    { "priority": 2, "fix": "<fix>", "impact": "high" },
    { "priority": 3, "fix": "<fix>", "impact": "medium" }
  ],
  "quickWins": ["<change you can make in 5 minutes 1>", "<quick win 2>", "<quick win 3>"]
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 2000,
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
    console.error("[recruiter-scan]", err);
    return NextResponse.json({ error: "Could not complete analysis." }, { status: 502 });
  }
}
