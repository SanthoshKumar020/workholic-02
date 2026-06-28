import { NextResponse } from "next/server";
import { getGroqKey } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";
import { isUserPro } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: memory }, { data: messages }] = await Promise.all([
    supabase.from("mentor_memory").select("*").eq("user_id", user.id).single(),
    supabase.from("mentor_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(40),
  ]);

  return NextResponse.json({ memory: memory ?? null, messages: messages ?? [] });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan, full_name").eq("id", user.id).single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json({ error: "AI Career Mentor is a Pro feature." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const userMessage = (body.message ?? "").trim();
  if (!userMessage) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  const groqKey = getGroqKey();
  if (!groqKey) return NextResponse.json({ error: "AI not configured." }, { status: 503 });

  // Fetch memory + recent messages
  const [{ data: memory }, { data: recentMessages }] = await Promise.all([
    supabase.from("mentor_memory").select("*").eq("user_id", user.id).single(),
    supabase.from("mentor_messages").select("role, content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(12),
  ]);

  const systemPrompt = `You are a dedicated AI career mentor for ${profile?.full_name || "this user"}.

What you know about them:
- Target role: ${memory?.target_role || "not specified yet"}
- Resume summary: ${memory?.resume_text ? memory.resume_text.slice(0, 600) + "..." : "not provided yet"}
- Context notes: ${memory?.context_summary || "first session"}
- Current weekly plan: ${memory?.weekly_plan ? memory.weekly_plan.slice(0, 400) : "not generated yet"}

Your style: warm, direct, specific to THEIR situation. Give actionable advice, not generic tips. Ask follow-up questions to understand them better. When you learn something new about them (skills, timeline, concerns), acknowledge it. Reference their resume and goals when relevant. Never give vague answers like "keep applying" — be specific about what to do and when.`;

  const chatHistory = [...(recentMessages ?? [])].reverse();
  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...chatHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const groqData = await res.json();
    const assistantText = groqData.choices?.[0]?.message?.content ?? "";

    // Save both messages to DB
    await supabase.from("mentor_messages").insert([
      { user_id: user.id, role: "user", content: userMessage },
      { user_id: user.id, role: "assistant", content: assistantText },
    ]);

    // Update context summary every 5th user message
    const msgCount = (recentMessages?.length ?? 0);
    if (msgCount % 10 === 0) {
      const summaryRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "Summarize key facts about this job seeker in 3-4 bullet points for a career mentor to use as context. Be specific: skills, concerns, timeline, job search status." },
            ...groqMessages.slice(-6),
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        const summary = summaryData.choices?.[0]?.message?.content ?? "";
        await supabase.from("mentor_memory").upsert({ user_id: user.id, context_summary: summary, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      }
    }

    return NextResponse.json({ message: assistantText });
  } catch (err) {
    console.error("[mentor]", err);
    return NextResponse.json({ error: "Could not respond. Please try again." }, { status: 502 });
  }
}
