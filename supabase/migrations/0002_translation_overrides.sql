-- Translation overrides, editable from /admin/translations-manager.
--
-- The repository keeps the *shape*: data/translations/<locale>.ts and
-- data/products/translations/<locale>.ts stay the typed defaults, and only the
-- leaf strings can be overridden here. At render time the site applies these
-- rows on top of the file defaults, so a deployment never overwrites an
-- editor's work — and, the other way round, a key that a deployment renames or
-- removes simply drops its override instead of resurrecting an old shape
-- (`applyEdits` in lib/translation-source.ts ignores unknown paths).
--
-- Two values per key, and `draft_value` always describes the *complete*
-- intended override, not a diff:
--
--   draft_value  live_value  meaning
--   ───────────  ──────────  ────────────────────────────────────────────
--   'new text'   null        added in the draft, not published yet
--   'new text'   'old text'  edited in the draft, 'old text' is on the site
--   'text'       'text'      published and unchanged
--   null         'old text'  reset to the file default, not published yet
--   null         null        meaningless — deleted rather than stored
--
-- Publishing therefore means "live_value := draft_value" everywhere, and
-- unpublished work is exactly `draft_value is distinct from live_value`.
--
-- Like smtp_settings, this table is server-only: RLS is enabled and NO policies
-- are created, which denies the anon and authenticated roles everything. The
-- server reaches it with the secret key — see lib/supabase/admin.ts.

create table if not exists public.translation_overrides (
  -- 'ui' for data/translations, 'products' for data/products/translations
  kind text not null check (kind in ('ui', 'products')),
  locale text not null,
  -- dotted path into the translation tree, e.g. 'home.hero.title'
  path text not null,

  draft_value text,
  live_value text,

  updated_at timestamptz not null default now(),
  updated_by text,
  published_at timestamptz,
  published_by text,

  primary key (kind, locale, path)
  -- The "null, null → deleted rather than stored" rule above is deliberately
  -- not a CHECK constraint: publishing a reset assigns a null draft onto a
  -- non-null live value, and Postgres evaluates row checks immediately, so the
  -- constraint would reject the very statement that empties the row. The two
  -- functions below sweep the emptied rows instead.
);

-- The website reads only the published overrides, all languages at once.
create index if not exists translation_overrides_live_idx
  on public.translation_overrides (kind, locale)
  where live_value is not null;

alter table public.translation_overrides enable row level security;

comment on table public.translation_overrides is
  'Per-key translation overrides applied on top of the files in data/. Server-side access only; RLS denies all client roles.';

-- Publishing and discarding both assign one column to another, which PostgREST
-- cannot express, so they live here as functions the server calls over RPC.

create or replace function public.publish_translation_overrides(editor text)
returns integer
language plpgsql
as $$
declare
  changed integer;
begin
  update public.translation_overrides
     set live_value = draft_value,
         published_at = now(),
         published_by = editor
   where draft_value is distinct from live_value;

  get diagnostics changed = row_count;

  delete from public.translation_overrides
   where draft_value is null and live_value is null;

  return changed;
end;
$$;

comment on function public.publish_translation_overrides(text) is
  'Copies every draft value onto the live value and drops the emptied rows. Returns the number of keys published.';

create or replace function public.discard_translation_drafts()
returns integer
language plpgsql
as $$
declare
  changed integer;
begin
  update public.translation_overrides
     set draft_value = live_value,
         updated_at = now()
   where draft_value is distinct from live_value;

  get diagnostics changed = row_count;

  -- Rows that only ever held a draft have nothing left to describe.
  delete from public.translation_overrides
   where draft_value is null and live_value is null;

  return changed;
end;
$$;

comment on function public.discard_translation_drafts() is
  'Resets every draft value back to what is currently live. Returns the number of keys reverted.';

-- Both functions are only ever called with the secret key, so only the role
-- that key maps to may run them.
--
-- The revoke has to name anon and authenticated explicitly: Postgres grants
-- EXECUTE to PUBLIC on a new function, and Supabase's default privileges hand
-- those two roles a grant of their own, which a revoke from PUBLIC would leave
-- in place. The grant back to service_role is just as necessary — `bypassrls`
-- gets that role past the policies on the table, not past a missing EXECUTE.
revoke execute on function public.publish_translation_overrides(text)
  from public, anon, authenticated;
revoke execute on function public.discard_translation_drafts()
  from public, anon, authenticated;

grant execute on function public.publish_translation_overrides(text) to service_role;
grant execute on function public.discard_translation_drafts() to service_role;
