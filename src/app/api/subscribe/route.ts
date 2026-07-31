import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Signups allowed per IP+UA per day. A real person needs one. */
const SUBSCRIBE_DAILY_LIMIT = 3;

/**
 * Stricter than `includes("@")`. This endpoint is anonymous and writes with the
 * service-role key, and /api/cron/newsletter later emails everything in the
 * table from our verified domain — so junk rows here turn the weekly cron into
 * a mailbomb sent in HYRISE's name.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export async function POST(req: Request) {
  const { allowed, retryAfter } = await rateLimit(
    clientKey(req, "subscribe"),
    SUBSCRIBE_DAILY_LIMIT
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many signups from this device today." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  if (normalized.length > 254 || !EMAIL_RE.test(normalized)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("email_subscribers")
    .upsert(
      { email: normalized, subscribed_at: new Date().toISOString() },
      { onConflict: "email", ignoreDuplicates: true }
    );

  if (error) {
    console.error("[subscribe]", error.message);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
