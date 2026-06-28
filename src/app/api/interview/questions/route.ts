import { NextResponse } from "next/server";
import { getGroqKey } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";
import { sanitizeJson } from "@/lib/json-utils";
import { checkFreeLimit, recordUsage, limitReachedResponse } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMPANY_CONTEXT: Record<string, string> = {
  google: "Google values: googliness, leadership, role-related knowledge, general cognitive ability. Expect systems design, coding, and culture-fit questions about ambiguity and scale.",
  amazon: "Amazon uses Leadership Principles (Customer Obsession, Ownership, Invent & Simplify, etc.) heavily. Every behavioral question maps to an LP. Expect STAR-format stories.",
  microsoft: "Microsoft focuses on growth mindset, collaboration, and technical depth. Expect problem-solving, design, and culture questions about learning from failure.",
  meta: "Meta values impact, moving fast, data-driven decisions. Expect product sense, execution, and systems questions.",
  flipkart: "Flipkart focuses on execution, scale, ownership, and customer impact. Common in India for SDE roles.",
  infosys: "Infosys interviews cover basic DS&A, HR rounds, and behavioral fit for freshers to mid-level.",
  tcs: "TCS focuses on aptitude, basic coding, communication, and HR rounds.",
  wipro: "Wipro covers technical basics, coding, and HR behavioral questions.",
  accenture: "Accenture focuses on consulting skills, problem-solving, communication, and technical basics.",
  deloitte: "Deloitte values analytical thinking, leadership, and client-facing communication.",
};

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { allowed } = await checkFreeLimit(supabase, user.id, user.email, "interview-questions");
  if (!allowed) return limitReachedResponse();

  const body = await request.json().catch(() => ({}));
  const role = (body.role || "Software Engineer").trim();
  const level = (body.level || "mid").trim();
  const company = (body.company || "").trim();
  const interviewType = (body.interviewType || "mixed").trim();
  const count = Math.min(Math.max(body.count ?? 8, 5), 10);

  const companyKey = company.toLowerCase().replace(/\s+/g, "");
  const companyCtx = Object.entries(COMPANY_CONTEXT).find(([k]) => companyKey.includes(k))?.[1] ?? "";

  const typeGuide =
    interviewType === "behavioral"  ? `ALL ${count} questions must be behavioral (STAR format). Focus on past experience, leadership, conflict, failure, teamwork.` :
    interviewType === "technical"   ? `ALL ${count} questions must be technical. Mix coding concepts, system design, debugging scenarios, and role-specific tools.` :
    interviewType === "hr"          ? `ALL ${count} questions must be HR/culture-fit: motivation, strengths, weaknesses, career goals, compensation expectations, team dynamics.` :
    interviewType === "system_design" ? `ALL ${count} questions must be system design: architecture, scalability, trade-offs, API design, database choices.` :
    `Mix: ${Math.ceil(count*0.4)} behavioral (STAR), ${Math.floor(count*0.35)} technical, ${Math.floor(count*0.25)} HR/culture.`;

  const prompt = `You are a senior interviewer at${company ? ` ${company}` : " a top tech company"} hiring a ${level}-level ${role}.
${companyCtx ? `\nCompany context: ${companyCtx}` : ""}

Generate exactly ${count} realistic interview questions for this candidate.
${typeGuide}

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "text": "<the interview question — direct, specific, realistic>",
      "type": "behavioral|technical|hr|system_design",
      "category": "<e.g. Leadership, Problem Solving, System Design, Data Structures, Culture Fit>",
      "hint": "<what a strong answer should include — 1 sentence for the candidate>",
      "followUp": "<one natural follow-up the interviewer might ask>"
    }
  ]
}

Questions must be specific to the role and level. No generic filler. A ${level} ${role} at${company ? ` ${company}` : " a top company"} would actually face these.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getGroqKey()}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2500,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const groqData = await res.json();
    const text = groqData.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const result = JSON.parse(sanitizeJson(match[0]));
    await recordUsage(supabase, user.id, "interview-questions");
    return NextResponse.json({ questions: result.questions ?? [] });
  } catch (err) {
    console.error("[interview/questions]", err);
    return NextResponse.json({ error: "Could not generate questions." }, { status: 502 });
  }
}
