import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TokenUsage } from "@/lib/groq";

/**
 * Inference cost accounting.
 *
 * ── What this is for ────────────────────────────────────────────────────────
 * Both providers are currently on free tiers, so today every number here is
 * ₹0.00 of actual outflow. That is exactly why it is worth building now: the
 * point is to know what the paid bill *would* be before you are paying it, and
 * to catch the one user who is quietly costing more than they paid.
 *
 * Mock interviews are the expensive path — roughly ₹3.60 of inference per
 * 20-turn session against ~₹24 net revenue on a ₹299/90-day plan. Healthy on
 * average, ruinous in the tail. `assertWithinCostBudget` is what stops the tail.
 *
 * ── Why the rate card is approximate and says so ────────────────────────────
 * Groq and Google both publish per-million-token prices that move. These are
 * order-of-magnitude figures for *alerting*, not for accounting or invoicing —
 * a cost report that is right to the nearest rupee is enough to tell you
 * something is wrong, which is all it is asked to do.
 */

/** Paise per million tokens. ₹1 = 100 paise. */
type RateCard = { inPaisePerMTok: number; outPaisePerMTok: number };

const RATES: Record<string, RateCard> = {
  // Groq llama-3.3-70b-versatile — ~$0.59 in / $0.79 out per Mtok at ~₹84/USD.
  "llama-3.3-70b-versatile": { inPaisePerMTok: 4_956, outPaisePerMTok: 6_636 },
  // Gemini 2.0 Flash — ~$0.10 in / $0.40 out per Mtok.
  "gemini-2.0-flash": { inPaisePerMTok: 840, outPaisePerMTok: 3_360 },
};

/** Anything unrecognised is costed at the most expensive card we know, not zero.
 *  An unknown model silently costing ₹0 is how a cost guard stops guarding. */
const FALLBACK_RATE: RateCard = { inPaisePerMTok: 4_956, outPaisePerMTok: 6_636 };

/**
 * When a provider reports no usage block, assume a typical call rather than
 * zero — same reasoning as above. These are the rough shape of our prompts:
 * a resume plus a system prompt in, a page of JSON out.
 */
const ASSUMED_PROMPT_TOKENS = 1_200;
const ASSUMED_COMPLETION_TOKENS = 500;

export function costPaise(model: string, usage: TokenUsage): number {
  const rate = RATES[model] ?? FALLBACK_RATE;
  const pIn = usage.promptTokens ?? ASSUMED_PROMPT_TOKENS;
  const pOut = usage.completionTokens ?? ASSUMED_COMPLETION_TOKENS;
  return Math.round((pIn * rate.inPaisePerMTok + pOut * rate.outPaisePerMTok) / 1_000_000);
}

export type AiEvent = {
  userId?: string | null;
  feature: string;
  provider: "groq" | "gemini";
  model?: string;
  usage?: TokenUsage;
  status?: "ok" | "error";
  errorCode?: string;
  latencyMs?: number;
};

/**
 * Record one inference call.
 *
 * Never throws and never awaits anything the caller depends on: telemetry that
 * can break a user's resume check is worse than no telemetry. Callers may fire
 * this without awaiting.
 */
export async function logAiEvent(event: AiEvent): Promise<void> {
  try {
    const model = event.model ?? "unknown";
    await createAdminClient()
      .from("ai_events")
      .insert({
        user_id: event.userId ?? null,
        feature: event.feature,
        provider: event.provider,
        model,
        prompt_tokens: event.usage?.promptTokens ?? null,
        completion_tokens: event.usage?.completionTokens ?? null,
        cost_paise: event.status === "error" ? 0 : costPaise(model, event.usage ?? {}),
        status: event.status ?? "ok",
        error_code: event.errorCode ?? null,
        latency_ms: event.latencyMs ?? null,
      });
  } catch (e) {
    console.error("[ai-cost] failed to log event:", e instanceof Error ? e.message : e);
  }
}

/**
 * Rupees of inference this user has run in the last rolling 30 days.
 * Returns 0 on any failure — see the fail-open note below.
 */
export async function spendRupees(userId: string): Promise<number> {
  try {
    const { data, error } = await createAdminClient().rpc("ai_spend_rupees", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return typeof data === "number" ? data : Number(data ?? 0);
  } catch (e) {
    console.error("[ai-cost] spend lookup failed:", e instanceof Error ? e.message : e);
    return 0;
  }
}

/** The alert threshold from the work order: ₹50 of inference per user per month. */
export const COST_ALERT_RUPEES = Number(process.env.AI_COST_ALERT_RUPEES ?? 50);

/**
 * The hard stop, deliberately well above the alert threshold.
 *
 * Two different jobs: ₹50 means "look at this account", ₹150 means "this
 * account cannot continue". Making them the same number would either alert
 * constantly or cut off a legitimate heavy user with no warning.
 */
export const COST_BLOCK_RUPEES = Number(process.env.AI_COST_BLOCK_RUPEES ?? 150);

export type CostCheck = { allowed: boolean; spend: number; warn: boolean };

/**
 * Gate an expensive call on the user's rolling spend.
 *
 * Fails OPEN on a lookup error, for the same reason the rate limiter does: a
 * telemetry outage should not take the product down. The consequence of being
 * wrong here is one user's overspend for one window, which is recoverable; the
 * consequence of failing closed is every paying user seeing a broken tool.
 */
export async function checkCostBudget(userId: string): Promise<CostCheck> {
  const spend = await spendRupees(userId);
  return {
    allowed: spend < COST_BLOCK_RUPEES,
    spend,
    warn: spend >= COST_ALERT_RUPEES,
  };
}
