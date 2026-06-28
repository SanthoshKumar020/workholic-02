import { NextResponse } from "next/server";
import { getGroqKey } from "@/lib/groq";
import { sanitizeJson } from "@/lib/json-utils";
import { createClient } from "@/lib/supabase/server";
import { checkFreeLimit, recordUsage, limitReachedResponse } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { allowed } = await checkFreeLimit(supabase, user.id, user.email, "aptitude");
  if (!allowed) return limitReachedResponse();

  const body = (await request.json().catch(() => ({}))) as {
    topicId?: string;
    topicTitle?: string;
    difficulty?: string;
  };

  const topicTitle = (body.topicTitle || "").trim();
  if (!topicTitle) return NextResponse.json({ error: "Topic is required." }, { status: 400 });

  const groqKey = getGroqKey();
  if (!groqKey) return NextResponse.json({ error: "AI not configured." }, { status: 503 });

  const prompt = `You are an expert aptitude exam question setter for competitive exams (SSC, Banking, CAT, UPSC, placements).

Generate exactly 5 multiple-choice questions on the topic: "${topicTitle}"

Mix difficulty: 2 easy, 2 medium, 1 hard.

Return ONLY valid JSON (no markdown, no code fences) in this exact structure:

{
  "questions": [
    {
      "question": "<clear exam-style question — include numbers/values>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correctIndex": <0-3, the index of the correct option>,
      "explanation": "<clear step-by-step explanation of why the answer is correct in 2-3 sentences>",
      "difficulty": "<easy|medium|hard>"
    }
  ]
}

Rules:
- Questions must be numeric/calculation-based (not just definitions)
- No trick/ambiguous questions — one clearly correct answer
- Options should be plausible (common wrong answers based on typical mistakes)
- Explanation must show the method, not just state the answer
- Keep ALL strings on ONE LINE — no literal newlines inside JSON strings
- correctIndex must be a number (0, 1, 2, or 3)`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 2500,
      }),
      signal: AbortSignal.timeout(40000),
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);
    const groqData = await res.json();
    const text = groqData.choices?.[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const data = JSON.parse(sanitizeJson(jsonMatch[0]));
    await recordUsage(supabase, user.id, "aptitude");
    return NextResponse.json({ questions: data.questions ?? [] });
  } catch (err) {
    console.error("[aptitude/quiz]", err);
    return NextResponse.json({ error: "Could not generate quiz. Please try again." }, { status: 502 });
  }
}
