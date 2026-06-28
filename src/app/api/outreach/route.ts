import { NextResponse } from "next/server";
import { getGroqKey } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";
import { checkFreeLimit, recordUsage, limitReachedResponse } from "@/lib/usage";
import { sanitizeJson } from "@/lib/json-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { allowed } = await checkFreeLimit(supabase, user.id, user.email, "outreach");
  if (!allowed) return limitReachedResponse();

  const body = await request.json().catch(() => ({}));
  const { yourName, yourRole, yourBackground, targetCompany, targetRole, contactName, mutualConnection, action } = body;

  if (!targetCompany?.trim() || !targetRole?.trim()) {
    return NextResponse.json({ error: "Target company and role are required." }, { status: 400 });
  }

  const ctx = [
    `Your name: ${yourName || "the candidate"}`,
    `Your current/recent role: ${yourRole || "professional"}`,
    `Your background: ${yourBackground || "experienced professional looking for new opportunities"}`,
    `Target company: ${targetCompany}`,
    `Target role: ${targetRole}`,
    `Recipient/Contact: ${contactName || "a ${targetCompany} employee or hiring manager"}`,
    mutualConnection ? `Mutual connection: ${mutualConnection}` : null,
  ].filter(Boolean).join("\n");

  const prompts: Record<string, string> = {
    linkedin_dm: `Write a personalized LinkedIn connection request message.

Context:
${ctx}

Rules:
- MUST be under 300 characters (hard LinkedIn limit — count carefully)
- Mention the company or role specifically — no generic "I'd love to connect"
- Natural and human, not sales-y
- End with one specific question or clear ask

Return ONLY valid JSON:
{
  "message": "<the LinkedIn DM — strictly under 300 characters>",
  "subject": null,
  "charCount": <actual character count of message>,
  "tips": ["<tip to personalize further>", "<tip 2>"]
}`,

    cold_email: `Write a cold outreach email to get a job at ${targetCompany}.

Context:
${ctx}

Rules:
- Subject: under 50 chars, specific and curiosity-inducing
- Body: 3 short paragraphs, under 180 words total
- Open with ONE specific fact about the company (product, news, growth) — NOT a compliment
- State who you are in ONE sentence with your strongest credential
- Make ONE clear ask: 15-min call, referral, or informal chat
- End with an easy reply option like "Would Tuesday or Thursday work?"

Return ONLY valid JSON (use \\n for line breaks in body):
{
  "subject": "<email subject>",
  "message": "<full email body with \\n between paragraphs>",
  "tips": ["<tip to increase reply rate>", "<tip 2>"]
}`,

    referral: `Write a referral request message to someone at ${targetCompany}.

Context:
${ctx}

Rules:
- Brief and respectful — under 150 words
- Acknowledge they are doing a favour
- Be specific about the role and why you want to join ${targetCompany}
- Make it easy to say yes: one clear ask (submit referral / forward resume / intro to hiring manager)
- Mention that you'll send your resume separately

Return ONLY valid JSON (use \\n for paragraph breaks):
{
  "subject": "<subject line for email/LinkedIn message>",
  "message": "<full referral ask message with \\n between paragraphs>",
  "tips": ["<tip to increase referral success rate>", "<tip 2>"]
}`,
  };

  const prompt = prompts[action as string];
  if (!prompt) return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getGroqKey()}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 700,
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const d = await res.json();
    const text = d.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    await recordUsage(supabase, user.id, "outreach");
    return NextResponse.json(JSON.parse(sanitizeJson(match[0])));
  } catch (err) {
    console.error("[outreach]", err);
    return NextResponse.json({ error: "Could not generate message." }, { status: 502 });
  }
}
