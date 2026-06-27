import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkFreeLimit, recordUsage, limitReachedResponse } from "@/lib/usage";
import { callGroq } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in to use ATS Check." }, { status: 401 });
  const { allowed } = await checkFreeLimit(supabase, user.id, user.email, "ats-check");
  if (!allowed) return limitReachedResponse();

  let body: { resumeText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const resumeText = (body.resumeText || "").trim();
  if (resumeText.length < 30) {
    return NextResponse.json({ error: "Please provide resume text (at least 30 characters)." }, { status: 400 });
  }

  let result: { atsScore?: number; improvements?: string[] };
  try {
    result = await callGroq([
      {
        role: "system",
        content: `You are an ATS (Applicant Tracking System) expert. Analyze the resume and return a score and improvement tips. Return JSON: { atsScore: 0-100, improvements: ["tip1", "tip2", "tip3", "tip4", "tip5"] }. Score based on: keyword density, formatting, contact info, measurable achievements, action verbs, section headers.`,
      },
      {
        role: "user",
        content: `Analyze this resume for ATS compatibility:\n\n${resumeText.slice(0, 4000)}`,
      },
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ATS check failed. Please try again.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  await recordUsage(supabase, user.id, "ats-check");
  return NextResponse.json({
    atsScore: typeof result?.atsScore === "number" ? Math.round(Math.min(100, Math.max(0, result.atsScore))) : 50,
    improvements: Array.isArray(result?.improvements) ? result.improvements.slice(0, 5) : [],
  });
}
