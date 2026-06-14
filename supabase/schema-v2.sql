-- ============================================================
-- ResumeBoost v2 — Supabase schema additions
-- Run AFTER schema.sql (or run both in sequence).
-- Run this in the Supabase SQL editor: Project → SQL → New query.
-- ============================================================

-- ── 1. Extend profiles with new columns ─────────────────────
alter table public.profiles
  add column if not exists preferred_language text not null default 'en',
  add column if not exists target_role        text,
  add column if not exists xp                 int  not null default 0,
  add column if not exists streak             int  not null default 0,
  add column if not exists last_active        timestamptz;

-- ── 2. Add email to job_alerts (for cron delivery) ──────────
alter table public.job_alerts
  add column if not exists email text;

-- ── 3. interview_sessions ────────────────────────────────────
create table if not exists public.interview_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          text not null,
  questions     jsonb not null default '[]',
  answers       jsonb not null default '[]',
  overall_score int,
  created_at    timestamptz not null default now()
);
create index if not exists interview_sessions_user_id_idx on public.interview_sessions (user_id);
create index if not exists interview_sessions_created_idx on public.interview_sessions (created_at desc);

alter table public.interview_sessions enable row level security;

drop policy if exists "interview_sessions_select_own" on public.interview_sessions;
create policy "interview_sessions_select_own" on public.interview_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "interview_sessions_insert_own" on public.interview_sessions;
create policy "interview_sessions_insert_own" on public.interview_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "interview_sessions_delete_own" on public.interview_sessions;
create policy "interview_sessions_delete_own" on public.interview_sessions
  for delete using (auth.uid() = user_id);

-- ── 4. english_progress ──────────────────────────────────────
create table if not exists public.english_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  level      text not null default 'intermediate',
  completed  jsonb not null default '{"lessons": [], "quizzes": [], "totalXp": 0}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists english_progress_user_id_uidx on public.english_progress (user_id);

alter table public.english_progress enable row level security;

drop policy if exists "english_progress_select_own" on public.english_progress;
create policy "english_progress_select_own" on public.english_progress
  for select using (auth.uid() = user_id);

drop policy if exists "english_progress_insert_own" on public.english_progress;
create policy "english_progress_insert_own" on public.english_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "english_progress_update_own" on public.english_progress;
create policy "english_progress_update_own" on public.english_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 5. Helper RPC: safely increment XP ───────────────────────
create or replace function public.increment_xp(user_id uuid, amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last_active timestamptz;
  v_streak int;
  v_now timestamptz := now();
  v_days_since numeric;
begin
  select last_active, streak into v_last_active, v_streak
  from public.profiles where id = user_id;

  if v_last_active is not null then
    v_days_since := extract(epoch from (v_now - v_last_active)) / 86400;
    if v_days_since >= 1 and v_days_since < 2 then
      v_streak := coalesce(v_streak, 0) + 1;
    elsif v_days_since >= 2 then
      v_streak := 1;
    end if;
  else
    v_streak := 1;
  end if;

  update public.profiles
  set xp = coalesce(xp, 0) + amount,
      streak = v_streak,
      last_active = v_now
  where id = user_id;
end;
$$;

-- ── 6. Update roadmaps updated_at trigger (if not already) ──
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists roadmaps_updated_at on public.roadmaps;
create trigger roadmaps_updated_at
  before update on public.roadmaps
  for each row execute function public.set_updated_at();

drop trigger if exists english_progress_updated_at on public.english_progress;
create trigger english_progress_updated_at
  before update on public.english_progress
  for each row execute function public.set_updated_at();

-- ── 7. Update signup trigger to include new fields ───────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, plan, preferred_language, xp, streak)
  values (new.id, new.email, 'free', 'en', 0, 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- (Trigger already exists from schema.sql — no need to recreate)
