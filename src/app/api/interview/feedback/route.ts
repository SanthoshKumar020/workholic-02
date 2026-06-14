import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGroq } from "@/lib/groq";
import type { InterviewFeedback } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { question?: string; answer?: string; type?: "behavioral" | "technical" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = (body.question || "").trim();
  const answer = (body.answer || "").trim();
  if (!question || !answer) {
    return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
  }

  let result: InterviewFeedback;
  try {
    const isBehavioral = body.type === "behavioral";
    result = await callGroq<InterviewFeedback>([
      {
        role: "system",
        content: `You are a senior interviewer evaluating an interview answer. ${isBehavioral ? "For behavioral questions, evaluate using the STAR framework (Situation, Task, Action, Result)." : "For technical questions, evaluate correctness, depth, and clarity."} Return JSON: { score: 0-100, feedback: "...", strengths: ["..."], improvements: ["..."], modelAnswerHint: "..." }`,
      },
      {
        role: "user",
        content: `Question: ${question}\n\nAnswer: ${answer}`,
      },
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Feedback generation failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json({
    score: typeof result.score === "number" ? Math.round(Math.min(100, Math.max(0, result.score))) : 50,
    feedback: result.feedback || "",
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    improvements: Array.isArray(result.improvements) ? result.improvements : [],
    modelAnswerHint: result.modelAnswerHint || "",
  });
}
