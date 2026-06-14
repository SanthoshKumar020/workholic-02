import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeJson } from "@/lib/json-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { company, role, applied_date, contact_name, notes } = body;

  if (!company || !role) return NextResponse.json({ error: "Company and role are required." }, { status: 400 });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: "AI not configured." }, { status: 503 });

  const days = applied_date
    ? Math.floor((Date.now() - new Date(applied_date).getTime()) / 86400000)
    : 7;

  const prompt = `Write a professional job application follow-up email.

Company: ${company}
Role: ${role}
Days since applied: ${days}
Contact name: ${contact_name || "Hiring Manager"}
Application notes: ${notes || "none"}

Return ONLY valid JSON (no markdown, no code fences):
{
  "subject": "<concise email subject line>",
  "body": "<complete email body — greeting, 3-4 short paragraphs reiterating interest and asking politely for an update, closing. Professional, warm, not pushy. No placeholder brackets — write it fully.>"
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const groqData = await res.json();
    const text = groqData.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const email = JSON.parse(sanitizeJson(match[0]));
    return NextResponse.json(email);
  } catch (err) {
    console.error("[tracker/follow-up]", err);
    return NextResponse.json({ error: "Could not generate email. Please try again." }, { status: 502 });
  }
}
