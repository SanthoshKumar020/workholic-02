import "server-only";
import crypto from "crypto";

/**
 * Shared helpers for the manual UPI payment flow.
 *
 * These live here rather than in a route file on purpose: Next.js validates the
 * exports of `route.ts` and rejects anything that isn't a route handler or a
 * known config field, so exporting a helper from a route breaks the build.
 */

export type UpiAction = "approve" | "reject";

/**
 * HMAC over `requestId:action`.
 *
 * Binding the action into the signature means an "approve" link cannot be
 * hand-edited into a "reject" (or the reverse). There is deliberately NO
 * fallback secret — a hardcoded default would let anyone who reads this
 * repository forge approvals if the env var were ever missing. Fail closed.
 */
export function makeApproveToken(requestId: string, action: UpiAction): string {
  const secret = process.env.UPI_APPROVE_SECRET;
  if (!secret) throw new Error("UPI_APPROVE_SECRET is not configured");
  return crypto.createHmac("sha256", secret).update(`${requestId}:${action}`).digest("hex");
}

/** Constant-time token comparison, safe against mismatched lengths. */
export function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function parseUpiAction(raw: string | null | undefined): UpiAction {
  return raw === "reject" ? "reject" : "approve";
}

/** Escape untrusted values before interpolating them into HTML email or pages. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
