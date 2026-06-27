import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("email_subscribers")
    .upsert({ email: email.toLowerCase().trim(), subscribed_at: new Date().toISOString() }, {
      onConflict: "email",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error("[subscribe]", error.message);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
