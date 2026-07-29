import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Log a partner-link click.
 *
 * Networks under-report, so this is our independent count — and the evidence
 * base for negotiating a direct deal later, where the numbers need to be ours
 * and defensible.
 *
 * Fire-and-forget from the client: it must never delay or block the outbound
 * navigation. If logging fails, the user still gets where they were going.
 */

const CLICK_LIMIT_PER_DAY = 100;
const SURFACES = new Set(["match_result", "blog", "roadmap", "domains"]);

export async function POST(request: Request) {
  // Generous — this only exists to stop someone scripting junk into the table,
  // and the numbers have to stay trustworthy because they back a commercial
  // conversation.
  const { allowed } = rateLimit(clientKey(request, "aff-click"), CLICK_LIMIT_PER_DAY);
  if (!allowed) return NextResponse.json({ ok: true }); // Silently drop; never error at the user.

  let body: { partnerId?: string; skillLabel?: string; surface?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const partnerId = (body.partnerId ?? "").trim().slice(0, 40);
  if (!partnerId) return NextResponse.json({ ok: true });

  const surface = SURFACES.has(body.surface ?? "") ? body.surface! : "unknown";
  const skillLabel = (body.skillLabel ?? "").trim().slice(0, 60) || null;

  // Attribute to a user when there is one; never create an identity for a
  // logged-out visitor just to track them.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await createAdminClient().from("affiliate_clicks").insert({
      user_id: user?.id ?? null,
      partner_id: partnerId,
      skill_label: skillLabel,
      surface,
    });
  } catch (e) {
    console.error("[affiliate/click]", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true });
}
