-- ─────────────────────────────────────────────────────────────────────────────
-- 013_fix_profile_column_grants.sql
--
-- FIXES A REGRESSION INTRODUCED BY MIGRATION 010.
--
-- Symptom: onboarding fails with "Failed to save. Please try again."
--
-- Cause: 010 revoked blanket UPDATE on `profiles` and granted back a
-- hand-written list of columns. That list was built by reading the migration
-- files in this repo — but `supabase/schema.sql` only ever defined five
-- columns (id, email, plan, stripe_customer_id, created_at). Everything else
-- the app relies on (target_role, preferred_language, xp, streak, last_active,
-- dsa_mode, username, public_bio, …) was added to the live database outside
-- these files. So the allowlist was incomplete by construction, and any write
-- to a column it missed started failing.
--
-- `preferred_language` was the one onboarding hit
-- (OnboardingClient.tsx writes target_role AND preferred_language together),
-- but the same trap applies to any column added out-of-band in future.
--
-- Fix: switch from an allowlist to a DENYLIST, computed against the live
-- schema rather than against this repo. Every column that actually exists
-- becomes user-writable except the ones that must never be, and a column added
-- out-of-band tomorrow behaves sensibly instead of silently breaking a form.
--
-- The security property that matters is preserved: `plan` stays service-role
-- only, so the "grant yourself Pro from the browser console" escalation that
-- 010 closed stays closed.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  col text;
  -- Columns the user must NEVER write directly.
  -- ADD TO THIS LIST when introducing a new sensitive column.
  denied text[] := array[
    'id',                  -- identity; changing it would reassign the row
    'email',               -- was compared against SUPER_ADMIN_EMAILS
    'plan',                -- the paywall itself
    'stripe_customer_id',  -- links the row to a billing account
    'created_at',
    'last_nudged_at',      -- self-suppressing re-engagement email
    'nudge_opt_out'        -- only the unsubscribe route may set this
  ];
begin
  -- Start from a clean slate so this migration is idempotent and so any
  -- stale grant from 010 is replaced rather than merged.
  execute 'revoke update on public.profiles from anon, authenticated';

  for col in
    select column_name
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'profiles'
       and column_name <> all(denied)
  loop
    execute format('grant update (%I) on public.profiles to authenticated', col);
  end loop;
end $$;

-- Anonymous users still get nothing: no grant is issued to `anon`.

-- ── Verify ───────────────────────────────────────────────────────────────────
-- 1. These must be WRITABLE (the app breaks otherwise) — expect every row:
--
--   select column_name from information_schema.column_privileges
--    where table_name = 'profiles' and grantee = 'authenticated'
--      and privilege_type = 'UPDATE'
--      and column_name in ('target_role','preferred_language','xp','streak',
--                          'last_active','dsa_mode','username','public_bio',
--                          'is_public','completed_certs');
--
-- 2. These must NOT appear — expect zero rows:
--
--   select column_name from information_schema.column_privileges
--    where table_name = 'profiles' and grantee = 'authenticated'
--      and privilege_type = 'UPDATE'
--      and column_name in ('plan','email','stripe_customer_id',
--                          'last_nudged_at','nudge_opt_out');
--
-- 3. The escalation stays closed. As a normal logged-in user in the browser:
--      await supabase.from('profiles').update({ plan: 'pro' }).eq('id', myId)
--    should return a permission error, not success.
