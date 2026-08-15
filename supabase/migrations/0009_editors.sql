-- Who may use the administration, kept where it can be changed without a
-- deployment.
--
-- Until now the allowlist lived in the `ADMIN_EMAILS` environment variable, so
-- adding a colleague meant editing a Vercel setting and redeploying — work only
-- the developer could do, for a decision that belongs to whoever runs the site.
--
-- The variable does not go away. It stays as the way back in: the effective
-- allowlist is the union of this table and that variable, so a row deleted by
-- mistake, or a database that cannot be reached, still leaves the owner with a
-- door. That is why a failed read of this table denies everyone *except* the
-- addresses in the variable, rather than denying everyone outright or — far
-- worse — letting everyone through.
--
-- A row here grants access. It does not create the Supabase account: the
-- administration creates that through the auth admin API at the same moment, and
-- removing a row revokes access while leaving the account intact. Enquiries
-- record who handled them by e-mail address, and deleting the account would turn
-- those into references to somebody who no longer exists.
--
-- RLS is enabled with no policies, like every other table here: the browser
-- cannot reach it at all, only the server with the secret key. That matters more
-- for this table than for most — it is the one that decides who gets in.

create table if not exists public.editors (
  -- Lower-cased on the way in, and the constraint makes that an invariant rather
  -- than a habit: two rows differing only in case would be two editors as far as
  -- a lookup is concerned, and only one of them would ever match.
  email text primary key check (email = lower(email) and email <> ''),

  -- Free text for whoever reads the list in a year: a name, a role, a reason.
  note text not null default '',

  created_at timestamptz not null default now(),
  -- The address of the editor who added this one. Blank for rows created outside
  -- the administration.
  created_by text not null default ''
);

comment on table public.editors is
  'Addresses allowed into /admin. Effective access is this table plus ADMIN_EMAILS.';

alter table public.editors enable row level security;
