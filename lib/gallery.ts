import "server-only";

import { unstable_cache } from "next/cache";

import { products } from "@/data/products";
import { locales, type Locale } from "@/lib/i18n";
import {
  heroKey,
  isImageRole,
  publicUrl,
  type GalleryImage,
  type GalleryKey,
  type LocalizedText,
} from "@/lib/gallery-shared";
import { adminClientConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProductImage } from "@/types/product";

/**
 * Reading side of the galleries: the rows of `gallery_images`, describing files
 * in the `pudu` bucket.
 *
 * Reading never throws. A missing table, a missing secret key or an unreachable
 * database all resolve to "no images", which renders no gallery section at all
 * — a page without a gallery is a far better failure than a page that 500s.
 *
 * The client-safe half of this module (types, the bucket name, `textFor`) lives
 * in lib/gallery-shared.ts and is re-exported here, so server code has one
 * import to reach for.
 */

export {
  BUCKET,
  HERO_PREFIX,
  HOME_GALLERY,
  heroKey,
  isHeroKey,
  publicUrl,
  textFor,
  type GalleryImage,
  type GalleryKey,
  type ImageRole,
  type LocalizedText,
} from "@/lib/gallery-shared";

/** The gallery strips — every image placed in one is rendered. */
export function stripKeys(): GalleryKey[] {
  return ["home", ...products.map((product) => product.slug)];
}

/** The single-image slots: the home hero and one per product. */
export function heroKeys(): GalleryKey[] {
  return [heroKey("home"), ...products.map((product) => heroKey(product.slug))];
}

/** Every placement an editor can put an image in. */
export function galleryKeys(): GalleryKey[] {
  return [...stripKeys(), ...heroKeys()];
}

export function isGalleryKey(value: unknown): value is GalleryKey {
  return typeof value === "string" && galleryKeys().includes(value);
}

export const GALLERY_TAG = "gallery";

const TABLE = "gallery_images";

/**
 * Every column, rather than a list of them.
 *
 * Migrations here are applied by hand while a push deploys on its own, so the
 * code can reach production before the columns it knows about exist. Naming them
 * would make that window fatal — PostgREST rejects the whole query for one
 * unknown column, and every image would vanish from the site until the migration
 * ran. With `*` a column that is not there yet simply arrives undefined, and the
 * fallbacks in `fromRow` cover it.
 */
const SELECT = "*";

type Row = {
  id: string;
  path: string;
  original_path: string | null;
  social_path: string | null;
  width: number;
  height: number;
  role: string | null;
  has_backdrop: boolean | null;
  galleries: string[] | null;
  sort_order: number;
  alt: unknown;
  title: unknown;
  caption: unknown;
  updated_at: string | null;
  updated_by: string | null;
};

/** Keeps only the locales this build knows, so stale keys cannot leak through. */
function toLocalizedText(value: unknown): LocalizedText {
  if (!value || typeof value !== "object") return {};

  const source = value as Record<string, unknown>;
  const result: LocalizedText = {};
  for (const locale of locales as readonly Locale[]) {
    const text = source[locale];
    if (typeof text === "string") result[locale] = text;
  }
  return result;
}

function fromRow(row: Row): GalleryImage {
  return {
    id: row.id,
    path: row.path,
    originalPath: row.original_path,
    socialPath: row.social_path,
    url: publicUrl(row.path),
    width: row.width,
    height: row.height,
    // An unrecognised role falls back to the cropped kind, which is what every
    // row written before this column existed actually is.
    role: isImageRole(row.role) ? row.role : "photo",
    hasBackdrop: row.has_backdrop ?? false,
    galleries: row.galleries ?? [],
    sortOrder: row.sort_order,
    alt: toLocalizedText(row.alt),
    title: toLocalizedText(row.title),
    caption: toLocalizedText(row.caption),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

async function fetchImages(): Promise<GalleryImage[]> {
  if (!adminClientConfigured) return [];

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<Row[]>();

    if (error) {
      // Before the migration runs the table does not exist yet, which is a
      // normal state on a fresh checkout.
      console.warn(`gallery images unavailable: ${error.message}`);
      return [];
    }

    return (data ?? []).map(fromRow);
  } catch (error) {
    console.warn(
      `gallery images unavailable: ${error instanceof Error ? error.message : error}`,
    );
    return [];
  }
}

/**
 * Every image, cached until an admin action invalidates the tag. There are
 * dozens of rows at most, so one cached read serves every gallery on the site
 * and the filtering happens in memory.
 */
const cachedImages = unstable_cache(fetchImages, ["gallery-images"], {
  tags: [GALLERY_TAG],
  revalidate: false,
});

/** The images in one gallery, in the editor's order. */
export async function loadGallery(gallery: GalleryKey): Promise<GalleryImage[]> {
  const images = await cachedImages();
  return images.filter((image) => image.galleries.includes(gallery));
}

/** Uncached read for the admin page, which must always show the current state. */
export async function loadAllImages(): Promise<GalleryImage[]> {
  return fetchImages();
}

/**
 * The image in a single-image slot, or null.
 *
 * A slot is meant to hold one. If an editor placed several, the first in their
 * own order wins rather than the newest — the admin flags the duplicate rather
 * than the page picking silently.
 */
export async function loadHeroImage(target: string): Promise<GalleryImage | null> {
  const images = await cachedImages();
  const key = heroKey(target);
  return images.find((image) => image.galleries.includes(key)) ?? null;
}

/**
 * A hero image in the shape the page components already consume, so moving a
 * render into the database needed no change to HologramPanel, ProductCard or
 * ProductStory.
 *
 * `fallback` is the render committed in data/products.ts. An empty slot keeps
 * it, which is what let this ship before a single render was uploaded.
 */
export async function resolveHeroImage(
  target: string,
  fallback: ProductImage,
): Promise<ProductImage> {
  const image = await loadHeroImage(target);
  if (!image) return fallback;

  return {
    src: image.url,
    width: image.width,
    height: image.height,
    hasBackdrop: image.hasBackdrop,
  };
}

/**
 * The Open Graph variant of a hero image.
 *
 * Prefers the JPEG twin the upload generates for renders: some crawlers —
 * LinkedIn in particular — skip WebP previews, and a transparent PNG would show
 * black where the page shows the page colour.
 */
export async function resolveSocialImage(
  target: string,
  fallback: ProductImage,
): Promise<ProductImage> {
  const image = await loadHeroImage(target);
  if (!image) return fallback;

  return {
    src: publicUrl(image.socialPath ?? image.path),
    width: image.width,
    height: image.height,
  };
}
