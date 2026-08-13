-- Keeps the enquiries the contact form collects, and the link to the privacy
-- notice the visitor has to be shown before consenting.
--
-- Until now an enquiry existed only as an e-mail. Mail is the least reliable
-- link in the chain: a changed password or a provider block loses the message
-- outright, and nobody finds out except the server log. Writing the enquiry down
-- before attempting to send means it survives that, and `mail_sent` makes a
-- broken mail server visible in the administration instead of silent.
--
-- **This is the first table here that holds personal data** — a name, an e-mail
-- address, a phone number. Three consequences are deliberate:
--
--   * `consent_at` records *when* the visitor agreed, because a consent nobody
--     can evidence is not a consent.
--   * `privacy_url` on smtp_settings is what the form links to when asking. Per
--     language, because two companies stand behind this site and each publishes
--     its own notice.
--   * There is no automatic deletion. A retention period is a decision for the
--     privacy notice to state, not for this migration to invent — see the note in
--     private/CENA-DIELA.md.
--
-- RLS is enabled with no policies, so the browser cannot reach it at all: only
-- the server, with the secret key.

-- Where the form sends the visitor to read how their data is handled.
alter table public.smtp_settings
  add column if not exists privacy_url text not null default '';

comment on column public.smtp_settings.privacy_url is
  'Address of this market''s privacy notice, linked from the consent checkbox.';

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),

  -- Which market it came from, and therefore which company it was sent to.
  locale text not null,

  name text not null,
  company text not null default '',
  email text not null,
  phone text not null default '',
  -- Product slug as chosen in the form, or empty for a general enquiry.
  product text not null default '',
  message text not null,

  -- When the visitor ticked the consent box.
  consent_at timestamptz not null default now(),

  -- Whether the notification to the company left, and why not if it did not.
  mail_sent boolean not null default false,
  mail_error text,
  -- Whether the acknowledgement to the visitor left. A failure here is worth
  -- knowing but is not a lost enquiry.
  copy_sent boolean not null default false,

  handled boolean not null default false,
  handled_by text,
  handled_at timestamptz,

  created_at timestamptz not null default now()
);

-- The list is read newest first, and the outstanding ones are what matter.
create index if not exists enquiries_created_idx
  on public.enquiries (created_at desc);

create index if not exists enquiries_open_idx
  on public.enquiries (created_at desc)
  where not handled;

alter table public.enquiries enable row level security;

comment on table public.enquiries is
  'Enquiries from the contact form, including consent and handling state. Holds personal data. Server-side access only; RLS denies all client roles.';
