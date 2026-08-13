-- Contact and company details shown in the footer, editable at /admin/contacts.
--
-- One row per language, because two companies stand behind this site and each
-- market names its own. Two companies therefore means two sets of values spread
-- across four rows, not a second table — and if a market later moves to the
-- other company, its row is simply rewritten.
--
-- `identifiers` and `social` are lists rather than columns on purpose. A Slovak
-- company carries IČO, DIČ and IČ DPH; a German one HRB and USt-IdNr. Fixing
-- those as columns would mean a migration for every jurisdiction, so they are
-- stored as ordered label/value pairs the editor maintains:
--
--   identifiers: [{"label": "IČO", "value": "46564853"}, …]
--   social:      [{"platform": "linkedin", "url": "https://…"}, …]
--
-- The footer renders an icon for the platforms it knows and the platform name
-- for anything else, so a new network needs no code change either.
--
-- Like the other tables here, this one is server-only: RLS is enabled and NO
-- policies are created, so anon and authenticated can reach nothing. The server
-- reads and writes it with the secret key. Nothing in it is secret — it is
-- printed in the footer — but keeping every table on the same rule means there
-- is no per-table exception to remember.

create table if not exists public.company_details (
  -- one of the locales in lib/i18n.ts; rows for unknown ones are ignored on read
  locale text primary key,

  company_name text not null default '',
  -- multi-line, so a foreign address keeps its own conventions
  address text not null default '',
  email text not null default '',
  phone text not null default '',

  identifiers jsonb not null default '[]',
  social jsonb not null default '[]',

  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.company_details enable row level security;

comment on table public.company_details is
  'Footer contact details, one row per language. Server-side access only; RLS denies all client roles.';
