import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeJson } from "@/lib/json-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { company, level = "SDE II" } = body as { company: string; level?: string };
  if (!company?.trim()) return NextResponse.json({ error: "Company required." }, { status: 400 });

  const prompt = `You are an expert interview coach with deep knowledge of ${company}'s engineering hiring process.

Generate a comprehensive interview question bank WITH ANSWERS for a ${level} level candidate interviewing at ${company}.

Include REAL questions known from ${company} interviews (Glassdoor, LeetCode Discuss, GeeksForGeeks, Blind).

Return ONLY valid JSON. All string values must be on ONE LINE (no literal newlines inside JSON strings — use \\n for line breaks in code).

{
  "dsaQuestions": [
    {
      "question": "<exact DSA problem or question>",
      "difficulty": "easy|medium|hard",
      "topic": "<e.g. Arrays, Trees, DP>",
      "frequency": "high|medium|low",
      "hint": "<one-line approach hint>",
      "answer": "<clean Python solution — 8-15 lines — use \\n for line breaks, # for comments>",
      "answerExplanation": "<one paragraph: what algorithm is used and why it achieves the target complexity>"
    }
  ],
  "systemDesign": [
    {
      "question": "<system design question asked at ${company}>",
      "category": "<e.g. Distributed Systems, API Design, Database>",
      "hint": "<key focus area for ${company}>",
      "keyComponents": ["<component 1>", "<component 2>", "<component 3>", "<component 4>"],
      "designApproach": "<3-4 sentences covering: clarify requirements, high-level components, data model, key trade-offs — specific to ${company}'s scale>"
    }
  ],
  "behavioral": [
    {
      "question": "<behavioral question asked at ${company}>",
      "principle": "<which ${company} value/LP this maps to>",
      "starTip": "<specific tip for answering at ${company}>",
      "sampleAnswer": "<STAR-format sample answer: Situation (1 sentence) → Task (1 sentence) → Action (2 sentences) → Result (1 sentence with metric) — realistic and specific>"
    }
  ],
  "hrQuestions": [
    {
      "question": "<HR question>",
      "answer": "<ideal answer approach: 2-3 sentences — what interviewers want to hear, tone to adopt>"
    }
  ]
}

Generate: 8 DSA questions, 5 system design questions, 6 behavioral questions, 5 HR questions.
Make everything SPECIFIC to ${company} — not generic.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 5000,
      }),
      signal: AbortSignal.timeout(50000),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const d = await res.json();
    const text = d.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return NextResponse.json(JSON.parse(sanitizeJson(match[0])));
  } catch (err) {
    console.error("[company-prep]", err);
    return NextResponse.json({ error: "Could not load questions." }, { status: 502 });
  }
}
