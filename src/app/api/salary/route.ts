import { NextResponse } from "next/server";
import { getGroqKey } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";
import { isUserPro } from "@/lib/plan";
import { sanitizeJson } from "@/lib/json-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function groq(prompt: string, maxTokens = 1500) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getGroqKey()}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(35000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const d = await res.json();
  return d.choices?.[0]?.message?.content ?? "";
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json({ error: "Salary Coach is a Pro feature." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { action } = body;

  // ── Market Data ───────────────────────────────────────────────────────────
  if (action === "market") {
    const { role, location, experience, companySize } = body;
    const prompt = `You are a compensation expert with up-to-date salary data for ${location || "India"}.

Provide realistic salary ranges for: ${role}
Location: ${location || "India (major cities)"}
Experience: ${experience || "3-5 years"}
Company size: ${companySize || "mid-size"}

Return ONLY valid JSON:
{
  "role": "${role}",
  "location": "${location}",
  "currency": "<INR or USD>",
  "ranges": {
    "p25": <number — 25th percentile annual salary>,
    "median": <number — 50th percentile>,
    "p75": <number — 75th percentile>,
    "top10": <number — top 10% earners>
  },
  "totalComp": {
    "base": "<range string>",
    "bonus": "<typical bonus % or amount>",
    "equity": "<stock/ESOP typical range if applicable>",
    "totalNote": "<one sentence on total compensation>"
  },
  "byCompanyType": [
    { "type": "Startup (Series A-B)", "range": "<range>" },
    { "type": "Mid-size product company", "range": "<range>" },
    { "type": "Large MNC", "range": "<range>" },
    { "type": "FAANG/Top tier", "range": "<range>" }
  ],
  "factors": ["<factor that increases salary 1>", "<factor 2>", "<factor 3>"],
  "negotiationTip": "<one specific tip for negotiating this role's salary>"
}`;

    try {
      const text = await groq(prompt, 1200);
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(sanitizeJson(match[0])));
    } catch (err) {
      console.error("[salary/market]", err);
      return NextResponse.json({ error: "Could not fetch market data." }, { status: 502 });
    }
  }

  // ── Negotiation Script ────────────────────────────────────────────────────
  if (action === "script") {
    const { scenario, role, currentSalary, targetSalary, offerAmount, hasCompeting } = body;
    const prompt = `You are an expert salary negotiation coach. Write a complete negotiation script.

Scenario: ${scenario}
Role: ${role}
${currentSalary ? `Current salary: ${currentSalary}` : ""}
${offerAmount ? `Offer received: ${offerAmount}` : ""}
${targetSalary ? `Target salary: ${targetSalary}` : ""}
${hasCompeting ? "Has a competing offer: Yes" : ""}

Return ONLY valid JSON:
{
  "scenario": "${scenario}",
  "opener": "<exact opening line to say — ready to speak>",
  "keyPhrases": ["<powerful phrase 1>", "<phrase 2>", "<phrase 3>", "<phrase 4>"],
  "script": "<full 5-7 sentence script they can say word-for-word. Natural, confident, not aggressive.>",
  "objections": [
    { "objection": "<common pushback they may face>", "response": "<how to handle it>" },
    { "objection": "<second objection>", "response": "<response>" }
  ],
  "doNot": ["<mistake to avoid 1>", "<mistake 2>", "<mistake 3>"],
  "followUp": "<what to say if they say they need time to think>"
}`;

    try {
      const text = await groq(prompt, 1500);
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(sanitizeJson(match[0])));
    } catch (err) {
      console.error("[salary/script]", err);
      return NextResponse.json({ error: "Could not generate script." }, { status: 502 });
    }
  }

  // ── Role Play ─────────────────────────────────────────────────────────────
  if (action === "roleplay") {
    const { messages, role, offerAmount, targetSalary, companyName } = body;

    const systemPrompt = `You are a hiring manager at ${companyName || "a tech company"} offering ${offerAmount || "a salary"} for a ${role || "role"}. The candidate wants ${targetSalary || "more"}.

Play the realistic hiring manager:
- Start with an initial offer (slightly below the candidate's target)
- Be professional but firm — don't immediately cave to any demand
- Ask for justification when the candidate pushes back
- You can offer non-salary benefits (extra leave, WFH flexibility, early review) as alternatives
- If candidate is reasonable and professional, you can go up 5-10% over 2-3 turns
- Keep responses SHORT (2-4 sentences) — realistic conversation
- If candidate makes unreasonable demands, politely push back
- After 6+ turns, offer to "check with the team" and make a final offer`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...(messages ?? []),
    ];

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getGroqKey()}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 300,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const d = await res.json();
      return NextResponse.json({ message: d.choices?.[0]?.message?.content ?? "" });
    } catch (err) {
      console.error("[salary/roleplay]", err);
      return NextResponse.json({ error: "Could not respond." }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
