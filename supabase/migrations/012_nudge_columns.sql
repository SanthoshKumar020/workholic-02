-- ─────────────────────────────────────────────────────────────────────────────
-- 012_nudge_columns.sql
--
-- Supports the daily re-engagement cron (/api/cron/nudge).
--
-- `last_active` and `streak` have been sitting in `profiles` since the start
-- and no job ever read them, so nothing in the product ever invited a user
-- back. These two columns add the state needed to do that without becoming a
-- nuisance: when we last emailed someone, and whether they've asked us to stop.
-- ─────────────────────────────────────────────────────────────────────────────

-- NOTE: superseded by 014_reconcile_profile_columns.sql — run that instead.
-- This file originally assumed `profiles.last_active` existed and failed with
-- "ERROR: 42703: column last_active does not exist", which is what uncovered
-- the wider schema drift. Kept here, made safe to re-run, for history.

alter table public.profiles
  add column if not exists last_nudged_at timestamptz,
  add column if not exists nudge_opt_out  boolean not null default false;

-- The cron scans by last_active within a window; this keeps that cheap as the
-- user table grows. Guarded, because the column may not exist yet — 014 adds
-- it along with everything else the app assumes.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'profiles'
       and column_name = 'last_active'
  ) then
    execute 'create index if not exists profiles_last_active_idx
               on public.profiles (last_active)
              where last_active is not null';
  end if;
end $$;

-- Both columns are written ONLY by the service-role cron and the unsubscribe
-- route. Migration 010 revoked blanket UPDATE on profiles and granted back a
-- specific column list; these are deliberately NOT added to it, so a user
-- cannot mark themselves as recently-nudged to suppress email, nor clear
-- someone else's opt-out.
--
-- Verify the grant list still excludes them:
--
--   select column_name from information_schema.column_privileges
--    where table_name = 'profiles' and grantee = 'authenticated'
--      and privilege_type = 'UPDATE';
