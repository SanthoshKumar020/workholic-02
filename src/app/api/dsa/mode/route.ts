import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODES = ["kid", "beginner", "interview"];

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { mode } = await request.json().catch(() => ({}));
  if (!MODES.includes(mode)) return NextResponse.json({ error: "Invalid mode." }, { status: 400 });

  const { error } = await supabase.from("profiles").update({ dsa_mode: mode }).eq("id", user.id);
  if (error) {
    // Most common cause: migration 004 not applied yet (profiles.dsa_mode missing).
    console.error("[dsa/mode]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode });
}
