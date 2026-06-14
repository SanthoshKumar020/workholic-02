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
      temperature: 0.7,
    }),
  });

  if (res.status === 429 && !retrying) {
    await new Promise((r) => setTimeout(r, 3000));
    return callGroqRaw(messages, true);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(content);
  } catch {
    return {};
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
