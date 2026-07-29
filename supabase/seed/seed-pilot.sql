-- ─────────────────────────────────────────────────────────────────────────────
-- seed-pilot.sql — populate a test college so /institution renders
--
-- WHY THIS IS SQL AND NOT A CSV
-- institution_members.user_id is a foreign key to auth.users. A CSV of
-- invented UUIDs fails on insert, and there is no way to know real user ids
-- ahead of time. So members have to be derived from users that actually
-- exist. This script creates the test users too, then wires everything up.
--
-- TEST DATA ONLY. Every account below uses @pilot.test, which is not a real
-- domain, so nothing can ever be emailed to them. Cleanup is at the bottom —
-- run it before you take this anywhere near production numbers.
--
-- Run the whole file in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. The college ────────────────────────────────────────────────────────────
insert into public.institutions (name, slug, contact_email, join_code, seat_limit, expires_at)
values ('HYRISE Pilot College', 'hyrise-pilot', 'admin@swache.in', 'PILOT-2026', 50,
        now() + interval '12 months')
on conflict (slug) do update
  set join_code  = excluded.join_code,
      seat_limit = excluded.seat_limit,
      expires_at = excluded.expires_at;

-- ── 2. Eight test students ────────────────────────────────────────────────────
-- Inserting into auth.users directly is fine for seed data. The
-- handle_new_user trigger creates the matching profiles row automatically.
-- Password hash is a dummy — these accounts are not meant to be logged into.
do $$
declare
  emails text[] := array[
    'student1@pilot.test','student2@pilot.test','student3@pilot.test','student4@pilot.test',
    'student5@pilot.test','student6@pilot.test','student7@pilot.test','student8@pilot.test'
  ];
  e text;
begin
  foreach e in array emails loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    )
    values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      e, crypt('pilot-test-not-a-real-login', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
    )
    on conflict (email) do nothing;
  end loop;
end $$;

-- Safety net in case the trigger wasn't installed when these were created.
insert into public.profiles (id, email)
select u.id, u.email
  from auth.users u
  left join public.profiles p on p.id = u.id
 where u.email like '%@pilot.test' and p.id is null
on conflict (id) do nothing;

-- ── 3. Enrol them, split across two batches ───────────────────────────────────
insert into public.institution_members (institution_id, user_id, role, batch_label)
select i.id,
       u.id,
       'student',
       case when right(u.email, 12) in ('1@pilot.test','2@pilot.test','3@pilot.test','4@pilot.test')
            then 'CSE 2026' else 'ECE 2026' end
  from public.institutions i
  cross join auth.users u
 where i.slug = 'hyrise-pilot'
   and u.email like '%@pilot.test'
on conflict (institution_id, user_id) do nothing;

-- College-sponsored access, same as the join API grants.
update public.profiles p
   set plan = 'pro'
  from public.institution_members m
 where m.user_id = p.id
   and m.institution_id = (select id from public.institutions where slug = 'hyrise-pilot');

-- ── 4. Make YOURSELF the placement-cell admin ─────────────────────────────────
-- Change the email if your HYRISE login differs.
insert into public.institution_members (institution_id, user_id, role, batch_label)
select i.id, u.id, 'admin', null
  from public.institutions i, auth.users u
 where i.slug = 'hyrise-pilot'
   and u.email = 'santhosh.k@swache.in'
on conflict (institution_id, user_id) do update set role = 'admin';

-- ── 5. Sample activity so the dashboard isn't empty ───────────────────────────
-- Spread of scores: some at risk (<60), some ready (75+), two with no resume
-- at all — the realistic shape a TPO would actually see.
insert into public.resumes (user_id, title, target_role, original_text, enhanced_text, ats_score, template_id, created_at)
select u.id,
       'Pilot resume',
       'Software Engineer',
       'seed',
       'seed',
       s.score,
       'classic',
       now() - (s.days || ' days')::interval
  from auth.users u
  join (values
      ('student1@pilot.test', 42, 20), ('student1@pilot.test', 71, 3),
      ('student2@pilot.test', 55, 12), ('student2@pilot.test', 68, 2),
      ('student3@pilot.test', 81, 8),
      ('student4@pilot.test', 34, 15), ('student4@pilot.test', 59, 1),
      ('student5@pilot.test', 77, 6),
      ('student6@pilot.test', 91, 4)
    ) as s(email, score, days) on s.email = u.email;

insert into public.interview_sessions (user_id, created_at)
select u.id, now() - interval '2 days'
  from auth.users u
 where u.email in ('student1@pilot.test','student3@pilot.test','student5@pilot.test','student6@pilot.test');

insert into public.feature_usage (user_id, feature)
select u.id, f.feature
  from auth.users u
  join (values
      ('student1@pilot.test','ats-check'), ('student1@pilot.test','match'),
      ('student2@pilot.test','ats-check'), ('student3@pilot.test','interview-questions'),
      ('student3@pilot.test','ats-check'), ('student5@pilot.test','match'),
      ('student6@pilot.test','dsa'),       ('student6@pilot.test','aptitude')
    ) as f(email, feature) on f.email = u.email;

notify pgrst, 'reload schema';

-- ── Verify ────────────────────────────────────────────────────────────────────
-- Expect 8 students + 1 admin:
--   select role, count(*) from public.institution_members m
--     join public.institutions i on i.id = m.institution_id
--    where i.slug = 'hyrise-pilot' group by role;
--
-- Then open /institution while logged in as the admin.
-- Analytics need 5+ students; 8 clears that.

-- ─────────────────────────────────────────────────────────────────────────────
-- CLEANUP — run this to remove every trace of the seed
-- ─────────────────────────────────────────────────────────────────────────────
-- delete from public.feature_usage      where user_id in (select id from auth.users where email like '%@pilot.test');
-- delete from public.interview_sessions where user_id in (select id from auth.users where email like '%@pilot.test');
-- delete from public.resumes            where user_id in (select id from auth.users where email like '%@pilot.test');
-- delete from public.institution_members where user_id in (select id from auth.users where email like '%@pilot.test');
-- delete from auth.users where email like '%@pilot.test';   -- profiles cascade
-- delete from public.institution_members where institution_id = (select id from public.institutions where slug='hyrise-pilot');
-- delete from public.institutions where slug = 'hyrise-pilot';
