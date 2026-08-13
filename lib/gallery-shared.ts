import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { supabaseUrl } from "@/lib/supabase/env";

/**
 * The half of the gallery module a browser may see.
 *
 * lib/gallery.ts is `server-only` — it reaches the database with the secret key
 * — so the admin manager cannot import from it, not even for a type: pulling it
 * into the client graph drags the admin Supabase client along and fails the
 * build. Everything both sides need lives here instead.
 */

/**
 * Where an image appears. Two kinds of placement share one field:
 *
 *   home, <product slug>   a gallery strip, which shows every image in it
 *   hero:home, hero:<slug> a single slot — only the first image is rendered
 *
 * Kept as a plain string because the set grows with the fleet; `galleryKeys` in
 * lib/gallery.ts is the authority, and `isGalleryKey` validates anything that
 * arrives from a browser.
 */
export type GalleryKey = string;

export const HOME_GALLERY = "home";

/** Prefix marking a single-image slot rather than a strip. */
export const HERO_PREFIX = "hero:";

export function heroKey(target: string): GalleryKey {
  return `${HERO_PREFIX}${target}`;
}

export function isHeroKey(key: GalleryKey): boolean {
  return key.startsWith(HERO_PREFIX);
}

/**
 * What the upload pipeline does with a file. The two kinds are cropped to
 * different shapes and a render additionally keeps its transparency.
 *
 * This is never asked of the editor: the placement decides it. A strip is a row
 * of landscape photographs, a hero slot is a square product render, and there is
 * no combination of the two that makes sense — which is why
 * {@link roleForPlacements} derives it and {@link hasMixedPlacements} rejects the
 * mixture outright.
 */
export type ImageRole = "photo" | "render";

export function isImageRole(value: unknown): value is ImageRole {
  return value === "photo" || value === "render";
}

/**
 * The shape each kind is cropped to. A photograph is landscape because it sits in
 * a row; a render is square because it stands in the hero panel, where a 16:9
 * crop would cut the robot off at the knees.
 */
export const aspectForRole: Record<ImageRole, number> = {
  photo: 16 / 9,
  render: 1,
};

export function roleForPlacements(keys: GalleryKey[]): ImageRole {
  return keys.some(isHeroKey) ? "render" : "photo";
}

/** True when strips and hero slots are mixed, which no image can satisfy. */
export function hasMixedPlacements(keys: GalleryKey[]): boolean {
  return keys.some(isHeroKey) && keys.some((key) => !isHeroKey(key));
}

/** Storage bucket holding both the originals and the rendered WebPs. */
export const BUCKET = "pudu";

/** Per-language text, keyed by locale. Slovak is the fallback. */
export type LocalizedText = Partial<Record<Locale, string>>;

export type GalleryImage = {
  id: string;
  /** Path of the rendered WebP inside the bucket. */
  path: string;
  /** Path of the uploaded master, if it was kept. */
  originalPath: string | null;
  /** JPEG twin for Open Graph; renders only, since WebP previews get skipped. */
  socialPath: string | null;
  url: string;
  width: number;
  height: number;
  role: ImageRole;
  /**
   * The render ships on a dark studio backdrop rather than on transparency, so
   * the page blends it into the background instead of showing a rectangle.
   */
  hasBackdrop: boolean;
  galleries: GalleryKey[];
  sortOrder: number;
  alt: LocalizedText;
  title: LocalizedText;
  caption: LocalizedText;
  updatedAt: string | null;
  updatedBy: string | null;
};

/** The bucket is public, so the object URL needs no signing. */
export function publicUrl(path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * Reads one language out of a translated field, falling back to Slovak and then
 * to any language that has something — an image described only in English is
 * still better described than one with no alt at all.
 */
export function textFor(field: LocalizedText, locale: Locale): string {
  const own = field[locale]?.trim();
  if (own) return own;

  const fallback = field[defaultLocale]?.trim();
  if (fallback) return fallback;

  for (const candidate of locales) {
    const value = field[candidate]?.trim();
    if (value) return value;
  }
  return "";
}
