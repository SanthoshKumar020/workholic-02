/**
 * Provider-agnostic, zero-cost analytics.
 *
 * Configure whichever you use (both optional — with neither set, every call
 * here is a silent no-op, so the app works exactly as before):
 *
 *   NEXT_PUBLIC_GA_ID            e.g. "G-XXXXXXXXXX"   (Google Analytics 4, free)
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN e.g. "hyrise.swache.in" (Plausible / self-hosted)
 *
 * Keep the event vocabulary small and funnel-shaped. The whole point is to be
 * able to answer one question: where do visitors fall out between landing on
 * the site and becoming a paying user?
 */

export type AnalyticsEvent =
  // ── Acquisition ─────────────────────────────────────────────────────────
  | "ats_check_started" // clicked "Check my ATS score"
  | "ats_check_completed" // got a score back
  | "ats_check_failed"
  | "ats_resume_uploaded"
  // ── Activation ──────────────────────────────────────────────────────────
  | "signup_cta_clicked" // any "sign up free" button, with a `source` prop
  | "signup_completed"
  | "tool_used" // any AI tool ran successfully, with a `tool` prop
  // ── Revenue ─────────────────────────────────────────────────────────────
  | "pricing_viewed"
  | "upgrade_clicked"
  | "checkout_started"
  // ── Loops ───────────────────────────────────────────────────────────────
  | "share_link_created"
  | "share_clicked"
  | "share_page_cta_clicked"
  | "email_captured";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: Props }) => void;
  }
}

/** Fire a funnel event. Safe to call anywhere — SSR and unconfigured are no-ops. */
export function track(event: AnalyticsEvent, props: Props = {}): void {
  if (typeof window === "undefined") return;

  const clean: Props = {};
  for (const [k, v] of Object.entries(props)) {
    if (v !== undefined) clean[k] = v;
  }

  try {
    window.gtag?.("event", event, clean);
    window.plausible?.(event, Object.keys(clean).length ? { props: clean } : undefined);
  } catch {
    // Analytics must never break the app.
  }

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, clean);
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "";
export const analyticsEnabled = Boolean(GA_ID || PLAUSIBLE_DOMAIN);
