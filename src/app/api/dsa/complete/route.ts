import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/lib/plan";
import { getIsland } from "@/lib/dsa/curriculum";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mark an island mastered: upsert dsa_progress, keep the best star count,
 * and award XP/streak into the existing profiles gamification.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { topic, stars } = await request.json().catch(() => ({}));
  if (!getIsland(String(topic))) return NextResponse.json({ error: "Unknown topic." }, { status: 400 });
  const newStars = Math.max(0, Math.min(3, Number(stars) || 0));

  // Keep the best stars ever earned for this topic.
  const { data: existing } = await supabase
    .from("dsa_progress")
    .select("stars")
    .eq("user_id", user.id)
    .eq("topic", topic)
    .maybeSingle();

  const bestStars = Math.max(existing?.stars ?? 0, newStars);
  const firstTime = !existing;

  const { error } = await supabase.from("dsa_progress").upsert(
    {
      user_id: user.id,
      topic,
      stars: bestStars,
      mastery: 100,
      status: "mastered",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,topic" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // XP: 30 the first time you master an island, plus 10 per star earned this run.
  await awardXp(user.id, (firstTime ? 30 : 0) + newStars * 10);

  return NextResponse.json({ ok: true, stars: bestStars, firstTime });
}
