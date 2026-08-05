import "server-only";

/**
 * Google AI Studio (Gemini Flash) — the second free lane.
 *
 * Groq's free tier is 30 requests/minute and 1,000/day. That is fine at 16
 * users and catastrophic the first time a Reddit thread or a college WhatsApp
 * group sends four hundred people in an hour: everyone past the limit sees a
 * broken tool, and you get exactly one first impression per channel.
 *
 * Gemini's free tier adds roughly 1,500 requests/day with no card, so running
 * both roughly triples the ceiling for no cost. This module deliberately
 * mirrors the shape of lib/groq.ts so the fallback in lib/ai.ts can treat them
 * interchangeably.
 *
 *   GEMINI_API_KEY  — https://aistudio.google.com/apikey (free, no card)
 *
 * Unset means Gemini is simply skipped and behaviour is exactly as before.
 */

const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type Message = { role: "system" | "user" | "assistant"; content: string };
export type TokenUsage = { promptTokens?: number; completionTokens?: number };

/** The model this module talks to — logged so cost can be attributed per model. */
export const GEMINI_MODEL = MODEL;

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Gemini has no "system" role. The convention is to hoist system text into
 * `systemInstruction` and map assistant → "model".
 */
function toGeminiPayload(messages: Message[], jsonMode: boolean) {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  return {
    contents,
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    generationConfig: {
      temperature: 0.4,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
}

/** Raw text completion with token counts. Throws on non-2xx so callers fall through. */
export async function geminiTextUsage(
  messages: Message[],
  jsonMode = false
): Promise<{ text: string; usage: TokenUsage }> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toGeminiPayload(messages, jsonMode)),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const u = data?.usageMetadata;
  return {
    text,
    usage: { promptTokens: u?.promptTokenCount, completionTokens: u?.candidatesTokenCount },
  };
}

export async function geminiText(messages: Message[], jsonMode = false): Promise<string> {
  return (await geminiTextUsage(messages, jsonMode)).text;
}

/** Same loose-JSON tolerance as the Groq path — models fence their output. */
function parseLooseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    try {
      return JSON.parse(stripped) as T;
    } catch {
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as T;
      throw new Error("Gemini returned unparseable JSON");
    }
  }
}

export async function geminiJsonUsage<T = unknown>(
  messages: Message[]
): Promise<{ result: T; usage: TokenUsage }> {
  const { text, usage } = await geminiTextUsage(messages, true);
  return { result: parseLooseJson<T>(text), usage };
}

export async function geminiJson<T = unknown>(messages: Message[]): Promise<T> {
  return (await geminiJsonUsage<T>(messages)).result;
}
