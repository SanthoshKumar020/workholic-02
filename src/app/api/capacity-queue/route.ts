import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { enqueue, isQueueableFeature, MAX_PAYLOAD_CHARS } from "@/lib/capacity-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Our AI is at capacity — leave your email and we'll send it over." (§1.3)
 *
 * Reached only when /api/<tool> has already returned 503 with `queueable`.
 * Anonymous by design: the whole value is keeping a visitor who has no account
 * and was about to leave.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Generous — a real person queues once, maybe twice if they retry the tool. */
const QUEUE_DAILY_LIMIT = 5;

export async function POST(request: Request) {
  const { allowed, retryAfter } = await rateLimit(clientKey(request, "capacity-queue"), QUEUE_DAILY_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests from this device today." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: { email?: string; feature?: string; payload?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").toLowerCase().trim();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!isQueueableFeature(body.feature)) {
    return NextResponse.json({ error: "Unknown feature." }, { status: 400 });
  }

  const { ok } = await enqueue({ email, feature: body.feature, payload: body.payload ?? {} });
  if (!ok) {
    return NextResponse.json(
      { error: `That's too much text to queue (limit ~${Math.round(MAX_PAYLOAD_CHARS / 1000)}k characters).` },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Got it. We'll email your result as soon as capacity frees up.",
  });
}
