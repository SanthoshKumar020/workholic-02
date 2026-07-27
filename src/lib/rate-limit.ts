import { createHash } from "crypto";

/**
 * Zero-dependency, in-memory sliding-window rate limiter.
 *
 * Used to protect anonymous (logged-out) AI endpoints — the "try before you
 * sign up" lead-magnet flow. It is intentionally simple:
 *
 *   • No Redis / Upstash / extra infra to pay for.
 *   • State lives in the serverless instance's memory, so a determined abuser
 *     could get a few extra calls across cold starts. That is an acceptable
 *     trade-off for a free 60-second demo — the real limit for heavy use is
 *     the signup wall.
 *
 * If abuse ever becomes a real cost problem, swap `hits` for a Supabase table
 * or Upstash Redis without changing any call sites.
 */

type Bucket = { count: number; resetAt: number };

const hits = new Map<string, Bucket>();

/** Drop expired buckets so the map can't grow without bound. */
function sweep(now: number) {
  if (hits.size < 5_000) return;
  for (const [key, bucket] of hits) {
    if (bucket.resetAt <= now) hits.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
};

/**
 * Consume one token for `key`.
 *
 * @param key     Caller identity (use `clientKey(request)`).
 * @param limit   Max requests allowed per window.
 * @param windowMs Window length in milliseconds (default: 24 hours).
 */
export function rateLimit(key: string, limit: number, windowMs = 86_400_000): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = hits.get(key);

  if (!bucket || bucket.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfter: 0 };
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "unknown";
}

/**
 * A stable, privacy-preserving bucket key: sha256(ip + user-agent), namespaced
 * per feature. We never store the raw IP.
 */
export function clientKey(request: Request, namespace: string): string {
  const raw = `${clientIp(request)}|${request.headers.get("user-agent") ?? ""}`;
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `${namespace}:${hash}`;
}
