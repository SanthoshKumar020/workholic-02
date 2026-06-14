import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGroq } from "@/lib/groq";
import { isUserPro } from "@/lib/plan";
import type { CommunicationResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json({ error: "Communication coach is a Pro feature." }, { status: 403 });
  }

  let body: { text?: string; context?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (text.length < 10) {
    return NextResponse.json({ error: "Please provide text to analyze." }, { status: 400 });
  }

  let result: CommunicationResult;
  try {
    result = await callGroq<CommunicationResult>([
      {
        role: "system",
        content: `You are a professional communication coach. Analyze the provided text for workplace/professional communication effectiveness. Return JSON: { score: 0-100, clarity: 0-100, conciseness: 0-100, tone: "professional"|"informal"|"aggressive"|"passive", fillerWords: ["..."], grammarIssues: ["..."], improvedVersion: "..." }`,
      },
      {
        role: "user",
        content: `Context: ${body.context || "Professional workplace communication"}\n\nText to analyze:\n${text}`,
      },
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json({
    score: typeof result.score === "number" ? Math.round(Math.min(100, Math.max(0, result.score))) : 0,
    clarity: typeof result.clarity === "number" ? Math.round(Math.min(100, Math.max(0, result.clarity))) : 0,
    conciseness: typeof result.conciseness === "number" ? Math.round(Math.min(100, Math.max(0, result.conciseness))) : 0,
    tone: result.tone || "professional",
    fillerWords: Array.isArray(result.fillerWords) ? result.fillerWords : [],
    grammarIssues: Array.isArray(result.grammarIssues) ? result.grammarIssues : [],
    improvedVersion: result.improvedVersion || "",
  });
}
