import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkFreeLimit, recordUsage, limitReachedResponse } from "@/lib/usage";
import { callGroq } from "@/lib/groq";
import type { MatchResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in to use Match." }, { status: 401 });
  const { allowed } = await checkFreeLimit(supabase, user.id, user.email, "match");
  if (!allowed) return limitReachedResponse();

  let body: { resumeText?: string; jobDescription?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const resumeText = (body.resumeText || "").trim();
  const jobDescription = (body.jobDescription || "").trim();

  if (resumeText.length < 20 || jobDescription.length < 20) {
    return NextResponse.json({ error: "Please provide both a resume and job description." }, { status: 400 });
  }

  const isPro = user
    ? (await supabase.from("profiles").select("plan").eq("id", user.id).single()).data?.plan === "pro"
    : false;

  let result: MatchResult;
  try {
    const raw = await callGroq<MatchResult>([
      {
        role: "system",
        content: `You are an ATS and hiring expert. Analyze how well a resume matches a job description. Return JSON: matchScore (0-100 integer), matchedKeywords (string array of keywords present in both), missingKeywords (string array of important keywords from JD missing in resume), tips (string array of 3-5 actionable improvements — if isPro is false, return only 1 generic tip, otherwise return 5 specific tips).`,
      },
      {
        role: "user",
        content: `isPro: ${isPro}\n\nRESUME:\n${resumeText.slice(0, 3000)}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 2000)}`,
      },
    ]);
    result = raw;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Match analysis failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  await recordUsage(supabase, user.id, "match");
  return NextResponse.json({
    matchScore: typeof result.matchScore === "number" ? Math.round(Math.min(100, Math.max(0, result.matchScore))) : 0,
    matchedKeywords: Array.isArray(result.matchedKeywords) ? result.matchedKeywords : [],
    missingKeywords: Array.isArray(result.missingKeywords) ? result.missingKeywords : [],
    tips: isPro ? (Array.isArray(result.tips) ? result.tips : []) : [],
    isPro,
  });
}
