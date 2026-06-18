import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Record a solved practice problem and award XP (first solve only). */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { problemId, stars } = await request.json().catch(() => ({}));
  if (!problemId || typeof problemId !== "string") {
    return NextResponse.json({ error: "problemId required." }, { status: 400 });
  }
  const earned = Math.max(1, Math.min(3, Number(stars) || 1));

  // First solve of this exact problem? (avoid XP farming by replaying)
  const { data: prior } = await supabase
    .from("dsa_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("problem_id", problemId)
    .eq("passed", true)
    .limit(1);
  const firstTime = !prior || prior.length === 0;

  await supabase.from("dsa_attempts").insert({ user_id: user.id, problem_id: problemId, passed: true });
  if (firstTime) await awardXp(user.id, 6 + earned * 8);

  return NextResponse.json({ ok: true, firstTime });
}
