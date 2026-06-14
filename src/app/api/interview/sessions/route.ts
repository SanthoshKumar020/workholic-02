import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { role?: string; questions?: unknown[]; answers?: unknown[]; overall_score?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: user.id,
      role: body.role || "Unknown",
      questions: body.questions || [],
      answers: body.answers || [],
      overall_score: body.overall_score ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award XP for completing an interview session
  await awardXp(user.id, 20);

  return NextResponse.json({ session: data });
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data, error } = await supabase
    .from("interview_sessions")
    .select("id, role, overall_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data || [] });
}
