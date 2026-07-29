-- ─────────────────────────────────────────────────────────────────────────────
-- 010_lock_down_profile_columns.sql
--
-- CRITICAL SECURITY FIX — run this before anything else.
--
-- THE PROBLEM
-- `profiles` has this policy (schema.sql):
--
--     create policy "profiles_update_own" on public.profiles
--       for update using (auth.uid() = id) with check (auth.uid() = id);
--
-- Postgres RLS is ROW-level, not COLUMN-level. The policy correctly stops a
-- user editing *someone else's* row — but places no limit on WHICH COLUMNS of
-- their OWN row they may write. Since the browser talks to Supabase directly
-- with the public anon key, any signed-up user could open the console and run:
--
--     await supabase.from('profiles').update({ plan: 'pro' }).eq('id', myId)
--
-- …and be Pro instantly. Every paywall reads profiles.plan (isUserPro in
-- src/lib/plan.ts), so this defeated Stripe, Cashfree, UPI and every free-tier
-- limit at once. The same hole allowed rewriting `email` (which some code path
-- compared against SUPER_ADMIN_EMAILS) and `stripe_customer_id`.
--
-- THE FIX
-- Column-level GRANTs. RLS decides which ROWS you may touch; GRANT decides
-- which COLUMNS. We need both.
--
-- After this migration, `plan`, `email` and `stripe_customer_id` are writable
-- only by the service-role key — i.e. only from server code the user cannot
-- reach: the Stripe/Cashfree webhooks and the admin UPI approval route.
-- ─────────────────────────────────────────────────────────────────────────────

-- Revoke blanket UPDATE from the two browser-reachable roles.
revoke update on public.profiles from anon, authenticated;

-- Grant back only the columns the app legitimately writes with the USER client.
-- Sources: src/app/api/enhance/route.ts, src/lib/plan.ts (awardXp),
-- src/app/api/dsa/mode/route.ts, src/app/api/public-profile/route.ts.
--
-- If a future feature needs the user to edit another column, add it HERE —
-- never by re-granting UPDATE on the whole table.
do $$
declare
  col text;
  grantable text[] := array[
    'username', 'public_bio', 'is_public',
    'linkedin_url', 'github_url', 'portfolio_url',
    'completed_certs', 'xp', 'streak', 'last_active',
    'dsa_mode', 'target_role'
  ];
begin
  foreach col in array grantable loop
    -- Skip columns that don't exist in this deployment, so the migration is
    -- safe to run against a database that hasn't applied every earlier file.
    if exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles' and column_name = col
    ) then
      execute format('grant update (%I) on public.profiles to authenticated', col);
    end if;
  end loop;
end $$;

-- Anonymous visitors have no business updating a profile at all.
-- (No grant is issued to `anon`.)

-- ── Make usage counters tamper-proof ─────────────────────────────────────────
-- Free-tier limits are enforced by counting rows in `feature_usage`. If a user
-- can DELETE their own rows from the browser, the limit resets to zero and the
-- free tier becomes unlimited. Counters must be insert-only.
do $$
begin
  if exists (select 1 from information_schema.tables
              where table_schema = 'public' and table_name = 'feature_usage') then
    execute 'revoke delete, update on public.feature_usage from anon, authenticated';
  end if;

  if exists (select 1 from information_schema.tables
              where table_schema = 'public' and table_name = 'dsa_attempts') then
    execute 'revoke delete, update on public.dsa_attempts from anon, authenticated';
  end if;

  -- Users must never be able to mark their own payment as approved.
  if exists (select 1 from information_schema.tables
              where table_schema = 'public' and table_name = 'payment_requests') then
    execute 'revoke insert, update, delete on public.payment_requests from anon, authenticated';
  end if;
end $$;

-- ── Verify ───────────────────────────────────────────────────────────────────
-- After running, this should return ONLY the whitelisted columns above:
--
--   select column_name, privilege_type
--     from information_schema.column_privileges
--    where table_name = 'profiles' and grantee = 'authenticated'
--      and privilege_type = 'UPDATE'
--    order by column_name;
--
-- `plan`, `email` and `stripe_customer_id` must NOT appear in that list.
