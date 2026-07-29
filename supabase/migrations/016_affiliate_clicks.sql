-- ─────────────────────────────────────────────────────────────────────────────
-- 016_affiliate_clicks.sql
--
-- Our own record of partner-link clicks.
--
-- Affiliate networks under-report — sometimes by a lot, and always in their
-- favour. Without an independent click log you cannot tell whether a
-- placement is working, you cannot spot a broken tracking link, and you have
-- no numbers of your own when negotiating a direct CPL deal later. Direct
-- deals pay several times the network rate, and "we send X clicks a month,
-- here's our own data" is the whole argument.
--
-- Deliberately minimal: enough to answer "which recommendation earns its
-- place?" and nothing more. No resume text, no job description, no IP.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.affiliate_clicks (
  id          bigserial primary key,
  -- Null for logged-out visitors. We do not create an identity to track them.
  user_id     uuid references auth.users (id) on delete set null,
  partner_id  text not null,          -- 'coursera', 'scaler', …
  skill_label text,                   -- the gap that triggered it, e.g. 'System design'
  surface     text,                   -- 'match_result' | 'blog' | 'roadmap'
  created_at  timestamptz not null default now()
);

create index if not exists affiliate_clicks_partner_idx on public.affiliate_clicks (partner_id, created_at desc);
create index if not exists affiliate_clicks_surface_idx on public.affiliate_clicks (surface, created_at desc);

alter table public.affiliate_clicks enable row level security;

-- No policies for anon/authenticated: writes go through /api/affiliate/click
-- with the service role, reads are for the owner via SQL. A client-writable
-- analytics table is a spam target, and the numbers have to be trustworthy
-- precisely because they're the basis for a commercial negotiation.
revoke insert, update, delete, select on public.affiliate_clicks from anon, authenticated;

notify pgrst, 'reload schema';

-- ── Reporting ────────────────────────────────────────────────────────────────
-- Clicks by partner, last 30 days:
--
--   select partner_id, count(*) as clicks
--     from public.affiliate_clicks
--    where created_at > now() - interval '30 days'
--    group by partner_id order by clicks desc;
--
-- Which skill gaps actually drive clicks (i.e. which recommendations earn
-- their slot — drop the ones that never get clicked):
--
--   select skill_label, surface, count(*) as clicks
--     from public.affiliate_clicks
--    where created_at > now() - interval '30 days'
--    group by skill_label, surface order by clicks desc;
