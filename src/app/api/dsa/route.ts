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
  const { action, topic, difficulty, problem, userSolution, userApproach } = body;

  if (action === "problem") {
    const prompt = `Generate an original ${difficulty || "medium"} coding/DSA problem on the topic: ${topic || "Arrays"}.

The problem should be interview-style, realistic, and solvable in a coding interview. Do NOT generate well-known problems like Two Sum or Fibonacci verbatim — make it original but in the same style.

Return ONLY valid JSON (all strings on ONE LINE — no literal newlines inside JSON string values):
{
  "title": "<problem title>",
  "difficulty": "${difficulty || "medium"}",
  "topic": "${topic || "Arrays"}",
  "description": "<clear problem statement — 2-3 sentences, include what to return>",
  "examples": [
    { "input": "<example input>", "output": "<expected output>", "explanation": "<why this is the answer>" },
    { "input": "<second example>", "output": "<output>", "explanation": "<explanation>" }
  ],
  "constraints": ["<constraint 1 e.g. 1 <= n <= 10^4>", "<constraint 2>", "<constraint 3>"],
  "hints": [
    "<hint 1 — minimal, just a direction>",
    "<hint 2 — more specific technique>",
    "<hint 3 — near-solution, reveals the key insight>"
  ],
  "timeComplexityTarget": "<e.g. O(n log n)>",
  "spaceComplexityTarget": "<e.g. O(n)>",
  "modelSolution": "<clean Python solution — well commented, readable, 10-20 lines>",
  "modelExplanation": "<one clear paragraph explaining the algorithm approach and why it achieves the target complexity>"
}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.85,
          max_tokens: 1800,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const d = await res.json();
      const text = d.choices?.[0]?.message?.content ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(sanitizeJson(match[0])));
    } catch (err) {
      console.error("[dsa/problem]", err);
      return NextResponse.json({ error: "Could not generate problem." }, { status: 502 });
    }
  }

  if (action === "feedback") {
    if (!problem?.title) return NextResponse.json({ error: "Problem is required." }, { status: 400 });

    const prompt = `You are an expert coding interviewer. Evaluate this candidate's solution and approach.

Problem: ${problem.title}
${problem.description}
Time complexity target: ${problem.timeComplexityTarget || "optimal"}
Space complexity target: ${problem.spaceComplexityTarget || "optimal"}

Candidate's code:
\`\`\`
${userSolution?.trim() || "(no code provided)"}
\`\`\`

Candidate's explanation of their approach:
${userApproach?.trim() || "(no explanation provided)"}

Evaluate the approach and code thoroughly. Identify actual complexity achieved.

Return ONLY valid JSON (all strings on ONE LINE — no literal newlines):
{
  "approachCorrect": <true|false>,
  "solutionCorrect": <true|false — if code was provided>,
  "timeComplexity": "<actual complexity e.g. O(n²)>",
  "spaceComplexity": "<actual space complexity>",
  "complexityFeedback": "<is their complexity correct? what is the optimal? why?>",
  "approachFeedback": "<specific feedback on their reasoning and explanation>",
  "codeQuality": "<feedback on readability, naming, edge cases — or note if no code provided>",
  "optimizedApproach": "<brief description of the most efficient approach>",
  "modelSolution": "<clean model solution in Python — well commented, readable>",
  "optimizations": ["<specific optimization 1>", "<optimization 2>"],
  "strengths": ["<what they did well 1>", "<strength 2>"],
  "interviewTips": ["<tip for explaining this in an interview>", "<tip 2>"]
}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.35,
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
      console.error("[dsa/feedback]", err);
      return NextResponse.json({ error: "Could not evaluate solution." }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
