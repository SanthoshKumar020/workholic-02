-- ─────────────────────────────────────────────────────────────────────────────
-- 020_plan_expiry.sql — make the 90-day plan actually end
--
-- The paid plan is now a one-time ₹299 purchase granting 90 days (§2.1), not a
-- recurring subscription. Recurring billing carried its own expiry for free:
-- the mandate stopped, the plan stopped. A one-time payment does not, so
-- without this every buyer would be permanently Pro after a single ₹299.
--
-- ── Why a nightly sweep rather than a check in isPro() ───────────────────────
-- `isPro(plan)` is called from twenty-seven pages and routes, several of which
-- only have the plan string and no profile row to read a timestamp from.
-- Threading an expiry through all of them is a lot of surface area for a
-- guarantee that must hold everywhere — one missed call site is a permanently
-- free account. Downgrading the row itself means every existing check keeps
-- working unmodified and is correct by construction.
--
-- The tradeoff is up to 24 hours of grace past expiry. That is the right side
-- to err on: a customer getting a free extra day is a rounding error, and
-- cutting someone off mid-mock-interview is not.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists plan_expires_at timestamptz;

comment on column public.profiles.plan_expires_at is
  'When a one-time paid plan lapses. Null = no expiry (free, or a manually granted plan).';

-- Partial: only rows with an expiry are ever scanned by the sweep.
create index if not exists profiles_plan_expiry_idx
  on public.profiles (plan_expires_at)
  where plan_expires_at is not null;

/**
 * Downgrade everyone whose 90 days are up. Returns how many were downgraded.
 * Called nightly by /api/cron/daily-digest.
 */
create or replace function public.expire_lapsed_plans()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.profiles
     set plan = 'free',
         plan_expires_at = null
   where plan = 'pro'
     and plan_expires_at is not null
     and plan_expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.expire_lapsed_plans() to service_role;

-- Migration 010 restricts what `authenticated` may write to `profiles`. The new
-- column must be covered by the same restriction, or a user could grant
-- themselves an expiry a decade out.
revoke update (plan_expires_at) on public.profiles from anon, authenticated;

notify pgrst, 'reload schema';
