import "server-only";
import { callGroq, callGroqText, hasGroqKey, type Message } from "@/lib/groq";
import { geminiJson, geminiText, hasGeminiKey } from "@/lib/gemini";

/**
 * Provider-agnostic AI entry point with a fallback chain.
 *
 *   Groq llama-3.3-70b  →  (429 / 5xx / timeout)  →  Gemini Flash  →  throw
 *
 * ── Why ─────────────────────────────────────────────────────────────────────
 * Groq free tier: 30 req/min, 1,000/day. Gemini free tier: ~1,500/day, no card.
 * Neither alone survives a traffic spike; together they roughly triple the
 * ceiling at zero cost. The failure this prevents is specific and expensive —
 * a burst of visitors from one Reddit post or WhatsApp group all hitting 429
 * and never coming back.
 *
 * Existing routes can migrate one at a time: `callGroq` still works, and
 * `callAi` is a drop-in replacement with the same signature.
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

/** JSON completion with fallback. Mirrors `callGroq`. */
export async function callAi<T = unknown>(
  messages: Message[]
): Promise<{ result: T; provider: AiProvider }> {
  const failures: Record<string, string> = {};

  if (hasGroqKey()) {
    try {
      return { result: await callGroq<T>(messages), provider: "groq" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failures.groq = msg;
      if (!isRetryable(e)) throw e; // Our bug — fail loudly rather than masking it.
      console.warn("[ai] groq failed, falling back to gemini:", msg);
    }
  }

  if (hasGeminiKey()) {
    try {
      return { result: await geminiJson<T>(messages), provider: "gemini" };
    } catch (e) {
      failures.gemini = e instanceof Error ? e.message : String(e);
      console.error("[ai] gemini also failed:", failures.gemini);
    }
  }

  throw new AllProvidersFailedError(failures);
}

/** Free-text completion with fallback. Mirrors `callGroqText`. */
export async function callAiText(
  messages: Message[]
): Promise<{ text: string; provider: AiProvider }> {
  const failures: Record<string, string> = {};

  if (hasGroqKey()) {
    try {
      return { text: await callGroqText(messages), provider: "groq" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failures.groq = msg;
      if (!isRetryable(e)) throw e;
      console.warn("[ai] groq failed, falling back to gemini:", msg);
    }
  }

  if (hasGeminiKey()) {
    try {
      return { text: await geminiText(messages), provider: "gemini" };
    } catch (e) {
      failures.gemini = e instanceof Error ? e.message : String(e);
      console.error("[ai] gemini also failed:", failures.gemini);
    }
  }

  throw new AllProvidersFailedError(failures);
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
