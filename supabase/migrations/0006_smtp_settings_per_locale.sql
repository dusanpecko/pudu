-- One outgoing mail configuration per language, instead of one for the site.
--
-- Two companies stand behind this site — SysTech Group for the Slovak, English
-- and German markets, 4IGV for the Czech one — and each wants the enquiries from
-- its own market on its own mail server. The table therefore stops being a
-- singleton and gets a row per language.
--
-- The existing configuration is kept, not recreated: it becomes the Slovak row,
-- which is also the fallback any language without its own row uses (see
-- lib/smtp-settings.ts). That way a market nobody has configured yet still has
-- its enquiries delivered to somebody who can forward them, rather than having
-- them fail silently — losing a customer's message is the worst outcome
-- available here.
--
-- RLS stays enabled with no policies: the table holds mail passwords and is
-- reachable only by the server, with the secret key.

-- The language this configuration sends for.
alter table public.smtp_settings
  add column if not exists locale text;

-- The row that exists is the one already in use, so it keeps its values and
-- simply becomes the primary market's.
update public.smtp_settings set locale = 'sk' where locale is null;

alter table public.smtp_settings
  alter column locale set not null;

-- `singleton` enforced that exactly one row could exist, which is now the
-- opposite of what is wanted. Its unique index is named by Postgres after the
-- column, and the constraint form has to go first.
alter table public.smtp_settings
  drop constraint if exists smtp_settings_singleton_key;

drop index if exists smtp_settings_singleton_key;

alter table public.smtp_settings
  drop column if exists singleton;

-- One configuration per language, and upserts key on it.
create unique index if not exists smtp_settings_locale_key
  on public.smtp_settings (locale);

comment on column public.smtp_settings.locale is
  'Language this configuration sends for. A language without a row falls back to the primary one.';

comment on table public.smtp_settings is
  'Outgoing mail configuration, one row per language. Server-side access only; RLS denies all client roles.';
