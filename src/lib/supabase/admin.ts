import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES Row Level Security.
 *
 * SERVER ONLY. Never import this into a client component.
 * Used by Stripe webhooks and other trusted server routes to update any
 * user's data (e.g. flipping a profile to the Pro plan).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
