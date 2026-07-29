-- ─────────────────────────────────────────────────────────────────────────────
-- 014_reconcile_profile_columns.sql
--
-- RUN THIS ONE. It supersedes the column work in 010, 012 and 013.
--
-- Migration 012 failed with:
--     ERROR: 42703: column "last_active" does not exist
--
-- which revealed the real problem: `public.profiles` in the live database is
-- missing columns the application has always assumed. `schema.sql` defines
-- only five (id, email, plan, stripe_customer_id, created_at); everything else
-- was added ad hoc over time, and `last_active` never was.
--
-- The consequence is bigger than a failed migration. `awardXp` does:
--     .select("xp, streak, last_active")
-- If any of those columns is absent, PostgREST errors, `data` comes back null,
-- the function returns early — and because callers wrapped it in
-- `.then(() => null, () => null)` the failure was swallowed silently. So the
-- XP and streak system has, in all likelihood, never worked in production:
-- no error, no XP, no streak, no clue anything was wrong.
--
-- This migration makes the table match what the code expects, then re-applies
-- the column grants so the new columns are actually writable.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add every column the application uses ─────────────────────────────────
-- `if not exists` throughout, so this is safe to run on a database that
-- already has some or all of them.
alter table public.profiles
  -- Personalisation (feeds the interview, tailor, salary, outreach, mentor
  -- and chat prompts).
  add column if not exists target_role        text,
  add column if not exists preferred_language text default 'en',

  -- Engagement.
  add column if not exists xp          integer     not null default 0,
  add column if not exists streak      integer     not null default 0,
  add column if not exists last_active timestamptz,
  add column if not exists dsa_mode    text,

  -- Public profile (/p/<username>).
  add column if not exists username        text,
  add column if not exists public_bio      text,
  add column if not exists is_public       boolean not null default false,
  add column if not exists linkedin_url    text,
  add column if not exists github_url      text,
  add column if not exists portfolio_url   text,
  add column if not exists completed_certs text[] default '{}',

  -- Re-engagement email state (was migration 012).
  add column if not exists last_nudged_at timestamptz,
  add column if not exists nudge_opt_out  boolean not null default false;

-- Public profile lookups go by username, and it must be unique.
create unique index if not exists profiles_username_key
  on public.profiles (lower(username))
  where username is not null;

-- The nudge cron scans by last_active within a date window.
create index if not exists profiles_last_active_idx
  on public.profiles (last_active)
  where last_active is not null;

-- ── 2. Re-apply column grants ────────────────────────────────────────────────
-- Columns added above have no grants yet, so without this the same
-- "permission denied" failure that broke onboarding would hit the new ones.
--
-- Denylist rather than allowlist: computed against the live schema, so a
-- column added out-of-band tomorrow behaves sensibly instead of silently
-- breaking a form. ADD TO `denied` when introducing a sensitive column.
do $$
declare
  col text;
  denied text[] := array[
    'id',
    'email',
    'plan',                -- the paywall; service-role only
    'stripe_customer_id',
    'created_at',
    'last_nudged_at',      -- else a user could suppress their own email
    'nudge_opt_out'        -- only /api/unsubscribe may set this
  ];
begin
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

-- ── Verify ───────────────────────────────────────────────────────────────────
-- 1. Nothing missing — expect zero rows:
--
--   select c.name from unnest(array[
--     'target_role','preferred_language','xp','streak','last_active','dsa_mode',
--     'username','public_bio','is_public','linkedin_url','github_url',
--     'portfolio_url','completed_certs','last_nudged_at','nudge_opt_out'
--   ]) as c(name)
--   where not exists (
--     select 1 from information_schema.columns
--      where table_schema='public' and table_name='profiles' and column_name=c.name
--   );
--
-- 2. The paywall is still locked — expect zero rows:
--
--   select column_name from information_schema.column_privileges
--    where table_name='profiles' and grantee='authenticated'
--      and privilege_type='UPDATE'
--      and column_name in ('plan','email','stripe_customer_id');
--
-- 3. Streaks can now actually record. After using any XP-earning tool:
--
--   select id, xp, streak, last_active from public.profiles
--    where last_active is not null order by last_active desc limit 5;
