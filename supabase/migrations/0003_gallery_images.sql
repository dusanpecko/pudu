-- Gallery images, managed from /admin/gallery.
--
-- The rows describe images that live in the `pudu` storage bucket. Two paths
-- per row: `path` is the derived 16:9 WebP the website renders, and
-- `original_path` is the file the editor uploaded, kept so a different crop
-- later needs no re-upload. Deleting a row is expected to delete both objects.
--
-- `galleries` says where an image appears: 'home' for the home page, or a
-- product slug such as 'pudu-t300'. One image can be in several at once, which
-- is why this is an array rather than a foreign key — the set of galleries is
-- defined by the code (lib/gallery.ts), not by another table.
--
-- The SEO text is per language, stored as {"sk": "…", "cz": "…"} so adding a
-- fifth language never needs a migration. A missing language falls back to
-- Slovak at render time.
--
-- Like the other tables here, this one is server-only: RLS is enabled and NO
-- policies are created, so anon and authenticated can reach nothing. The
-- server reads and writes it with the secret key. The *images* are public —
-- that is the bucket's business, not this table's.

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),

  path text not null unique,
  original_path text,

  width integer not null,
  height integer not null,

  galleries text[] not null default '{}',
  sort_order integer not null default 0,

  -- locale → text
  alt jsonb not null default '{}',
  title jsonb not null default '{}',
  caption jsonb not null default '{}',

  created_at timestamptz not null default now(),
  created_by text,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- The site asks "which images are in this gallery"; GIN answers containment
-- without scanning.
create index if not exists gallery_images_galleries_idx
  on public.gallery_images using gin (galleries);

-- The admin list and every gallery render in the same order.
create index if not exists gallery_images_sort_idx
  on public.gallery_images (sort_order, created_at);

alter table public.gallery_images enable row level security;

comment on table public.gallery_images is
  'Images in the pudu storage bucket, with their galleries and per-language SEO text. Server-side access only; RLS denies all client roles.';
