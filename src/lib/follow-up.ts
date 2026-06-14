import { sanitizeJson } from "@/lib/json-utils";

export async function generateFollowUp(app: {
  company: string; role: string; applied_date: string;
  contact_name?: string; notes?: string;
}) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  const days = Math.floor((Date.now() - new Date(app.applied_date).getTime()) / 86400000);

  const prompt = `Write a professional job application follow-up email.

Company: ${app.company}
Role: ${app.role}
Applied: ${days} days ago
Contact: ${app.contact_name || "Hiring Manager"}
Notes: ${app.notes || "none"}

Return ONLY valid JSON:
{
  "subject": "<email subject line>",
  "body": "<full email body — 3-4 short paragraphs, professional and not pushy, reiterate interest, ask for update>"
}`;

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

  if (!res.ok) return null;
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(sanitizeJson(match[0]));
}
