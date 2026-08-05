import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The circuit breaker's safety net (§1.3).
 *
 * When Groq and Gemini are both unavailable, the request is lost either way.
 * The choice is whether the *person* is lost too. Queuing an email turns a dead
 * end into a lead: they came here to fix their resume, they still want that in
 * an hour, and now we have a reason to write to them.
 *
 * Drained by /api/cron/capacity-drain.
 */

/**
 * Only the ATS check, deliberately.
 *
 * Every other tool sits behind a login: if it fails, the user still exists, is
 * still reachable, and can retry. The ATS check is the one place a complete
 * stranger hits an AI call, and if it 503s they are gone with no way to
 * follow up. That asymmetry — not the tool's importance — is what decides
 * what belongs in a queue.
 */
export const QUEUEABLE_FEATURES = ["ats-check"] as const;
export type QueueableFeature = (typeof QUEUEABLE_FEATURES)[number];

export function isQueueableFeature(v: unknown): v is QueueableFeature {
  return typeof v === "string" && (QUEUEABLE_FEATURES as readonly string[]).includes(v);
}

/**
 * Payloads are capped hard. A queue row is a note to retry later, not a file
 * store — and this table is written by an anonymous, unauthenticated endpoint,
 * so an uncapped jsonb column is an invitation to fill the database for free.
 */
export const MAX_PAYLOAD_CHARS = 12_000;

export async function enqueue(opts: {
  email: string;
  feature: QueueableFeature;
  payload: Record<string, unknown>;
}): Promise<{ ok: boolean }> {
  const serialised = JSON.stringify(opts.payload ?? {});
  if (serialised.length > MAX_PAYLOAD_CHARS) {
    return { ok: false };
  }

  const { error } = await createAdminClient().from("capacity_queue").insert({
    email: opts.email.toLowerCase().trim(),
    feature: opts.feature,
    payload: opts.payload ?? {},
  });

  if (error) {
    console.error("[capacity-queue] enqueue failed:", error.message);
    return { ok: false };
  }
  return { ok: true };
}

/**
 * Give up rather than retry forever.
 *
 * Three attempts spread across the drain schedule is roughly an hour of
 * outage. Past that the promise we made ("within the hour") is already broken,
 * and emailing someone a resume score they asked for yesterday is worse than
 * not emailing them.
 */
export const MAX_ATTEMPTS = 3;
