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
  };

  const topicTitle = (body.topicTitle || "").trim();
  if (!topicTitle) return NextResponse.json({ error: "Topic is required." }, { status: 400 });

  const groqKey = getGroqKey();
  if (!groqKey) return NextResponse.json({ error: "AI not configured." }, { status: 503 });

  const prompt = `You are the world's best aptitude and maths teacher. Your style is warm, fun, and crystal clear — even a 5-year-old should understand the first explanation.

Generate a complete lesson on the topic: "${topicTitle}"

Return ONLY valid JSON (no markdown, no code fences) in this exact structure:

{
  "title": "${topicTitle}",
  "tagline": "<one catchy line about why this topic matters for exams and life>",
  "likeIm5": "<explain using a super simple real-life story or analogy — 2-3 sentences. Think: pizza slices, chocolates, toy cars, etc. Make it visual and fun.>",
  "concept": "<proper mathematical explanation in 3-5 sentences. Clear, no jargon.>",
  "formulas": [
    { "name": "<formula name>", "formula": "<the formula>", "note": "<what each variable means in plain English>" }
  ],
  "tricks": [
    { "name": "<trick name>", "shortcut": "<the shortcut method in 1-2 sentences>", "example": "<one quick numeric example showing the trick>" }
  ],
  "workedExamples": [
    {
      "question": "<exam-style question>",
      "steps": ["<step 1 with calculation>", "<step 2>", "<step 3 if needed>"],
      "answer": "<final answer>"
    }
  ],
  "examTips": ["<tip 1 for competitive exam>", "<tip 2>", "<tip 3>"],
  "keyPoints": ["<key point 1>", "<key point 2>", "<key point 3>", "<key point 4>"]
}

Rules:
- formulas: 1-4 formulas (only what's truly needed)
- tricks: 2-4 speed tricks/shortcuts specific to this topic
- workedExamples: exactly 2 examples, different difficulty levels
- examTips: 2-4 tips for SSC/Banking/CAT exams
- keyPoints: 3-5 bullet points for quick revision
- Keep all strings on ONE LINE — no literal newlines inside JSON strings`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);
    const groqData = await res.json();
    const text = groqData.choices?.[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const lesson = JSON.parse(sanitizeJson(jsonMatch[0]));
    await recordUsage(supabase, user.id, "aptitude");
    return NextResponse.json({ lesson });
  } catch (err) {
    console.error("[aptitude/lesson]", err);
    return NextResponse.json({ error: "Could not generate lesson. Please try again." }, { status: 502 });
  }
}
