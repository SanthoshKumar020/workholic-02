import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/lib/plan";
import { getDomainTopic } from "@/lib/domains/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mark a domain topic mastered, keep the best stars, and award XP. */
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { domain, topic, stars } = await request.json().catch(() => ({}));
  if (!getDomainTopic(String(domain), String(topic))) {
    return NextResponse.json({ error: "Unknown topic." }, { status: 400 });
  }
  const newStars = Math.max(0, Math.min(3, Number(stars) || 0));

  const { data: existing } = await supabase
    .from("domain_progress")
    .select("stars")
    .eq("user_id", user.id)
    .eq("domain", domain)
    .eq("topic", topic)
    .maybeSingle();

  const bestStars = Math.max(existing?.stars ?? 0, newStars);
  const firstTime = !existing;

  const { error } = await supabase.from("domain_progress").upsert(
    { user_id: user.id, domain, topic, stars: bestStars, status: "mastered", updated_at: new Date().toISOString() },
    { onConflict: "user_id,domain,topic" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await awardXp(user.id, (firstTime ? 25 : 0) + newStars * 8);
  return NextResponse.json({ ok: true, stars: bestStars, firstTime });
}
