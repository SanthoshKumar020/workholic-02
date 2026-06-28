import "server-only";
import { Cashfree, CFEnvironment } from "cashfree-pg";

const env =
  process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;

// Trim to guard against stray whitespace/newlines in env values — a trailing
// space in the secret key is silently rejected by Cashfree as a 401.
export const cashfree = new Cashfree(
  env,
  (process.env.CASHFREE_APP_ID ?? "").trim(),
  (process.env.CASHFREE_SECRET_KEY ?? "").trim()
);
