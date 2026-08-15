"use server";

import { revalidatePath, updateTag } from "next/cache";

import {
  GALLERY_TAG,
  isGalleryKey,
  type GalleryKey,
  type LocalizedText,
} from "@/lib/gallery";
import { hasMixedPlacements, roleForPlacements } from "@/lib/gallery-shared";
import {
  createImage,
  createUploadTarget,
  deleteImage,
  reorderImages,
  updateImage,
} from "@/lib/gallery-upload";
import { locales } from "@/lib/i18n";
import { isEditor } from "@/lib/editors";
import { getEditor } from "@/lib/supabase/server";

export type GalleryState = {
  status: "ok" | "error";
  message: string;
};

/** Every action re-checks the allowlist: a server action is a public endpoint. */
async function requireEditor(): Promise<string> {
  const editor = await getEditor();
  if (!(await isEditor(editor?.email)) || !editor?.email) {
    throw new Error("Neoprávnený prístup.");
  }
  return editor.email;
}

/**
 * The browser sends plain JSON, which is not to be trusted. An unknown gallery
 * would hide the image from every page, an unknown locale would store text the
 * site can never read, and a focus outside 0–1 would crop off the frame.
 */
function parseGalleries(input: unknown): GalleryKey[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter(isGalleryKey))];
}

function parseText(input: unknown): LocalizedText {
  if (!input || typeof input !== "object") return {};

  const source = input as Record<string, unknown>;
  const result: LocalizedText = {};
  for (const locale of locales) {
    const value = source[locale];
    if (typeof value === "string" && value.trim().length > 0) {
      result[locale] = value.trim();
    }
  }
  return result;
}

function parseFocus(input: unknown): number {
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

/** Hands the browser a one-off URL to PUT the original to. */
export async function requestUpload(
  fileName: unknown,
): Promise<
  { status: "ok"; path: string; token: string } | { status: "error"; message: string }
> {
  await requireEditor();

  const name = typeof fileName === "string" ? fileName : "upload.jpg";
  const result = await createUploadTarget(name);

  if (!result.ok) return { status: "error", message: result.message };
  return { status: "ok", path: result.data.path, token: result.data.token };
}

/** Derives the WebP from the uploaded original and records it. */
export async function addImage(input: unknown): Promise<GalleryState> {
  const editorEmail = await requireEditor();

  if (!input || typeof input !== "object") {
    return { status: "error", message: "Neplatné údaje." };
  }
  const source = input as Record<string, unknown>;

  const originalPath = source.originalPath;
  if (typeof originalPath !== "string" || !originalPath.startsWith("originals/")) {
    return { status: "error", message: "Chýba nahraný súbor." };
  }

  const galleries = parseGalleries(source.galleries);
  if (galleries.length === 0) {
    return { status: "error", message: "Vyberte aspoň jedno umiestnenie." };
  }
  // The two kinds are cropped to different shapes, so one file cannot serve
  // both. The form prevents it; this is the same rule on the server.
  if (hasMixedPlacements(galleries)) {
    return {
      status: "error",
      message: "Obrázok patrí buď do galérií, alebo do hero pozícií — nie do oboch.",
    };
  }

  const alt = parseText(source.alt);
  if (Object.keys(alt).length === 0) {
    return {
      status: "error",
      message: "Alt text je povinný — bez neho obrázok nemá popis pre čítačky ani pre Google.",
    };
  }

  // Derived, never taken from the browser: the placement is what decides whether
  // this is a landscape photograph or a square render.
  const role = roleForPlacements(galleries);

  const title = parseText(source.title);
  const slugSeed =
    typeof source.slug === "string" && source.slug.trim().length > 0
      ? source.slug
      : (title.sk ?? alt.sk ?? "pudu");

  const result = await createImage(
    {
      originalPath,
      focusX: parseFocus(source.focusX),
      focusY: parseFocus(source.focusY),
      slug: slugSeed,
      role,
      hasBackdrop: role === "render" && source.hasBackdrop === true,
      galleries,
      alt,
      title,
      caption: parseText(source.caption),
    },
    editorEmail,
  );

  if (!result.ok) return { status: "error", message: result.message };

  updateTag(GALLERY_TAG);
  revalidatePath("/admin/gallery");
  return { status: "ok", message: `Obrázok pridaný (${result.data.width}×${result.data.height}).` };
}

export async function saveImage(id: unknown, edit: unknown): Promise<GalleryState> {
  const editorEmail = await requireEditor();

  if (typeof id !== "string" || !edit || typeof edit !== "object") {
    return { status: "error", message: "Neplatné údaje." };
  }
  const source = edit as Record<string, unknown>;

  const galleries = parseGalleries(source.galleries);
  if (galleries.length === 0) {
    return { status: "error", message: "Vyberte aspoň jedno umiestnenie." };
  }
  // Moving a photograph into a hero slot would need a different crop, which
  // means a re-upload rather than an edit.
  if (hasMixedPlacements(galleries)) {
    return {
      status: "error",
      message: "Obrázok patrí buď do galérií, alebo do hero pozícií — nie do oboch.",
    };
  }

  const alt = parseText(source.alt);
  if (Object.keys(alt).length === 0) {
    return { status: "error", message: "Alt text je povinný." };
  }

  const result = await updateImage(
    id,
    { galleries, alt, title: parseText(source.title), caption: parseText(source.caption) },
    editorEmail,
  );

  if (!result.ok) return { status: "error", message: result.message };

  updateTag(GALLERY_TAG);
  revalidatePath("/admin/gallery");
  return { status: "ok", message: "Uložené." };
}

export async function removeImage(id: unknown): Promise<GalleryState> {
  await requireEditor();
  if (typeof id !== "string") return { status: "error", message: "Neplatné údaje." };

  const result = await deleteImage(id);
  if (!result.ok) return { status: "error", message: result.message };

  updateTag(GALLERY_TAG);
  revalidatePath("/admin/gallery");
  return { status: "ok", message: "Obrázok zmazaný." };
}

export async function saveOrder(ids: unknown): Promise<GalleryState> {
  const editorEmail = await requireEditor();

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return { status: "error", message: "Neplatné údaje." };
  }

  const result = await reorderImages(ids as string[], editorEmail);
  if (!result.ok) return { status: "error", message: result.message };

  updateTag(GALLERY_TAG);
  revalidatePath("/admin/gallery");
  return { status: "ok", message: "Poradie uložené." };
}
