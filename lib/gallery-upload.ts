import "server-only";

import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { loadAllImages } from "@/lib/gallery";
import {
  BUCKET,
  type GalleryImage,
  type GalleryKey,
  type ImageRole,
  type LocalizedText,
} from "@/lib/gallery-shared";
import { adminClientConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Writing side of the gallery: getting an original into the bucket, turning it
 * into the 16:9 WebP the site renders, and maintaining the rows.
 *
 * The original is uploaded straight from the browser through a signed URL
 * rather than posted to the server. A 300 DPI export easily passes the 4.5 MB
 * body limit a serverless function has, and going around it also means the
 * server never holds the whole file in a request.
 *
 * The master is then kept in `originals/`, so re-cropping an image later is a
 * server-side operation rather than asking the editor to find the file again.
 */

/** 16:9, and wide enough that next/image has something to downscale from. */
const TARGET_WIDTH = 2400;
const TARGET_HEIGHT = 1350;
const ASPECT = 16 / 9;

/** A render keeps its ratio, so only the longest side is bounded. */
const RENDER_MAX_SIDE = 1600;

const WEBP_QUALITY = 82;
const JPEG_QUALITY = 86;

/**
 * Background the Open Graph twin is flattened onto: the light theme's page
 * colour (`--color-ink` in app/globals.css). JPEG has no alpha channel, and
 * leaving it to default would put the transparent parts of a render on black
 * while the page shows them on near-white.
 */
const SOCIAL_BACKGROUND = { r: 244, g: 241, b: 252 };

const TABLE = "gallery_images";

export type GalleryResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "unconfigured" | "missing-table" | "error"; message: string };

function failure(error: { code?: string; message: string }): GalleryResult<never> {
  const missing =
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /could not find the table|does not exist/i.test(error.message);

  return {
    ok: false,
    reason: missing ? "missing-table" : "error",
    message: missing
      ? "Tabuľka gallery_images neexistuje — spustite migráciu 0003."
      : error.message,
  };
}

function unconfigured(): GalleryResult<never> {
  return {
    ok: false,
    reason: "unconfigured",
    message: "Chýba SUPABASE_SECRET_KEY v prostredí.",
  };
}

/** A filename an editor and a search engine can both read. */
export function slugify(value: string): string {
  // NFD splits "č" into "c" + a combining caron; U+0300–U+036F is that block,
  // written as escapes because the characters themselves are invisible in
  // source.
  const withoutDiacritics = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

  const slug = withoutDiacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug || "pudu";
}

/** Where the browser should PUT the file it is about to upload. */
export async function createUploadTarget(
  fileName: string,
): Promise<GalleryResult<{ path: string; token: string }>> {
  if (!adminClientConfigured) return unconfigured();

  const extension = (fileName.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
  const safeExtension = /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
  const path = `originals/${randomUUID()}.${safeExtension}`;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true, data: { path: data.path, token: data.token } };
}

/**
 * The largest 16:9 rectangle that fits, positioned by a focal point.
 *
 * Deriving the rectangle here rather than trusting one from the browser means
 * the aspect ratio cannot arrive wrong: only *where* the crop sits is the
 * editor's choice, never its shape.
 */
export function cropRect(
  width: number,
  height: number,
  focusX: number,
  focusY: number,
): { left: number; top: number; width: number; height: number } {
  let cropWidth = width;
  let cropHeight = Math.round(width / ASPECT);

  if (cropHeight > height) {
    cropHeight = height;
    cropWidth = Math.round(height * ASPECT);
  }

  const clamp = (value: number, max: number) =>
    Math.max(0, Math.min(Math.round(value), Math.max(0, max)));

  return {
    left: clamp(focusX * width - cropWidth / 2, width - cropWidth),
    top: clamp(focusY * height - cropHeight / 2, height - cropHeight),
    width: Math.min(cropWidth, width),
    height: Math.min(cropHeight, height),
  };
}

export type NewImageInput = {
  originalPath: string;
  /** Focal point of the crop, 0–1 of the original. Ignored for a render. */
  focusX: number;
  focusY: number;
  /** Seeds the file name; SEO reads it, so it is not a random string. */
  slug: string;
  role: ImageRole;
  /** Only meaningful for a render: it ships on a dark backdrop, not on alpha. */
  hasBackdrop: boolean;
  galleries: GalleryKey[];
  alt: LocalizedText;
  title: LocalizedText;
  caption: LocalizedText;
};

/**
 * Turns the upright original into what the site serves.
 *
 * A photograph is cropped to 16:9 at the editor's focal point. A render is left
 * whole — cropping a square robot to 16:9 would cut it in half — and only bounded
 * on its longest side, with `alpha` telling sharp to keep the transparency that
 * makes the render sit on the page instead of in a box.
 */
async function renderVariants(
  upright: Buffer,
  meta: { width: number; height: number },
  input: NewImageInput,
): Promise<{ webp: Buffer; social: Buffer | null; width: number; height: number }> {
  if (input.role === "photo") {
    const rect = cropRect(meta.width, meta.height, input.focusX, input.focusY);
    const rendered = await sharp(upright)
      .extract(rect)
      // withoutEnlargement keeps a small original from being blown up into a
      // soft 2400px image; the crop is already 16:9, so the ratio holds either
      // way.
      .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 5 })
      .toBuffer({ resolveWithObject: true });

    return {
      webp: rendered.data,
      social: null,
      width: rendered.info.width,
      height: rendered.info.height,
    };
  }

  const rendered = await sharp(upright)
    .resize(RENDER_MAX_SIDE, RENDER_MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 5, alphaQuality: 100 })
    .toBuffer({ resolveWithObject: true });

  // The twin exists for the crawlers that skip WebP, so it is flattened onto the
  // page colour rather than left to JPEG's default black.
  const social = await sharp(upright)
    .resize(RENDER_MAX_SIDE, RENDER_MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: SOCIAL_BACKGROUND })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  return {
    webp: rendered.data,
    social,
    width: rendered.info.width,
    height: rendered.info.height,
  };
}

/**
 * Derives the WebP from an already uploaded original and records the row.
 *
 * `failOn: "none"` keeps a slightly malformed export usable — a truncated
 * trailing marker is common from design tools and does not affect the pixels
 * we need. `rotate()` first bakes in the EXIF orientation, so a portrait photo
 * from a phone is not cropped sideways; the metadata is read afterwards
 * because before rotating it still describes the unrotated frame.
 */
export async function createImage(
  input: NewImageInput,
  editorEmail: string | null,
): Promise<GalleryResult<GalleryImage>> {
  if (!adminClientConfigured) return unconfigured();

  const supabase = createSupabaseAdminClient();

  const download = await supabase.storage.from(BUCKET).download(input.originalPath);
  if (download.error) {
    return { ok: false, reason: "error", message: download.error.message };
  }

  const source = Buffer.from(await download.data.arrayBuffer());

  let webp: Buffer;
  let social: Buffer | null;
  let width: number;
  let height: number;
  try {
    const upright = await sharp(source, { failOn: "none" }).rotate().toBuffer();
    const meta = await sharp(upright).metadata();
    if (!meta.width || !meta.height) {
      return { ok: false, reason: "error", message: "Obrázok sa nepodarilo prečítať." };
    }

    const variants = await renderVariants(
      upright,
      { width: meta.width, height: meta.height },
      input,
    );
    webp = variants.webp;
    social = variants.social;
    width = variants.width;
    height = variants.height;
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: `Spracovanie obrázka zlyhalo: ${error instanceof Error ? error.message : error}`,
    };
  }

  const path = `gallery/${slugify(input.slug)}-${randomUUID().slice(0, 8)}.webp`;
  const upload = await supabase.storage.from(BUCKET).upload(path, webp, {
    contentType: "image/webp",
    // The file name carries a random suffix, so a stored object never changes
    // and can be cached for a year.
    cacheControl: "31536000",
    upsert: false,
  });
  if (upload.error) {
    return { ok: false, reason: "error", message: upload.error.message };
  }

  let socialPath: string | null = null;
  if (social) {
    socialPath = path.replace(/\.webp$/, ".jpg");
    const twin = await supabase.storage.from(BUCKET).upload(socialPath, social, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: false,
    });
    if (twin.error) {
      // The WebP is already stored, so leaving it without a twin degrades the
      // Open Graph preview rather than failing the upload.
      console.warn(`Open Graph twin not stored: ${twin.error.message}`);
      socialPath = null;
    }
  }

  const existing = await loadAllImages();
  const sortOrder = existing.reduce((max, image) => Math.max(max, image.sortOrder), 0) + 1;

  const { error } = await supabase.from(TABLE).insert({
    path,
    original_path: input.originalPath,
    social_path: socialPath,
    width,
    height,
    role: input.role,
    has_backdrop: input.hasBackdrop,
    galleries: input.galleries,
    sort_order: sortOrder,
    alt: input.alt,
    title: input.title,
    caption: input.caption,
    created_by: editorEmail,
    updated_by: editorEmail,
  });

  if (error) {
    // Do not leave an orphaned object behind if the row could not be written.
    await supabase.storage.from(BUCKET).remove([path]);
    return failure(error);
  }

  const saved = (await loadAllImages()).find((image) => image.path === path);
  if (!saved) {
    return { ok: false, reason: "error", message: "Riadok sa nepodarilo prečítať." };
  }
  return { ok: true, data: saved };
}

export type ImageEdit = {
  galleries?: GalleryKey[];
  alt?: LocalizedText;
  title?: LocalizedText;
  caption?: LocalizedText;
  sortOrder?: number;
};

export async function updateImage(
  id: string,
  edit: ImageEdit,
  editorEmail: string | null,
): Promise<GalleryResult<{ id: string }>> {
  if (!adminClientConfigured) return unconfigured();

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: editorEmail,
  };
  if (edit.galleries) patch.galleries = edit.galleries;
  if (edit.alt) patch.alt = edit.alt;
  if (edit.title) patch.title = edit.title;
  if (edit.caption) patch.caption = edit.caption;
  if (edit.sortOrder !== undefined) patch.sort_order = edit.sortOrder;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from(TABLE).update(patch).eq("id", id);

  if (error) return failure(error);
  return { ok: true, data: { id } };
}

/** Removes the row and both objects, so nothing is left paying for storage. */
export async function deleteImage(id: string): Promise<GalleryResult<{ id: string }>> {
  if (!adminClientConfigured) return unconfigured();

  const image = (await loadAllImages()).find((candidate) => candidate.id === id);
  if (!image) return { ok: false, reason: "error", message: "Obrázok neexistuje." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) return failure(error);

  const paths = [image.path];
  if (image.originalPath) paths.push(image.originalPath);
  if (image.socialPath) paths.push(image.socialPath);
  // The row is already gone, so a failure here only leaks storage — worth a
  // warning, not worth reporting the delete as failed.
  const removal = await supabase.storage.from(BUCKET).remove(paths);
  if (removal.error) {
    console.warn(`gallery objects not removed: ${removal.error.message}`);
  }

  return { ok: true, data: { id } };
}

/** Writes a new order from a list of ids, first to last. */
export async function reorderImages(
  ids: string[],
  editorEmail: string | null,
): Promise<GalleryResult<{ count: number }>> {
  if (!adminClientConfigured) return unconfigured();

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  for (const [index, id] of ids.entries()) {
    const { error } = await supabase
      .from(TABLE)
      .update({ sort_order: index + 1, updated_at: now, updated_by: editorEmail })
      .eq("id", id);
    if (error) return failure(error);
  }

  return { ok: true, data: { count: ids.length } };
}
