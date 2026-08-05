-- ─────────────────────────────────────────────────────────────────────────────
-- 018_ai_telemetry.sql — cost guard, circuit breaker, and lead capture
--
-- Three tables that between them answer the questions you currently cannot:
--
--   ai_events      · what did inference cost, and who spent it?
--   capacity_queue · who did we turn away when both providers were down?
--   ats_leads      · who saw a score and gave us an email?
--
-- ── Why the cost guard matters at this size ──────────────────────────────────
-- Mock interviews are the expensive path: roughly ₹3.60 of inference per
-- 20-turn session against ~₹24 net revenue on a ₹299/90-day plan. That margin
-- is fine on average and ruinous in the tail — one enthusiastic user running
-- forty sessions a month costs more than they paid. Per-request token logging
-- is what turns that from a surprise on a monthly bill into an alert.
--
-- ── Why the queue matters ────────────────────────────────────────────────────
-- When Groq and Gemini are both down, the alternative to a queue is showing an
-- error and losing the person. Capturing the email keeps the lead and gives us
-- a reason to write again — the visitor came to fix their resume, and they will
-- still want that in an hour.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── AI telemetry ─────────────────────────────────────────────────────────────

create table if not exists public.ai_events (
  id          bigserial   primary key,
  -- Null for anonymous callers (the ATS checker is deliberately no-login).
  user_id     uuid        references auth.users (id) on delete set null,
  feature     text        not null,
  provider    text        not null check (provider in ('groq', 'gemini')),
  model       text,
  -- Null when the request failed before returning usage.
  prompt_tokens     integer,
  completion_tokens integer,
  -- Denormalised so the digest and the guard don't re-derive pricing from a
  -- rate card that may have changed since. Stored in paise (₹1 = 100 paise) to
  -- keep it integral — floating-point money in a summed column is how you get
  -- a cost report that disagrees with itself.
  cost_paise  integer     not null default 0,
  -- 'ok' | 'error'. Errors are rows too: `ai_error {provider, code}` in the
  -- analytics spec is answered from this table.
  status      text        not null default 'ok' check (status in ('ok', 'error')),
  error_code  text,
  latency_ms  integer,
  created_at  timestamptz not null default now()
);

-- The three access patterns: the per-user monthly guard, the daily digest, and
-- the error breakdown.
create index if not exists ai_events_user_month_idx on public.ai_events (user_id, created_at desc);
create index if not exists ai_events_created_idx    on public.ai_events (created_at desc);
create index if not exists ai_events_status_idx     on public.ai_events (status, created_at desc)
  where status = 'error';

alter table public.ai_events enable row level security;
-- No policies. Only the service role writes and reads this: it contains the
-- shape of our cost base, and a client-writable spend log is a client-editable
-- one.
revoke select, insert, update, delete on public.ai_events from anon, authenticated;

/**
 * Rupees of inference a user has spent in the last 30 days.
 *
 * Used by the cost guard on the expensive paths. Deliberately a rolling 30 days
 * rather than a calendar month: a calendar reset lets someone spend the cap
 * twice across a month boundary in two days.
 */
create or replace function public.ai_spend_rupees(p_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(cost_paise), 0) / 100.0
    from public.ai_events
   where user_id = p_user_id
     and created_at > now() - interval '30 days';
$$;

grant execute on function public.ai_spend_rupees(uuid) to service_role;

/**
 * One row of counters for the daily digest. A single round trip rather than
 * five, because the cron runs on a free-tier function with a short budget.
 */
create or replace function public.ai_daily_digest(p_hours integer default 24)
returns table (
  calls          bigint,
  errors         bigint,
  spend_rupees   numeric,
  groq_calls     bigint,
  gemini_calls   bigint,
  unique_users   bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)                                                   as calls,
    count(*) filter (where status = 'error')                   as errors,
    coalesce(sum(cost_paise), 0) / 100.0                       as spend_rupees,
    count(*) filter (where provider = 'groq'   and status = 'ok') as groq_calls,
    count(*) filter (where provider = 'gemini' and status = 'ok') as gemini_calls,
    count(distinct user_id)                                    as unique_users
  from public.ai_events
  where created_at > now() - make_interval(hours => p_hours);
$$;

grant execute on function public.ai_daily_digest(integer) to service_role;

/**
 * Users over a spend threshold in the last 30 days. Feeds the digest's
 * "somebody is costing you money" line.
 */
create or replace function public.ai_spend_offenders(p_threshold_rupees numeric default 50)
returns table (user_id uuid, email text, spend_rupees numeric, calls bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.user_id,
         u.email::text,
         sum(e.cost_paise) / 100.0 as spend_rupees,
         count(*)                  as calls
    from public.ai_events e
    join auth.users u on u.id = e.user_id
   where e.created_at > now() - interval '30 days'
     and e.user_id is not null
   group by e.user_id, u.email
  having sum(e.cost_paise) / 100.0 >= p_threshold_rupees
   order by 3 desc;
$$;

grant execute on function public.ai_spend_offenders(numeric) to service_role;

-- ── Circuit-breaker queue ────────────────────────────────────────────────────

create table if not exists public.capacity_queue (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  feature     text        not null,
  -- The input needed to fulfil the request later (resume text, JD, etc.).
  -- Capped in the API layer; a queue row is not a file store.
  payload     jsonb       not null default '{}'::jsonb,
  status      text        not null default 'pending'
                check (status in ('pending', 'sent', 'failed', 'abandoned')),
  attempts    integer     not null default 0,
  last_error  text,
  created_at  timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists capacity_queue_pending_idx
  on public.capacity_queue (created_at)
  where status = 'pending';

alter table public.capacity_queue enable row level security;
revoke select, insert, update, delete on public.capacity_queue from anon, authenticated;

-- ── ATS lead capture ─────────────────────────────────────────────────────────
--
-- Separate from `email_subscribers` on purpose. A subscriber asked for a
-- newsletter; an ATS lead handed over an email to unlock the rest of a report
-- they were already looking at. They warrant different sequences, and merging
-- them would mean either newslettering people who didn't ask or dropping the
-- day-0/2/5/10 sequence for people who did.

create table if not exists public.ats_leads (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null unique,
  -- The score they saw. This is the whole reason the day-2 email can say
  -- something specific instead of "hope you're well".
  ats_score   integer     check (ats_score between 0 and 100),
  -- The full report, so the drip sequence can quote their actual issues
  -- without re-running inference (and re-charging us) days later.
  report      jsonb       not null default '{}'::jsonb,
  source      text,
  -- Which emails in the day-0/2/5/10 sequence have gone out.
  sequence_stage integer  not null default 0,
  last_emailed_at timestamptz,
  unsubscribed_at timestamptz,
  -- Set once they create an account, so we stop selling them the thing they
  -- already have.
  converted_user_id uuid  references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists ats_leads_sequence_idx
  on public.ats_leads (sequence_stage, last_emailed_at)
  where unsubscribed_at is null and converted_user_id is null;

alter table public.ats_leads enable row level security;
revoke select, insert, update, delete on public.ats_leads from anon, authenticated;

-- ── Pending reports (the email gate's hand-off) ──────────────────────────────
--
-- An anonymous visitor sees 2 of 6 categories and is offered the rest by
-- email. The full report is parked here under an opaque id and claimed when
-- they submit the address.
--
-- Why park it rather than re-run the check when the email arrives:
--   • The emailed report must be the SAME analysis they are looking at. A
--     second inference run produces different wording, which reads as though
--     we made the first one up.
--   • It halves inference cost on the single highest-volume path.
--   • It means the gate can't be a lie — the four locked categories provably
--     already exist at the moment we ask for the email.

create table if not exists public.ats_pending_reports (
  id         uuid        primary key default gen_random_uuid(),
  report     jsonb       not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Unclaimed rows are the common case — most visitors never give an email.
create index if not exists ats_pending_reports_created_idx on public.ats_pending_reports (created_at);

alter table public.ats_pending_reports enable row level security;
revoke select, insert, update, delete on public.ats_pending_reports from anon, authenticated;

/**
 * Expire unclaimed reports.
 *
 * These hold resume text-derived analysis for people who never gave us an
 * email — i.e. personal data with no relationship and no consent to retain.
 * Twenty-four hours is far longer than the seconds the flow actually needs,
 * and keeping them beyond that is neither useful nor defensible under the
 * DPDP Act's purpose-limitation requirement. Called by the daily digest cron.
 */
create or replace function public.prune_ats_pending_reports()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.ats_pending_reports
   where created_at < now() - interval '24 hours';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function public.prune_ats_pending_reports() to service_role;

notify pgrst, 'reload schema';
