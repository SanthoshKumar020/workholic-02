import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeJson } from "@/lib/json-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/tracker — list all applications for user
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data ?? [] });
}

// POST /api/tracker — create application
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { company, role, url, location, salary, applied_date, notes, contact_name, contact_email } = body;

  if (!company || !role) return NextResponse.json({ error: "Company and role are required." }, { status: 400 });

  const { data, error } = await supabase
    .from("job_applications")
    .insert({ user_id: user.id, company, role, url, location, salary, applied_date, notes, contact_name, contact_email })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: data });
}

// PATCH /api/tracker — update status or fields
export async function PATCH(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const { data, error } = await supabase
    .from("job_applications")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: data });
}

// DELETE /api/tracker?id=xxx
export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const { error } = await supabase.from("job_applications").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// POST /api/tracker/follow-up — AI draft follow-up email
export { POST as default };

// Named export for follow-up (separate route handles this)
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
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
