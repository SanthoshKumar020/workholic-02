import { NextResponse } from "next/server";
import { getGroqKey } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";
import { isUserPro } from "@/lib/plan";
import { sanitizeJson } from "@/lib/json-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json({ error: "Pro feature." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { target_role, resume_text, context_summary } = body;

  const groqKey = getGroqKey();
  if (!groqKey) return NextResponse.json({ error: "AI not configured." }, { status: 503 });

  const prompt = `You are an expert career coach. Generate a personalized weekly action plan.

Target Role: ${target_role || "software professional"}
Resume Summary: ${resume_text ? resume_text.slice(0, 800) : "not provided"}
Context: ${context_summary || "first week planning"}

Return ONLY valid JSON (no markdown):
{
  "weekFocus": "<one sentence theme for this week>",
  "days": [
    { "day": "Monday", "tasks": ["<specific task 1>", "<specific task 2>"] },
    { "day": "Tuesday", "tasks": ["<task 1>", "<task 2>"] },
    { "day": "Wednesday", "tasks": ["<task 1>", "<task 2>"] },
    { "day": "Thursday", "tasks": ["<task 1>", "<task 2>"] },
    { "day": "Friday", "tasks": ["<task 1>", "<task 2>"] }
  ],
  "weekendChallenge": "<one meaningful challenge to do over the weekend>",
  "metrics": ["<how to measure success 1>", "<metric 2>"],
  "resources": [
    { "title": "<resource name>", "type": "article|video|practice|book", "why": "<why this helps>" }
  ]
}

Make tasks SPECIFIC and ACTIONABLE — not vague. Example: 'Apply to 3 backend roles on LinkedIn with custom cover letters' not 'Apply to jobs'. Resources should be real (LeetCode, Neetcode, specific YouTube channels, books).`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(35000),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const groqData = await res.json();
    const text = groqData.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const plan = JSON.parse(sanitizeJson(match[0]));

    // Save plan + memory to DB
    await supabase.from("mentor_memory").upsert({
      user_id: user.id,
      target_role: target_role || null,
      resume_text: resume_text || null,
      weekly_plan: JSON.stringify(plan),
      plan_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.json({ plan });
  } catch (err) {
    console.error("[mentor/plan]", err);
    return NextResponse.json({ error: "Could not generate plan. Please try again." }, { status: 502 });
  }
}
