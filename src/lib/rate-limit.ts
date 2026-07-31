import "server-only";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Durable, Postgres-backed rate limiting.
 *
 * ── Why this replaced the in-memory version ─────────────────────────────────
 * The previous implementation kept counters in a JS Map. Vercel functions are
 * stateless and ephemeral, so every cold start began with an empty Map and
 * concurrent invocations each had their own. "3 anonymous scans per day" was
 * really "3 per warm instance" — and a traffic burst, which is exactly what a
 * limiter is for, spawns many instances and multiplies the cap by however many
 * are running.
 *
 * That mattered because Groq's free tier is 30 requests/minute and 1,000/day.
 * Exceeding it means every visitor arriving from a Reddit thread or a college
 * WhatsApp group hits a broken tool, and you get one first impression per
 * channel.
 *
 * Counters now live in Postgres (migration 017) and are incremented with a
 * single atomic statement, so concurrent requests can't race past the limit.
 *
 * ── Failure mode ────────────────────────────────────────────────────────────
 * If the database is unreachable we ALLOW the request. A limiter that hard-
 * fails takes the whole product down to protect a quota — the wrong trade for
 * a free tool. The AI provider has its own limits behind this.
 */

export type RateLimitResult = {
  allowed: boolean;
  /** Requests left in this window. */
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
  /** True when the check itself failed and we allowed the request through. */
  degraded?: boolean;
};

const DAY_SECONDS = 86_400;

/**
 * Consume one token for `key`.
 *
 * @param key           From `clientKey(request, "feature")` or `userKey(id, "feature")`.
 * @param limit         Max requests per window.
 * @param windowSeconds Window length (default 24h).
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number = DAY_SECONDS
): Promise<RateLimitResult> {
  const elapsed = Math.floor(Date.now() / 1000) % windowSeconds;
  const retryAfter = windowSeconds - elapsed;

  try {
    const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
      p_bucket_key: key,
      p_window_seconds: windowSeconds,
    });

    if (error) throw new Error(error.message);

    const count = typeof data === "number" ? data : 0;
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter,
    };
  } catch (e) {
    // Fail open, but loudly — a silently broken limiter is worse than none.
    console.error("[rate-limit] check failed, allowing request:", e instanceof Error ? e.message : e);
    return { allowed: true, remaining: limit, retryAfter, degraded: true };
  }
}

/** Current usage without consuming — for "you have N checks left today". */
export async function peekRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = DAY_SECONDS
): Promise<{ used: number; remaining: number }> {
  try {
    const { data } = await createAdminClient().rpc("peek_rate_limit", {
      p_bucket_key: key,
      p_window_seconds: windowSeconds,
    });
    const used = typeof data === "number" ? data : 0;
    return { used, remaining: Math.max(0, limit - used) };
  } catch {
    return { used: 0, remaining: limit };
  }
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "unknown";
}

/**
 * A stable, privacy-preserving bucket key: sha256(ip + user-agent),
 * namespaced per feature. The raw IP is never stored.
 */
export function clientKey(request: Request, namespace: string): string {
  const raw = `${clientIp(request)}|${request.headers.get("user-agent") ?? ""}`;
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `${namespace}:${hash}`;
}

/**
 * Key for a signed-in user. Prefer this over clientKey when you have a user —
 * it survives an IP change, and it stops one shared college network from
 * exhausting a limit for everybody on it.
 */
export function userKey(userId: string, namespace: string): string {
  return `${namespace}:user:${userId}`;
}

/**
 * Friendly 429 body. Never return a stack trace or a bare "rate limited" —
 * this is a real person who came to fix their resume.
 */
export function rateLimitMessage(retryAfterSeconds: number): string {
  const hours = Math.ceil(retryAfterSeconds / 3600);
  if (hours <= 1) return "You've used your free checks for now. They reset within the hour.";
  if (hours >= 20) return "You've used your free checks for today. They reset at midnight IST.";
  return `You've used your free checks for now. They reset in about ${hours} hours.`;
}
