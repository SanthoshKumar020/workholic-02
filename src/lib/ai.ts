import "server-only";
import {
  callGroqUsage,
  callGroqTextUsage,
  hasGroqKey,
  GROQ_MODEL,
  type Message,
  type TokenUsage,
} from "@/lib/groq";
import { geminiJsonUsage, geminiTextUsage, hasGeminiKey, GEMINI_MODEL } from "@/lib/gemini";
import { logAiEvent } from "@/lib/ai-cost";

/**
 * Provider-agnostic AI entry point with a fallback chain.
 *
 *   Groq llama-3.3-70b  →  (429 / 5xx / timeout)  →  Gemini Flash  →  throw
 *                                                                     ↓
 *                                       caller offers "leave your email"
 *                                       and queues the work (§1.3)
 *
 * ── Why ─────────────────────────────────────────────────────────────────────
 * Groq free tier: 30 req/min, 1,000/day. Gemini free tier: ~1,500/day, no card.
 * Neither alone survives a traffic spike; together they roughly triple the
 * ceiling at zero cost. The failure this prevents is specific and expensive —
 * a burst of visitors from one Reddit post or WhatsApp group all hitting 429
 * and never coming back.
 *
 * Every call, success or failure, is written to `ai_events`. That table is the
 * only source for the cost guard, the daily digest, and the `ai_error` event
 * in the analytics spec — so logging lives here rather than in each of the
 * thirty-odd routes, where it would be forgotten in half of them.
 */

export type { Message };

/** Which provider served a request — surface it in logs, never to the user. */
export type AiProvider = "groq" | "gemini";

export class AllProvidersFailedError extends Error {
  constructor(public readonly failures: Record<string, string>) {
    super("All AI providers are unavailable");
    this.name = "AllProvidersFailedError";
  }
}

/**
 * Only fall through on errors another provider might actually survive.
 *
 * A 400 means our prompt is malformed — retrying it on Gemini burns the
 * backup quota to produce the same failure, and hides a bug we should see.
 */
function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /\b(429|5\d\d)\b/.test(msg) ||
    /rate.?limit|quota|timeout|aborted|ECONNRESET|fetch failed|All Groq keys failed/i.test(msg)
  );
}

/** First HTTP-ish status in an error message, for `ai_error {provider, code}`. */
function errorCode(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.match(/\b(4\d\d|5\d\d)\b/)?.[1] ?? (/timeout|aborted/i.test(msg) ? "timeout" : "unknown");
}

/** Context a caller passes so a logged event can be attributed. */
export type AiContext = { feature: string; userId?: string | null };

/**
 * Run the chain, logging each attempt. `run` is the provider-specific call.
 *
 * Written once and shared by the JSON and text paths — they had identical
 * fallback logic before, and a fix applied to one of two copies is how a
 * fallback chain quietly stops falling back.
 */
async function withFallback<T>(
  ctx: AiContext,
  runGroq: () => Promise<{ value: T; usage: TokenUsage }>,
  runGemini: () => Promise<{ value: T; usage: TokenUsage }>
): Promise<{ value: T; provider: AiProvider }> {
  const failures: Record<string, string> = {};

  const attempt = async (
    provider: AiProvider,
    model: string,
    run: () => Promise<{ value: T; usage: TokenUsage }>
  ): Promise<{ value: T; provider: AiProvider } | { error: unknown }> => {
    const started = Date.now();
    try {
      const { value, usage } = await run();
      void logAiEvent({
        userId: ctx.userId,
        feature: ctx.feature,
        provider,
        model,
        usage,
        status: "ok",
        latencyMs: Date.now() - started,
      });
      return { value, provider };
    } catch (e) {
      void logAiEvent({
        userId: ctx.userId,
        feature: ctx.feature,
        provider,
        model,
        status: "error",
        errorCode: errorCode(e),
        latencyMs: Date.now() - started,
      });
      return { error: e };
    }
  };

  if (hasGroqKey()) {
    const r = await attempt("groq", GROQ_MODEL, runGroq);
    if (!("error" in r)) return r;
    const msg = r.error instanceof Error ? r.error.message : String(r.error);
    failures.groq = msg;
    // Our bug, not their capacity — fail loudly rather than masking it behind
    // a second provider producing the same wrong answer.
    if (!isRetryable(r.error)) throw r.error;
    console.warn("[ai] groq failed, falling back to gemini:", msg);
  }

  if (hasGeminiKey()) {
    const r = await attempt("gemini", GEMINI_MODEL, runGemini);
    if (!("error" in r)) return r;
    failures.gemini = r.error instanceof Error ? r.error.message : String(r.error);
    console.error("[ai] gemini also failed:", failures.gemini);
  }

  throw new AllProvidersFailedError(failures);
}

/** JSON completion with fallback. Mirrors `callGroq`. */
export async function callAi<T = unknown>(
  messages: Message[],
  ctx: AiContext = { feature: "unknown" }
): Promise<{ result: T; provider: AiProvider }> {
  const { value, provider } = await withFallback<T>(
    ctx,
    async () => {
      const { result, usage } = await callGroqUsage<T>(messages);
      return { value: result, usage };
    },
    async () => {
      const { result, usage } = await geminiJsonUsage<T>(messages);
      return { value: result, usage };
    }
  );
  return { result: value, provider };
}

/** Free-text completion with fallback. Mirrors `callGroqText`. */
export async function callAiText(
  messages: Message[],
  ctx: AiContext = { feature: "unknown" }
): Promise<{ text: string; provider: AiProvider }> {
  const { value, provider } = await withFallback<string>(
    ctx,
    async () => {
      const { text, usage } = await callGroqTextUsage(messages);
      return { value: text, usage };
    },
    async () => {
      const { text, usage } = await geminiTextUsage(messages);
      return { value: text, usage };
    }
  );
  return { text: value, provider };
}

/**
 * The message shown when both lanes are down.
 *
 * Deliberately not "something went wrong": tell them it's capacity, that it's
 * temporary, and that it isn't their file. Routes that can should also offer
 * to email the result later rather than losing the person entirely.
 */
export const AI_CAPACITY_MESSAGE =
  "Our AI is at capacity right now — this is on us, not your file. Please try again in a few minutes.";

/**
 * The capacity response, with the email-capture offer (§1.3).
 *
 * The point of returning `queueable: true` is that the client shows an email
 * field instead of a dead end. Losing the request is unavoidable when both
 * providers are down; losing the person is not.
 */
export function capacityResponse(feature: string) {
  return Response.json(
    {
      error: AI_CAPACITY_MESSAGE,
      queueable: true,
      feature,
      queueMessage:
        "Leave your email and we'll send your result as soon as capacity frees up — usually within the hour.",
    },
    { status: 503 }
  );
}
