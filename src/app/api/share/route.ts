import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Share links created per IP per day. Generous — sharing is what we want. */
const SHARE_DAILY_LIMIT = 20;

/**
 * URL-safe, unguessable, short id (~10 chars of base64url ≈ 60 bits).
 * Short enough to look tidy in a WhatsApp message, random enough that share
 * pages can't be enumerated.
 */
function shortId(): string {
  return randomBytes(8).toString("base64url").slice(0, 10);
}

export async function POST(request: Request) {
  const { allowed, retryAfter } = await rateLimit(clientKey(request, "share"), SHARE_DAILY_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many share links created today. Try again tomorrow." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: {
    score?: number;
    visibleTips?: unknown;
    lockedCount?: number;
    displayName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const score = Math.round(Number(body.score));
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return NextResponse.json({ error: "A valid score is required." }, { status: 400 });
  }

  // Only ever persist the teaser tips that were already on screen — never the
  // resume text itself.
  const visibleTips = Array.isArray(body.visibleTips)
    ? body.visibleTips
        .filter((t): t is string => typeof t === "string")
        .slice(0, 3)
        .map((t) => t.slice(0, 240))
    : [];

  const lockedCount = Math.max(0, Math.min(20, Math.round(Number(body.lockedCount) || 0)));

  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 28)
      : null;

  // Attribute the share to the user when they happen to be logged in.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Service-role insert: the table has no INSERT policy, so the browser's anon
  // key cannot write to it directly.
  const admin = createAdminClient();
  const id = shortId();

  const { error } = await admin.from("shared_scans").insert({
    id,
    user_id: user?.id ?? null,
    score,
    visible_tips: visibleTips,
    locked_count: lockedCount,
    display_name: displayName,
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not create the share link. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id, path: `/s/${id}` });
}
