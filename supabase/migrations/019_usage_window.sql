-- ─────────────────────────────────────────────────────────────────────────────
-- 019_usage_window.sql — make per-month allowances countable
--
-- The paid plan is now "50 AI actions and 10 mock interviews per month" rather
-- than "unlimited" (§2.1). Enforcing that means counting `feature_usage` rows
-- inside a rolling 30-day window, which needs a timestamp and an index on it.
--
-- `feature_usage` predates this migration series (it has no create statement in
-- supabase/migrations — it was applied directly), so everything here is written
-- to be safe whether or not the column already exists. A missing `created_at`
-- would make every paid user look like they had used nothing, which is exactly
-- the "unlimited" behaviour this replaces — silently, and only discovered on an
-- inference bill.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from information_schema.tables
                  where table_schema = 'public' and table_name = 'feature_usage') then
    raise notice 'feature_usage does not exist; skipping';
    return;
  end if;

  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public'
                    and table_name = 'feature_usage'
                    and column_name = 'created_at') then
    alter table public.feature_usage
      add column created_at timestamptz not null default now();
    raise notice 'added feature_usage.created_at';
  end if;
end $$;

-- The exact shape of the allowance query: rows for one user, in one window,
-- filtered by feature.
create index if not exists feature_usage_user_created_idx
  on public.feature_usage (user_id, created_at desc);

create index if not exists feature_usage_user_feature_idx
  on public.feature_usage (user_id, feature);

notify pgrst, 'reload schema';
