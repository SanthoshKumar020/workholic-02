-- email_subscribers: newsletter / weekly tips opt-in list
create table if not exists email_subscribers (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  subscribed_at timestamptz not null default now()
);

-- Only admins can read; inserts are done via service_role key in the API route
alter table email_subscribers enable row level security;

create policy "service_role full access"
  on email_subscribers for all
  to service_role
  using (true)
  with check (true);

-- contact_messages: inbound support messages from /contact page
create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  created_at timestamptz not null default now(),
  resolved   boolean not null default false
);

alter table contact_messages enable row level security;

create policy "service_role full access"
  on contact_messages for all
  to service_role
  using (true)
  with check (true);
