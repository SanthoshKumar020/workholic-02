-- ─────────────────────────────────────────────────────────────────────────────
-- 009_shared_scans.sql — public, shareable ATS scan results
--
-- Powers the /s/<id> share page and its WhatsApp/LinkedIn preview card.
-- A row is created only when the user explicitly clicks "Share", so nothing
-- becomes public by accident.
--
-- Privacy: we deliberately store NO resume text and no email — only the score,
-- the issue counts, and the teaser tips that were already shown on screen.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.shared_scans (
  -- Short, URL-safe, unguessable id (generated in the API route).
  id            text primary key,
  -- Null for anonymous scans; set when a logged-in user shares.
  user_id       uuid references auth.users (id) on delete set null,
  score         integer not null check (score >= 0 and score <= 100),
  -- Tips shown publicly on the share page (the teaser).
  visible_tips  text[] not null default '{}',
  -- How many further fixes are withheld behind signup.
  locked_count  integer not null default 0 check (locked_count >= 0),
  -- Optional, user-supplied display name ("Priya's resume"). Never auto-filled.
  display_name  text,
  view_count    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists shared_scans_user_id_idx  on public.shared_scans (user_id);
create index if not exists shared_scans_created_at_idx on public.shared_scans (created_at desc);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.shared_scans enable row level security;

-- Anyone (including logged-out visitors and crawlers) may READ a share row.
-- That is the entire point: the id is the capability. Ids are random, so rows
-- are effectively unlisted rather than secret.
drop policy if exists "shared scans are publicly readable" on public.shared_scans;
create policy "shared scans are publicly readable"
  on public.shared_scans
  for select
  using (true);

-- No INSERT/UPDATE/DELETE policies for anon or authenticated roles.
-- Writes go exclusively through the service-role key in /api/share, which
-- bypasses RLS. This stops anyone from spamming the table straight from the
-- browser using the public anon key.

-- Owners may delete their own shares (e.g. from a future "my shares" screen).
drop policy if exists "users can delete their own shares" on public.shared_scans;
create policy "users can delete their own shares"
  on public.shared_scans
  for delete
  using (auth.uid() = user_id);

-- ── View counter ─────────────────────────────────────────────────────────────
-- SECURITY DEFINER so an anonymous visitor can bump the counter without being
-- granted a general UPDATE policy on the table.
create or replace function public.increment_share_view(share_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.shared_scans
     set view_count = view_count + 1
   where id = share_id;
$$;

grant execute on function public.increment_share_view(text) to anon, authenticated;
