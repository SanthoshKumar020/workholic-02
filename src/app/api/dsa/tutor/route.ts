import { NextResponse } from "next/server";
import { getGroqKey } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { sanitizeJson } from "@/lib/json-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FREE_DAILY_LIMIT = 5;

type Mode = "kid" | "beginner" | "interview";

function systemFor(mode: Mode, type: "eli10" | "why") {
  const base =
    "You are Bit, a cheerful little robot tutor inside a kids-and-adults DSA learning app. " +
    "You give PROGRESSIVE hints — never the full answer first; nudge toward discovery. " +
    "You are always warm and encouraging and you NEVER say 'wrong' — you say things like \"Almost! Let's look again 🙂\".";
  const voice =
    mode === "kid"
      ? "Audience: a curious 10-year-old with zero coding background. Use a friendly real-world analogy, very short sentences, simple words, and one or two emoji. No code. Never condescending."
      : mode === "beginner"
        ? "Audience: a beginner. Plain English, a quick analogy, short steps. You may mention code ideas but keep it light."
        : "Audience: someone preparing for coding interviews. Be precise: mention complexity, edge cases, and the underlying idea, but still lead with a hint, not the full solution.";
  const lens =
    type === "why"
      ? "The learner asked WHY this works — focus on the underlying reason/intuition."
      : "Explain like the learner is 10 wherever possible — lead with the simplest mental picture.";
  return `${base}\n${voice}\n${lens}\nReturn ONLY valid JSON (strings on one line, no literal newlines): {"reply":"<your warm hint>","followUp":"<a short question to keep them thinking>"}`;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const profile = await getCurrentProfile();
  const pro = isUserPro(profile?.plan, profile?.email);

  // Free-tier daily limit on tutor messages.
  if (!pro) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("dsa_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("problem_id", "tutor")
      .gte("created_at", since.toISOString());
    if ((count ?? 0) >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          reply:
            "You've used today's free hints from me! 🤖 Upgrade to Pro for unlimited help — or come back tomorrow and we'll keep going. 💜",
          limited: true,
        },
        { status: 200 },
      );
    }
  }

  const body = await request.json().catch(() => ({}));
  const mode: Mode = ["kid", "beginner", "interview"].includes(body.mode) ? body.mode : "beginner";
  const type: "eli10" | "why" = body.type === "why" ? "why" : "eli10";
  const topic = String(body.topic ?? "data structures").slice(0, 120);
  const question = String(body.question ?? "").slice(0, 1000);
  const hintLevel = Math.max(1, Math.min(3, Number(body.hintLevel) || 1));
  if (!question.trim()) return NextResponse.json({ error: "Ask me something!" }, { status: 400 });

  const userMsg = `Topic: ${topic}\nHint level so far: ${hintLevel} (escalate only a little; reveal more than last time but not the whole answer).\nLearner's question: ${question}`;

  async function call(retrying = false): Promise<Response> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getGroqKey()}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemFor(mode, type) },
          { role: "user", content: userMsg },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (res.status === 429 && !retrying) {
      await new Promise((r) => setTimeout(r, 2500));
      return call(true);
    }
    return res;
  }

  try {
    const res = await call();
    if (res.status === 429) {
      return NextResponse.json(
        { reply: "Lots of learners are asking me things right now! 🤖 Give me a few seconds and try again.", retry: true },
        { status: 200 },
      );
    }
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const d = await res.json();
    const text = d.choices?.[0]?.message?.content ?? "{}";
    let parsed: { reply?: string; followUp?: string } = {};
    try {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(sanitizeJson(match[0])) : {};
    } catch {
      parsed = {};
    }
    const reply = parsed.reply?.trim() || "Let's think about it together — what's the very first step you'd try? 🙂";

    // Log the message for the daily limiter (and future analytics).
    await supabase.from("dsa_attempts").insert({ user_id: user.id, problem_id: "tutor", passed: true });

    return NextResponse.json({ reply, followUp: parsed.followUp ?? null });
  } catch (err) {
    console.error("[dsa/tutor]", err);
    return NextResponse.json(
      { reply: "Oops, my circuits hiccuped! 🤖 Try asking me again in a moment.", error: true },
      { status: 200 },
    );
  }
}
