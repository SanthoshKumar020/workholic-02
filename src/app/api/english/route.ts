import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGroq, callGroqText } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { mode?: string; level?: string; topic?: string; userMessage?: string; history?: Array<{role: string; content: string}> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mode = body.mode || "lesson";
  const level = body.level || "intermediate";
  const topic = body.topic || "business English";

  if (mode === "lesson") {
    const result = await callGroq([
      {
        role: "system",
        content: `You are an English language teacher. Create a short, engaging lesson. Return JSON: { title: "...", content: "...", examples: ["..."], keyPoints: ["..."] }`,
      },
      {
        role: "user",
        content: `Level: ${level}. Topic: ${topic}. Create a focused lesson with 3-4 key points and 3 practical examples.`,
      },
    ]).catch(() => ({ title: "", content: "", examples: [], keyPoints: [] }));
    return NextResponse.json({ lesson: result });
  }

  if (mode === "quiz") {
    const result = await callGroq([
      {
        role: "system",
        content: `You are an English teacher. Create a 5-question multiple choice quiz. Return JSON: { questions: [ { q: "...", options: ["A","B","C","D"], answerIndex: 0, explanation: "..." }, ... ] }`,
      },
      {
        role: "user",
        content: `Level: ${level}. Topic: ${topic}.`,
      },
    ]).catch(() => ({ questions: [] }));
    return NextResponse.json({ quiz: result });
  }

  if (mode === "chat") {
    const userMessage = (body.userMessage || "").trim();
    if (!userMessage) return NextResponse.json({ error: "Please provide a message." }, { status: 400 });

    const history = (body.history || []).slice(-10);
    const reply = await callGroqText([
      {
        role: "system",
        content: `You are a friendly English conversation partner. Respond naturally to the user in English. If the user makes grammar or vocabulary mistakes, gently note the correction at the end of your reply in a small note like "(Note: you could say '...' instead of '...')". Keep responses conversational and encouraging. The user's level is ${level}.`,
      },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: userMessage },
    ]).catch(() => "I'm here to help you practice English! What would you like to talk about?");

    return NextResponse.json({ reply });
  }

  return NextResponse.json({ error: "Invalid mode. Use 'lesson', 'quiz', or 'chat'." }, { status: 400 });
}
