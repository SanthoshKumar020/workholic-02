const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export type Message = { role: "system" | "user" | "assistant"; content: string };

// ── Key rotation ──────────────────────────────────────────────────────────────
//
// Configure ANY of these (all are merged & de-duped):
//   GROQ_API_KEYS   — comma/space/newline separated list of keys  (preferred)
//   GROQ_API_KEY    — a single key (back-compat)
//   GROQ_API_KEY_1 … GROQ_API_KEY_10 — numbered keys
//
// Requests round-robin across the pool, and on 429 / 401 / 5xx automatically
// fail over to the next key — so one rate-limited key never breaks a request.

/** All configured Groq keys, de-duplicated. */
export function getGroqKeys(): string[] {
  const set = new Set<string>();
  (process.env.GROQ_API_KEYS ?? "").split(/[,\s]+/).forEach((raw) => {
    const k = raw.trim();
    if (k) set.add(k);
  });
  if (process.env.GROQ_API_KEY?.trim()) set.add(process.env.GROQ_API_KEY.trim());
  for (let i = 1; i <= 10; i++) {
    const v = process.env[`GROQ_API_KEY_${i}`];
    if (v?.trim()) set.add(v.trim());
  }
  return Array.from(set);
}

export function hasGroqKey(): boolean {
  return getGroqKeys().length > 0;
}

// Random start so cold-started serverless instances don't all begin on key #1.
let rrCounter = Math.floor(Math.random() * 1_000_000);

/** Next key in round-robin rotation (returns "" if none configured). */
export function getGroqKey(): string {
  const keys = getGroqKeys();
  if (keys.length === 0) return "";
  return keys[rrCounter++ % keys.length];
}

/**
 * POST to Groq with key rotation + failover. Rotates to the next key, and on
 * 429 / 401 / 5xx retries with each remaining key. Returns the first usable
 * Response (body untouched, so the caller can read it).
 */
export async function groqRequest(
  payload: Record<string, unknown>,
  opts?: { timeoutMs?: number }
): Promise<Response> {
  const keys = getGroqKeys();
  if (keys.length === 0) throw new Error("No GROQ_API_KEY configured");

  const start = rrCounter++;
  let lastErr: unknown = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[(start + i) % keys.length];
    try {
      const res = await fetch(GROQ_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(payload),
        signal: opts?.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
      });
      // Rate-limited / auth / server error → try the next key.
      if (res.status === 429 || res.status === 401 || res.status >= 500) {
        lastErr = new Error(`Groq ${res.status}`);
        await res.text().catch(() => {}); // drain so the socket frees
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All Groq keys failed");
}

// ── Loose JSON parsing helper ───────────────────────────────────────────────
function parseLoose(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const stripped = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    try {
      return JSON.parse(stripped);
    } catch {
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { /* fall through */ }
      }
      return {};
    }
  }
}

async function callGroqRaw(messages: Message[]): Promise<unknown> {
  const res = await groqRequest({
    model: MODEL,
    messages,
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  // json_object mode rejected — retry as plain text and parse manually.
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 400 && /json/i.test(errText)) {
      const fb = await groqRequest({ model: MODEL, messages, temperature: 0.4 });
      if (fb.ok) {
        const fd = await fb.json();
        return parseLoose(fd.choices?.[0]?.message?.content ?? "{}");
      }
    }
    throw new Error(`Groq API error ${res.status}: ${errText || res.statusText}`);
  }

  const data = await res.json();
  return parseLoose(data.choices?.[0]?.message?.content ?? "{}");
}

export async function callGroq<T = unknown>(messages: Message[]): Promise<T> {
  return callGroqRaw(messages) as Promise<T>;
}

export async function callGroqText(messages: Message[]): Promise<string> {
  const res = await groqRequest({ model: MODEL, messages, temperature: 0.7 });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
