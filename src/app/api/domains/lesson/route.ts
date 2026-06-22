import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDomainTopic } from "@/lib/domains/catalog";
import { sanitizeJson } from "@/lib/json-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Mode = "kid" | "beginner" | "interview";

function voiceFor(mode: Mode) {
  if (mode === "kid")
    return "Audience: a curious 12-year-old beginner. Use a friendly real-world analogy, very simple words, short sentences, and an emoji or two. Keep it light and encouraging.";
  if (mode === "interview")
    return "Audience: someone preparing for a job interview in this field. Be precise and practical: real tools, trade-offs, and what an interviewer expects. Include interviewTips.";
  return "Audience: a motivated beginner. Plain English, a helpful analogy, and clear step-by-step understanding.";
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const mode: Mode = ["kid", "beginner", "interview"].includes(body.mode) ? body.mode : "beginner";
  const found = getDomainTopic(String(body.domain), String(body.topic));
  if (!found) return NextResponse.json({ error: "Unknown topic." }, { status: 400 });
  const { domain, topic } = found;

  const system = `You are Bit, a warm, gamified tutor. Teach ONE topic clearly and make it stick.
${voiceFor(mode)}
Return ONLY valid JSON (all strings on ONE line, no literal newlines inside strings) with EXACTLY this shape:
{
  "analogy": "<one short real-world analogy that builds intuition>",
  "concept": "<2-4 sentence clear explanation>",
  "keyPoints": ["<key point>", "<key point>", "<key point>", "<key point>"],
  "steps": ["<step or sub-idea>", "<step>", "<step>"],
  "diagram": { "title": "<short>", "nodes": [{"id":"a","label":"<short>"},{"id":"b","label":"<short>"}], "edges": [{"from":"a","to":"b","label":"<optional>"}] },
  "chart": { "title": "<short>", "unit": "", "data": [{"label":"<short>","value": <number>}, {"label":"<short>","value": <number>}] },
  "realWorld": "<1-2 sentences on where this is used in industry>",
  "interviewTips": ["<tip>", "<tip>"],
  "quiz": [{"question":"<q>","options":["<a>","<b>","<c>","<d>"],"correctIndex":0,"explanation":"<why>"}]
}
Rules: diagram nodes MUST be in left-to-right flow order with mostly linear edges (a->b->c). chart.data: 3-6 simple comparative numbers relevant to the topic. quiz: exactly 4 questions, each with 4 options and a correct 0-based index. If a diagram or chart doesn't fit the topic, set it to null.`;

  const prompt = `Domain: ${domain.name}\nTopic: ${topic.title}\nWhat it covers: ${topic.blurb}\nWrite the lesson now.`;

  async function call(retry = false): Promise<Response> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 2200,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.status === 429 && !retry) {
      await new Promise((r) => setTimeout(r, 2500));
      return call(true);
    }
    return res;
  }

  try {
    const res = await call();
    if (res.status === 429) return NextResponse.json({ error: "Bit is busy right now — try again in a few seconds. 🤖" }, { status: 503 });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const d = await res.json();
    const text = d.choices?.[0]?.message?.content ?? "{}";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const lesson = JSON.parse(sanitizeJson(match[0]));
    if (!Array.isArray(lesson.quiz)) lesson.quiz = [];
    return NextResponse.json({ lesson });
  } catch (err) {
    console.error("[domains/lesson]", err);
    return NextResponse.json({ error: "Couldn't generate this lesson. Please try again." }, { status: 502 });
  }
}
