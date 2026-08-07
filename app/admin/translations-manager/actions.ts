"use server";

import { revalidatePath, updateTag } from "next/cache";

import { isLocale } from "@/lib/i18n";
import {
  deleteOverrides,
  discardDrafts,
  loadOverrideRows,
  publishOverrides,
  saveDraftEdits,
  TRANSLATIONS_TAG,
  type DraftEdit,
} from "@/lib/translation-overrides";
import { redundantOverrides } from "@/lib/translations";
import { isEditor } from "@/lib/supabase/editors";
import { getEditor } from "@/lib/supabase/server";

export type SaveState = {
  status: "saved" | "published" | "discarded" | "cleaned" | "error";
  message: string;
  /** Keys touched, so the manager can report what happened. */
  count: number;
};

/** Every action re-checks the allowlist: a server action is a public endpoint. */
async function requireEditor(): Promise<string> {
  const editor = await getEditor();
  if (!isEditor(editor?.email) || !editor?.email) {
    throw new Error("Neoprávnený prístup.");
  }
  return editor.email;
}

/**
 * The browser sends plain JSON, which is not to be trusted: an unknown kind or
 * locale would create rows the site can never read, and a path that is not a
 * string would break the merge. Anything unrecognised is dropped.
 */
function parseEdits(input: unknown): DraftEdit[] {
  if (!Array.isArray(input)) return [];

  return input.flatMap((entry): DraftEdit[] => {
    if (!entry || typeof entry !== "object") return [];
    const { kind, locale, path, value } = entry as Record<string, unknown>;

    if (kind !== "ui" && kind !== "products") return [];
    if (typeof locale !== "string" || !isLocale(locale)) return [];
    if (typeof path !== "string" || path.length === 0) return [];
    if (value !== null && typeof value !== "string") return [];

    return [{ kind, locale, path, value }];
  });
}

/**
 * Autosave. Called with only the cells that changed since the last save, so it
 * stays cheap enough to run while the editor types.
 *
 * Nothing is revalidated here — a draft is not on the website yet.
 */
export async function saveDraft(edits: unknown): Promise<SaveState> {
  const editorEmail = await requireEditor();
  const parsed = parseEdits(edits);

  const result = await saveDraftEdits(parsed, editorEmail);
  if (!result.ok) return { status: "error", message: result.message, count: 0 };

  return { status: "saved", message: "Uložené.", count: result.data.saved };
}

/**
 * Puts the draft on the website.
 *
 * `updateTag` expires the cached overrides immediately rather than serving one
 * more stale render, which is what an editor checking their own change
 * expects. The prerendered pages inherit the tag through that read, so they are
 * dropped with it.
 */
export async function publish(): Promise<SaveState> {
  const editorEmail = await requireEditor();

  const result = await publishOverrides(editorEmail);
  if (!result.ok) return { status: "error", message: result.message, count: 0 };

  updateTag(TRANSLATIONS_TAG);
  revalidatePath("/admin/translations-manager");

  const { published } = result.data;
  return {
    status: "published",
    message:
      published === 0
        ? "Nebolo čo publikovať."
        : `Publikovaných ${published} textov. Web je aktualizovaný.`,
    count: published,
  };
}

/**
 * Retires the overrides that the repository has caught up with.
 *
 * The set is recomputed here from the files on this deployment rather than
 * taken from the browser: which overrides are redundant depends on what the
 * committed defaults say, and the server is the one that knows.
 *
 * The cache has to be dropped even though nothing on the page changes — it
 * still holds the deleted overrides, and they would keep winning over the file
 * until something else invalidated it.
 */
export async function cleanupRedundant(): Promise<SaveState> {
  await requireEditor();

  const rows = await loadOverrideRows();
  const keys = redundantOverrides(rows);

  const result = await deleteOverrides(keys);
  if (!result.ok) return { status: "error", message: result.message, count: 0 };

  const { deleted } = result.data;
  if (deleted > 0) {
    updateTag(TRANSLATIONS_TAG);
    revalidatePath("/admin/translations-manager");
  }

  return {
    status: "cleaned",
    message:
      deleted === 0
        ? "Nič na upratanie — žiadny override nie je zbytočný."
        : `Uprataných ${deleted} prevzatých textov. Zdrojom je zase repozitár.`,
    count: deleted,
  };
}

/** Throws away everything unpublished, restoring the draft to what is live. */
export async function discardDraft(): Promise<SaveState> {
  await requireEditor();

  const result = await discardDrafts();
  if (!result.ok) return { status: "error", message: result.message, count: 0 };

  revalidatePath("/admin/translations-manager");

  const { reverted } = result.data;
  return {
    status: "discarded",
    message:
      reverted === 0
        ? "Neboli žiadne nepublikované zmeny."
        : `Zahodených ${reverted} nepublikovaných zmien.`,
    count: reverted,
  };
}
