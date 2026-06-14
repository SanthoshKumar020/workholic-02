-- ============================================================
-- ResumeBoost — Supabase schema, RLS policies, and signup trigger
-- Run this in the Supabase SQL editor (Project → SQL → New query).
-- ============================================================

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- profiles
-- One row per auth user. Auto-created on signup by trigger below.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text,
  plan               text not null default 'free',          -- 'free' | 'pro'
  stripe_customer_id text,
  created_at         timestamptz not null default now()
);

-- ------------------------------------------------------------
-- resumes
-- ------------------------------------------------------------
create table if not exists public.resumes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null default 'Untitled resume',
  target_role   text,
  original_text text,
  enhanced_text text,
  ats_score     int,
  template_id   text default 'classic',
  created_at    timestamptz not null default now()
);
create index if not exists resumes_user_id_idx on public.resumes (user_id);

-- ------------------------------------------------------------
-- job_alerts
-- ------------------------------------------------------------
create table if not exists public.job_alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  keywords   text,
  role       text,
  frequency  text not null default 'daily',                 -- 'daily' | 'weekly'
  enabled    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists job_alerts_user_id_idx on public.job_alerts (user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.resumes    enable row level security;
alter table public.job_alerts enable row level security;

-- profiles: a user can see / update only their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- resumes: full CRUD scoped to the owner.
drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own" on public.resumes
  for select using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own" on public.resumes
  for insert with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own" on public.resumes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own" on public.resumes
  for delete using (auth.uid() = user_id);

-- job_alerts: full CRUD scoped to the owner.
drop policy if exists "job_alerts_select_own" on public.job_alerts;
create policy "job_alerts_select_own" on public.job_alerts
  for select using (auth.uid() = user_id);

drop policy if exists "job_alerts_insert_own" on public.job_alerts;
create policy "job_alerts_insert_own" on public.job_alerts
  for insert with check (auth.uid() = user_id);

drop policy if exists "job_alerts_update_own" on public.job_alerts;
create policy "job_alerts_update_own" on public.job_alerts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "job_alerts_delete_own" on public.job_alerts;
create policy "job_alerts_delete_own" on public.job_alerts
  for delete using (auth.uid() = user_id);

-- NOTE: The service-role key bypasses RLS. Stripe webhooks and other
-- admin server routes use it to update any user's plan safely.

-- ============================================================
-- Auto-create a profile row when a new auth user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Storage bucket for resume file uploads (optional)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Storage RLS: users can manage only files under a folder named after their uid.
drop policy if exists "resume_files_select_own" on storage.objects;
create policy "resume_files_select_own" on storage.objects
  for select using (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resume_files_insert_own" on storage.objects;
create policy "resume_files_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resume_files_delete_own" on storage.objects;
create policy "resume_files_delete_own" on storage.objects
  for delete using (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );
