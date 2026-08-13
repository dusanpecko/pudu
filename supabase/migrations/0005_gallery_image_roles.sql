-- Lets the image library hold product renders, not only photographs.
--
-- Until now every upload was cropped to 16:9 and flattened, which is right for a
-- deployment photograph and wrong for a product render: those arrive square or
-- portrait, with a transparent background, and cropping one to 16:9 would cut
-- the robot in half.
--
-- `role` decides what the upload pipeline does:
--
--   photo   crop to 16:9 at the chosen focal point, as before
--   render  no crop — the ratio and the alpha channel are kept
--
-- `has_backdrop` carries what was a hardcoded flag in data/products.ts: some
-- renders ship on a dark studio backdrop rather than on transparency, and the
-- page blends those into the background instead of showing a rectangle.
--
-- `social_path` is a JPEG twin, generated for renders only. Open Graph needs it
-- because some crawlers — LinkedIn in particular — skip WebP previews, and JPEG
-- has no alpha channel, so the transparency has to be flattened onto the page
-- colour at upload time.

alter table public.gallery_images
  add column if not exists role text not null default 'photo',
  add column if not exists has_backdrop boolean not null default false,
  add column if not exists social_path text;

-- Added separately: a check constraint cannot be declared with `if not exists`,
-- so this makes re-running the migration safe.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'gallery_images_role_check'
  ) then
    alter table public.gallery_images
      add constraint gallery_images_role_check check (role in ('photo', 'render'));
  end if;
end
$$;

comment on column public.gallery_images.role is
  'photo = cropped to 16:9; render = ratio and transparency preserved.';
comment on column public.gallery_images.social_path is
  'JPEG twin for Open Graph, since some crawlers skip WebP and JPEG has no alpha.';
