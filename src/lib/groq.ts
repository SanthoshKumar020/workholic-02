const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export type Message = { role: "system" | "user" | "assistant"; content: string };

async function callGroqRaw(messages: Message[], retrying = false): Promise<unknown> {
  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
  });

  if (res.status === 429 && !retrying) {
    await new Promise((r) => setTimeout(r, 3000));
    return callGroqRaw(messages, true);
  }

  // json_object mode failed — retry as plain text and parse manually
  if (!res.ok && !retrying) {
    const errText = await res.text().catch(() => "");
    if (res.status === 400 && /json/i.test(errText)) {
      const fallback = await fetch(GROQ_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: MODEL, messages, temperature: 0.4 }),
      });
      if (fallback.ok) {
        const fd = await fallback.json();
        const fc: string = fd.choices?.[0]?.message?.content ?? "{}";
        const stripped = fc.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        try { return JSON.parse(stripped); } catch { /* fall through */ }
        const m = stripped.match(/\{[\s\S]*\}/);
        if (m) { try { return JSON.parse(m[0]); } catch { /* fall through */ } }
        return {};
      }
    }
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "{}";

  // Try direct parse first, then strip markdown code fences as fallback
  try {
    return JSON.parse(content);
  } catch {
    const stripped = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    try {
      return JSON.parse(stripped);
    } catch {
      // Extract first {...} block as last resort
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { /* fall through */ }
      }
      return {};
    }
  }
}

export async function callGroq<T = unknown>(messages: Message[]): Promise<T> {
  return callGroqRaw(messages) as Promise<T>;
}

export async function callGroqText(messages: Message[]): Promise<string> {
  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
    }),
  });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 3000));
    return callGroqText(messages);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
