import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGroqText } from "@/lib/groq";
import { isUserPro } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan, xp").eq("id", user.id).single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json({ error: "Cover letter generation is a Pro feature." }, { status: 403 });
  }

  let body: { resumeText?: string; jobDescription?: string; tone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const resumeText = (body.resumeText || "").trim();
  const jobDescription = (body.jobDescription || "").trim();
  if (resumeText.length < 20 || jobDescription.length < 20) {
    return NextResponse.json({ error: "Please provide both resume and job description." }, { status: 400 });
  }

  let coverLetter: string;
  try {
    coverLetter = await callGroqText([
      {
        role: "system",
        content: `You are a professional cover letter writer. Write a compelling, personalized cover letter based on the resume and job description. The tone should be ${body.tone || "professional and enthusiastic"}. Keep it to 3-4 paragraphs. Do not use placeholders like [Company Name] — extract the company name from the job description if available, otherwise use "your company". Do not invent facts.`,
      },
      {
        role: "user",
        content: `RESUME:\n${resumeText.slice(0, 3000)}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 2000)}`,
      },
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Cover letter generation failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Award XP
  await supabase
    .from("profiles")
    .update({ xp: ((profile as {xp?: number})?.xp ?? 0) + 10, last_active: new Date().toISOString() })
    .eq("id", user.id)
    .then(() => null, () => null);

  return NextResponse.json({ coverLetter });
}
