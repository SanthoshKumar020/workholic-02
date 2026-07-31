-- ─────────────────────────────────────────────────────────────────────────────
-- 017_rate_limits.sql — durable rate limiting
--
-- Replaces the in-memory limiter in src/lib/rate-limit.ts.
--
-- THE DEFECT
-- That limiter kept counters in a JS Map. Vercel functions are stateless and
-- ephemeral: every cold start begins with an empty Map, and concurrent
-- invocations each have their own. So the "3 anonymous scans per day" cap was
-- really "3 per warm instance", and a burst of traffic — precisely the moment
-- it exists to protect — spawns many instances and multiplies the limit by
-- however many are running. It also can't survive a redeploy.
--
-- Postgres is the only shared state we have, so the counter lives here.
--
-- Cost note: this adds one round trip per limited request. That is worth it —
-- Groq's free tier is 30 requests/minute and 1,000/day, and blowing through it
-- means every visitor in a traffic spike sees a broken tool.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.rate_limits (
  -- sha256(ip + user-agent) or "user:<uuid>", namespaced per feature.
  bucket_key text        not null,
  -- Start of the current window. Part of the key so old windows are separate
  -- rows and cleanup is a simple delete rather than an update.
  window_start timestamptz not null,
  count       integer     not null default 0,
  primary key (bucket_key, window_start)
);

create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;
-- No policies: only the service role touches this. A client-writable counter
-- would let anyone reset their own limit.
revoke select, insert, update, delete on public.rate_limits from anon, authenticated;

/**
 * Atomically consume one token.
 *
 * Returns the count AFTER consuming, so the caller compares against its own
 * limit. Doing the increment and the read in one statement is what makes this
 * safe under concurrency — a read-then-write from the application layer would
 * race, and races are guaranteed here because the whole point is bursts.
 */
create or replace function public.consume_rate_limit(
  p_bucket_key text,
  p_window_seconds integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  -- Floor the current time to the window boundary so every caller in the same
  -- window agrees on the same row without coordinating.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (bucket_key, window_start, count)
  values (p_bucket_key, v_window_start, 1)
  on conflict (bucket_key, window_start)
    do update set count = public.rate_limits.count + 1
  returning count into v_count;

  return v_count;
end;
$$;

grant execute on function public.consume_rate_limit(text, integer) to service_role;

/** Read the current count without consuming — for "you have N left" copy. */
create or replace function public.peek_rate_limit(
  p_bucket_key text,
  p_window_seconds integer
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select count from public.rate_limits
      where bucket_key = p_bucket_key
        and window_start = to_timestamp(
              floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
            )),
    0
  );
$$;

grant execute on function public.peek_rate_limit(text, integer) to service_role;

/**
 * Housekeeping. Called by the daily cron; the table is otherwise append-only
 * and would grow forever.
 */
create or replace function public.prune_rate_limits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limits where window_start < now() - interval '3 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function public.prune_rate_limits() to service_role;

notify pgrst, 'reload schema';
