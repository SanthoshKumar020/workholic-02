import { NextResponse } from "next/server";
import { getGroqKey } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";
import { sanitizeJson } from "@/lib/json-utils";
import { checkFreeLimit, recordUsage, limitReachedResponse } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { allowed } = await checkFreeLimit(supabase, user.id, user.email, "gd");
  if (!allowed) return limitReachedResponse();

  const body = await request.json().catch(() => ({}));
  const { action, category, topic, transcript } = body;

  if (action === "topic") {
    const prompt = `Generate a Group Discussion (GD) topic for the category: ${category || "General"}.

The topic should be:
- Debatable with at least 2-3 valid perspectives
- Current and relevant for 2024-2025 professional/campus GD rounds
- Thought-provoking but not too niche
- Suitable for a 2-minute spoken response

Return ONLY valid JSON (all strings on ONE LINE — no literal newlines):
{
  "topic": "<the GD topic — concise and thought-provoking>",
  "category": "${category || "General"}",
  "context": "<2-3 sentence background to help the candidate understand the topic>",
  "keyAngles": ["<perspective/angle to consider 1>", "<angle 2>", "<angle 3>", "<angle 4>"]
}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getGroqKey()}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.9,
          max_tokens: 600,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const d = await res.json();
      const text = d.choices?.[0]?.message?.content ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      await recordUsage(supabase, user.id, "gd");
      return NextResponse.json(JSON.parse(sanitizeJson(match[0])));
    } catch (err) {
      console.error("[gd/topic]", err);
      return NextResponse.json({ error: "Could not generate topic." }, { status: 502 });
    }
  }

  if (action === "feedback") {
    if (!transcript?.trim() || !topic) {
      return NextResponse.json({ error: "Topic and response are required." }, { status: 400 });
    }

    const prompt = `You are a Group Discussion evaluator at a top company. Evaluate this candidate's GD response.

GD Topic: ${topic}

Candidate's response (transcribed):
${transcript}

Score on 3 dimensions. Be specific and honest — not overly generous.

Return ONLY valid JSON (all strings on ONE LINE — no literal newlines):
{
  "overallScore": <0-100>,
  "fluency": { "score": <0-100>, "feedback": "<specific observation on clarity, vocabulary, pace, fillers>" },
  "structure": { "score": <0-100>, "feedback": "<observation on intro/definition, body points, conclusion>" },
  "content": { "score": <0-100>, "feedback": "<observation on relevance, depth, examples, data, balanced view>" },
  "fillerWordCount": <estimated count of um/uh/like/basically etc.>,
  "strengths": ["<specific strength 1>", "<strength 2>"],
  "improvements": ["<specific improvement 1>", "<improvement 2>", "<improvement 3>"],
  "modelOpening": "<how a top scorer would open this topic — 2-3 sentences ready to speak>",
  "modelResponse": "<how a high-scoring candidate would structure their full 2-minute response — key points they would cover>"
}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getGroqKey()}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const d = await res.json();
      const text = d.choices?.[0]?.message?.content ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      await recordUsage(supabase, user.id, "gd");
      return NextResponse.json(JSON.parse(sanitizeJson(match[0])));
    } catch (err) {
      console.error("[gd/feedback]", err);
      return NextResponse.json({ error: "Could not evaluate response." }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
