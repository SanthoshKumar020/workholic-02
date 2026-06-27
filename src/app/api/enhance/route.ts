import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGroq } from "@/lib/groq";
import { FREE_TEMPLATE_ID, isPro } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  let body: { name?: string; email?: string; targetRole?: string; resumeText?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const resumeText = (body.resumeText || "").trim();
  if (resumeText.length < 30) {
    return NextResponse.json(
      { error: "Please provide your resume details or text to enhance." },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, xp")
    .eq("id", user.id)
    .single();

  let result: { enhancedResume?: string; improvements?: string[]; atsScore?: number };
  try {
    result = await callGroq([
      {
        role: "system",
        content: [
          "You are an expert resume writer and ATS optimization specialist.",
          "Rewrite and enhance the resume the user provides. Rules:",
          "- Use strong action verbs and quantified achievements.",
          "- Tailor content toward the target role if provided.",
          "- Do NOT invent facts; only rephrase and restructure what is given.",
          "- Preserve all section headings, contact details, and structure from the original.",
          "",
          "You MUST respond with ONLY a valid JSON object — no markdown, no explanation, no code fences.",
          "JSON schema: { \"enhancedResume\": string, \"improvements\": string[], \"atsScore\": number }",
          "- enhancedResume: the full rewritten resume as plain text",
          "- improvements: 3 to 5 short bullet points describing what was improved",
          "- atsScore: integer 0–100 estimating ATS compatibility",
        ].join("\n"),
      },
      {
        role: "user",
        content: `Target Role: ${body.targetRole || "Not specified"}\n\nResume:\n${resumeText}`,
      },
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Enhancement service unavailable. Please try again.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const enhancedText = (result?.enhancedResume ?? "").trim() || resumeText;
  const atsScore = typeof result?.atsScore === "number" ? Math.round(Math.min(100, Math.max(0, result.atsScore))) : null;
  const improvements = Array.isArray(result?.improvements) ? result.improvements : [];

  const { data: saved, error: saveError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: body.title?.trim() || `${body.targetRole || "Resume"} — ${new Date().toLocaleDateString()}`,
      target_role: body.targetRole || null,
      original_text: resumeText,
      enhanced_text: enhancedText,
      ats_score: atsScore,
      template_id: FREE_TEMPLATE_ID,
    })
    .select()
    .single();

  // Award XP for enhancement
  await supabase
    .from("profiles")
    .update({ xp: ((profile as { xp?: number })?.xp ?? 0) + 10, last_active: new Date().toISOString() })
    .eq("id", user.id)
    .then(() => null, () => null);

  if (saveError) {
    return NextResponse.json(
      {
        warning: "Enhanced your resume but could not save it.",
        enhancedResume: enhancedText,
        improvements,
        atsScore,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    resume: saved,
    enhancedResume: enhancedText,
    improvements,
    atsScore,
    isPro: isPro(profile?.plan),
  });
}
