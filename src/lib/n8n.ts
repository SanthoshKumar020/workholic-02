// Helper for calling the n8n automation webhooks with a timeout and
// graceful error handling. Works both server-side and client-side
// (the webhook URLs are NEXT_PUBLIC_).

export class WebhookError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "WebhookError";
    this.status = status;
  }
}

interface PostOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * POST a JSON payload to an n8n webhook and parse the JSON response.
 * Throws WebhookError on timeout, network failure, or non-2xx status.
 */
export async function postToWebhook<T>(
  url: string | undefined,
  payload: unknown,
  { timeoutMs = 45000, signal }: PostOptions = {}
): Promise<T> {
  if (!url) {
    throw new WebhookError(
      "Automation webhook is not configured. Please set the webhook URL."
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // If a caller-provided signal aborts, propagate it.
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new WebhookError(
        `Automation service returned an error (${res.status}). ${text}`.trim(),
        res.status
      );
    }

    // n8n may return an array or an object; normalize the common cases.
    const data = (await res.json().catch(() => null)) as unknown;
    if (Array.isArray(data) && data.length === 1) {
      return data[0] as T;
    }
    return data as T;
  } catch (err: unknown) {
    if (err instanceof WebhookError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new WebhookError(
        "The automation service took too long to respond. Please try again."
      );
    }
    throw new WebhookError(
      "Could not reach the automation service. Please try again shortly."
    );
  } finally {
    clearTimeout(timer);
  }
}
