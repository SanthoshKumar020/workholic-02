import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { name, email, subject, message } = await req.json().catch(() => ({}));

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200),
    subject: String(subject).slice(0, 200),
    message: String(message).slice(0, 5000),
  });

  if (error) {
    console.error("[contact]", error.message);
    return NextResponse.json({ error: "Failed to send message. Please email us directly at support@swache.in" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
