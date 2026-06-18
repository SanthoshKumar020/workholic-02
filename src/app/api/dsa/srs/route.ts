import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sm2, dueDateFrom, SRS_DEFAULT } from "@/lib/dsa/srs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Record a recall result and reschedule it with SM-2.
 * Body: { item_id, item_type?, quality (0–5) }.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const itemId = String(body.item_id ?? "").slice(0, 120);
  const itemType = String(body.item_type ?? "recall").slice(0, 40);
  const quality = Number(body.quality);
  if (!itemId || Number.isNaN(quality)) {
    return NextResponse.json({ error: "item_id and quality are required." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("dsa_srs")
    .select("ease, interval, repetitions")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .maybeSingle();

  const prev = existing
    ? { ease: existing.ease, interval: existing.interval, repetitions: existing.repetitions }
    : SRS_DEFAULT;
  const next = sm2(prev, quality);

  const { error } = await supabase.from("dsa_srs").upsert(
    {
      user_id: user.id,
      item_id: itemId,
      item_type: itemType,
      ease: next.ease,
      interval: next.interval,
      repetitions: next.repetitions,
      due_date: dueDateFrom(next.dueInDays),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_id" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, dueInDays: next.dueInDays });
}
