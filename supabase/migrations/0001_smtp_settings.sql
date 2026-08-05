-- SMTP configuration, editable from /admin/settings.
--
-- The table holds a password, so it is deliberately unreachable with the
-- publishable key: row level security is enabled and NO policies are created.
-- That denies anon and authenticated roles everything. Only the server, using
-- the secret key, can read or write it — see lib/supabase/admin.ts.
--
-- One row only: `singleton` is unique and defaults to true, so a second insert
-- fails rather than silently creating a competing configuration.

create table if not exists public.smtp_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,

  enabled boolean not null default false,

  host text not null default '',
  port integer not null default 587,
  -- true for implicit TLS (port 465); false uses STARTTLS
  secure boolean not null default false,
  username text not null default '',
  password text not null default '',

  from_name text not null default '',
  from_email text not null default '',
  reply_to text not null default '',
  -- comma separated list of addresses that receive enquiries
  recipients text not null default '',

  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.smtp_settings enable row level security;

-- Seed the single row so the admin form always has something to update.
insert into public.smtp_settings (singleton)
values (true)
on conflict (singleton) do nothing;

comment on table public.smtp_settings is
  'Outgoing mail configuration. Server-side access only; RLS denies all client roles.';
