-- ─────────────────────────────────────────────────────────────────────────────
-- 015_institutions.sql
--
-- B2B: colleges, placement cells and training institutes.
--
-- Commercially this is the highest-value table in the schema. One 600-student
-- contract at ₹99–299/student/year is ₹60,000–1,80,000 — more than 2,000
-- consumer Pro subscribers, from a single conversation. It also needs no
-- consumer traffic, which is the constraint everything else is under.
--
-- Design notes
--  • Students join with a short code rather than being bulk-imported. A TPO
--    cannot legally hand us a spreadsheet of student emails and consent on
--    their behalf under the DPDP Act; the student creating their own account
--    and entering a code is consent they actually gave.
--  • Batch analytics are AGGREGATE ONLY. A placement officer sees "average 61,
--    38% below 60, top gap: SQL" — never an individual student's score. That
--    is both the DPDP-safe design and the one a student would accept if they
--    read the privacy policy. Sell the batch view, not surveillance.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.institutions (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  slug          text        not null unique,
  contact_email text,
  -- Short, human-readable code a student types at signup (e.g. "RVCE-2026").
  join_code     text        not null unique,
  -- Seats purchased. Enforced on join so an unpaid batch can't balloon.
  seat_limit    integer     not null default 0 check (seat_limit >= 0),
  -- Access ends when the placement season does.
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.institution_members (
  institution_id uuid not null references public.institutions (id) on delete cascade,
  user_id        uuid not null references auth.users (id)          on delete cascade,
  -- 'admin' = placement officer / staff, 'student' = batch member.
  role           text not null default 'student' check (role in ('admin', 'student')),
  -- Free-text so a college can segment by department or graduating year.
  batch_label    text,
  joined_at      timestamptz not null default now(),
  primary key (institution_id, user_id)
);

create index if not exists institution_members_user_idx on public.institution_members (user_id);
create index if not exists institution_members_inst_idx on public.institution_members (institution_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.institutions        enable row level security;
alter table public.institution_members enable row level security;

-- A member may read their own institution's record (name, expiry) — not others'.
drop policy if exists "members read their institution" on public.institutions;
create policy "members read their institution"
  on public.institutions for select
  using (
    exists (
      select 1 from public.institution_members m
       where m.institution_id = institutions.id
         and m.user_id = auth.uid()
    )
  );

-- A user may read their own membership rows.
drop policy if exists "read own membership" on public.institution_members;
create policy "read own membership"
  on public.institution_members for select
  using (user_id = auth.uid());

-- Deliberately NO insert/update/delete policies. Everything is written by the
-- service role via /api/institution/*, because:
--   • joining must check the seat limit and expiry (a client-side insert
--     could not be trusted to),
--   • nobody should be able to promote themselves to 'admin' and unlock the
--     batch analytics for a college they don't work at.
revoke insert, update, delete on public.institutions        from anon, authenticated;
revoke insert, update, delete on public.institution_members from anon, authenticated;

-- ── Institution membership implies Pro ───────────────────────────────────────
-- The college pays; the student should not also be asked to. This is read by
-- isUserPro() via a lookup rather than by flipping profiles.plan, so that
-- access lapses automatically when the contract expires and we never have to
-- remember to downgrade a whole batch by hand.
create or replace function public.has_active_institution(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.institution_members m
      join public.institutions i on i.id = m.institution_id
     where m.user_id = uid
       and (i.expires_at is null or i.expires_at > now())
  );
$$;

grant execute on function public.has_active_institution(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';

-- ── Seeding a pilot college ──────────────────────────────────────────────────
-- Run this once per signed college, then give the TPO the join code:

  insert into public.institutions (name, slug, join_code, seat_limit, expires_at)
  values ('RV College of Engineering', 'rvce', 'RVCE-2026', 600,
          now() + interval '12 months');

-- Make the placement officer an admin after they sign up normally:

  insert into public.institution_members (institution_id, user_id, role)
  select i.id, u.id, 'admin'
    from public.institutions i, auth.users u
   where i.slug = 'rvce' and u.email = 'tpo@rvce.edu.in';
