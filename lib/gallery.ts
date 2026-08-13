import "server-only";

import { unstable_cache } from "next/cache";

import { products } from "@/data/products";
import { locales, type Locale } from "@/lib/i18n";
import {
  publicUrl,
  type GalleryImage,
  type GalleryKey,
  type LocalizedText,
} from "@/lib/gallery-shared";
import { adminClientConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

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
  HOME_GALLERY,
  publicUrl,
  textFor,
  type GalleryImage,
  type GalleryKey,
  type LocalizedText,
} from "@/lib/gallery-shared";

/** Every gallery an editor can put an image in. */
export function galleryKeys(): GalleryKey[] {
  return ["home", ...products.map((product) => product.slug)];
}

export function isGalleryKey(value: unknown): value is GalleryKey {
  return typeof value === "string" && galleryKeys().includes(value);
}

export const GALLERY_TAG = "gallery";

const TABLE = "gallery_images";

const SELECT =
  "id, path, original_path, width, height, galleries, sort_order, alt, title, caption, updated_at, updated_by";

type Row = {
  id: string;
  path: string;
  original_path: string | null;
  width: number;
  height: number;
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
    url: publicUrl(row.path),
    width: row.width,
    height: row.height,
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
