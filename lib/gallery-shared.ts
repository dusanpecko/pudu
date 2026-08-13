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
 * Where an image appears: `home`, or a product slug. Kept as a plain string
 * because the set grows with the fleet; `galleryKeys` in lib/gallery.ts is the
 * authority, and `isGalleryKey` is what validates anything from a browser.
 */
export type GalleryKey = string;

export const HOME_GALLERY = "home";

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
  url: string;
  width: number;
  height: number;
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
