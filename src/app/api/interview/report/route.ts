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
  const { role, company, interviewType, level, answers } = body as {
    role: string;
    company?: string;
    interviewType?: string;
    level?: string;
    answers: { question: string; transcript: string; duration: number; wpm: number; fillerCount: number; fillerWords: string[] }[];
  };

  if (!answers?.length) return NextResponse.json({ error: "No answers provided." }, { status: 400 });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: "AI not configured." }, { status: 503 });

  const answersBlock = answers.map((a, i) =>
    `Q${i + 1}: ${a.question}\nAnswer (${a.wpm} WPM, ${a.duration}s, ${a.fillerCount} filler words [${a.fillerWords.join(", ")}]): ${a.transcript || "(no answer given)"}`
  ).join("\n\n");

  const prompt = `You are an expert interview coach. Evaluate this ${level ?? "mid"}-level ${role} interview${company ? ` at ${company}` : ""}.

Interview type: ${interviewType ?? "mixed"}

Candidate's answers:
${answersBlock}

Score each answer and the overall interview. Be specific and honest — not overly positive.

Return ONLY valid JSON:
{
  "overallScore": <0-100>,
  "grade": "<A|B|C|D|F>",
  "headline": "<one sentence overall verdict>",
  "competencies": [
    { "name": "Communication", "score": <0-100>, "feedback": "<specific observation>" },
    { "name": "Technical Depth", "score": <0-100>, "feedback": "<specific observation>" },
    { "name": "STAR Structure", "score": <0-100>, "feedback": "<specific observation>" },
    { "name": "Confidence & Pacing", "score": <0-100>, "feedback": "<specific observation>" },
    { "name": "Relevance & Specificity", "score": <0-100>, "feedback": "<specific observation>" }
  ],
  "answers": [
    {
      "question": "<question text>",
      "score": <0-100>,
      "pacing": "<too slow|good|slightly fast|too fast>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
      "modelAnswer": "<a strong 3-4 sentence model answer for this question>"
    }
  ],
  "fillerWordSummary": "<one sentence about their filler word usage overall>",
  "summary": {
    "strengths": ["<top strength 1>", "<top strength 2>", "<top strength 3>"],
    "areasToImprove": ["<area 1>", "<area 2>", "<area 3>"],
    "nextSteps": ["<specific action to take before next interview 1>", "<action 2>", "<action 3>"]
  }
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(50000),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const groqData = await res.json();
    const text = groqData.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const report = JSON.parse(sanitizeJson(match[0]));

    // Save session to DB
    await supabase.from("interview_sessions").insert({
      user_id: user.id,
      role,
      questions: answers.map((a) => ({ text: a.question })),
      answers: answers.map((a) => ({ answer: a.transcript })),
      feedback: { overallScore: report.overallScore, grade: report.grade },
    }).select().single();

    return NextResponse.json({ report });
  } catch (err) {
    console.error("[interview/report]", err);
    return NextResponse.json({ error: "Could not generate report." }, { status: 502 });
  }
}
