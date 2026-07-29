-- ─────────────────────────────────────────────────────────────────────────────
-- 011_backfill_missing_profiles.sql
--
-- Fixes the "log in, click any menu item, get sent back to login" loop.
--
-- CAUSE
-- Every guarded page does:
--     const profile = await getCurrentProfile();
--     if (!profile) redirect("/login?redirectTo=…");
--
-- `getCurrentProfile()` returned null both when nobody was signed in AND when
-- a signed-in user had no row in `profiles`. In the second case the user was
-- redirected to /login while already authenticated — login succeeded, sent
-- them back, and the page bounced them again. Forever. The navbar kept showing
-- "Sign out" throughout, because it only checks the auth session and never
-- looks at `profiles`.
--
-- A row can be missing because `handle_new_user` only fires for inserts into
-- `auth.users` that happen AFTER the trigger was installed. Any account created
-- before that — or during a period when the trigger errored — has no profile.
--
-- The application now heals this on demand (src/lib/plan.ts), but that only
-- runs when the user next visits. This backfills everyone in one go.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the missing rows.
insert into public.profiles (id, email)
select u.id, u.email
  from auth.users u
  left join public.profiles p on p.id = u.id
 where p.id is null
on conflict (id) do nothing;

-- 2. Make sure the trigger is actually installed and current. `create or
--    replace` + re-created trigger is idempotent, so this is safe to re-run.
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
exception
  -- Never let a profile-insert failure block the signup itself. A missing
  -- profile is now recoverable; a failed signup is not.
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Verify ───────────────────────────────────────────────────────────────────
-- Should return 0:
--
--   select count(*)
--     from auth.users u
--     left join public.profiles p on p.id = u.id
--    where p.id is null;
