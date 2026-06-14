-- ============================================================
-- ResumeBoost — Learning Roadmap table, RLS, and updated_at trigger
-- Run this in the Supabase SQL editor after schema.sql.
-- ============================================================

create table if not exists public.roadmaps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  topic      text not null,
  content    jsonb not null,           -- full RoadmapContent including step.done flags
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roadmaps_user_id_idx on public.roadmaps (user_id);

alter table public.roadmaps enable row level security;

drop policy if exists "roadmaps_select_own" on public.roadmaps;
create policy "roadmaps_select_own" on public.roadmaps
  for select using (auth.uid() = user_id);

drop policy if exists "roadmaps_insert_own" on public.roadmaps;
create policy "roadmaps_insert_own" on public.roadmaps
  for insert with check (auth.uid() = user_id);

drop policy if exists "roadmaps_update_own" on public.roadmaps;
create policy "roadmaps_update_own" on public.roadmaps
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "roadmaps_delete_own" on public.roadmaps;
create policy "roadmaps_delete_own" on public.roadmaps
  for delete using (auth.uid() = user_id);

-- Auto-bump updated_at on every content write (tracks last progress save).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists roadmaps_set_updated_at on public.roadmaps;
create trigger roadmaps_set_updated_at
  before update on public.roadmaps
  for each row execute function public.set_updated_at();
