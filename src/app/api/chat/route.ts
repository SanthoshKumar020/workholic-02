import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGroqText } from "@/lib/groq";
import { isUserPro } from "@/lib/plan";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Check Pro
  const { data: profile } = await supabase.from("profiles").select("plan, target_role").eq("id", user.id).single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json({ error: "Career chat is a Pro feature. Upgrade to access unlimited career guidance." }, { status: 403 });
  }

  let body: { message?: string; history?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = (body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  const history = (body.history || []).slice(-14); // Keep last 7 pairs

  const reply = await callGroqText([
    {
      role: "system",
      content: `You are an experienced career mentor and coach. You help professionals with job searching, career transitions, interview prep, salary negotiation, resume tips, and professional growth. The user's target role is: ${profile?.target_role || "not specified"}. Be specific, practical, and encouraging. Keep responses concise (2-4 paragraphs max).`,
    },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ]).catch(() => "I'm here to help with your career journey! Ask me anything about job searching, interviews, or professional growth.");

  return NextResponse.json({ reply });
}
