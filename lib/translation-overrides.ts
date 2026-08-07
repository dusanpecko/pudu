import "server-only";

import { unstable_cache } from "next/cache";

import { isLocale, type Locale } from "@/lib/i18n";
import { adminClientConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  DraftEdit,
  OverrideKind,
  OverrideMap,
  OverrideSet,
} from "@/lib/translation-source";

/**
 * Translation overrides stored in Supabase, so editors can change the wording
 * without a deployment and without losing half-finished work between sessions.
 *
 * The files in data/ stay the defaults; a row here replaces one leaf string on
 * top of them. See supabase/migrations/0002_translation_overrides.sql for the
 * draft/live model.
 *
 * Reading never throws. A missing table, a missing secret key or an unreachable
 * database all resolve to "no overrides", which renders the file defaults — the
 * website must not go down because the content tooling is misconfigured.
 */

export type { DraftEdit, OverrideKind, OverrideMap, OverrideSet };

/** One key as the manager sees it: the file default plus both stored values. */
export type OverrideRow = {
  kind: OverrideKind;
  locale: Locale;
  path: string;
  /** `null` means "no override" — the file default applies. */
  draftValue: string | null;
  liveValue: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

/**
 * Invalidated by {@link publishOverrides}. Pages that render a translation
 * inherit the tag through the cached read below, so publishing drops both the
 * data cache entry and the prerendered HTML that used it.
 */
export const TRANSLATIONS_TAG = "translations";

const TABLE = "translation_overrides";

const SELECT = "kind, locale, path, draft_value, live_value, updated_at, updated_by";

type Row = {
  kind: string;
  locale: string;
  path: string;
  draft_value: string | null;
  live_value: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

function emptySet(): OverrideSet {
  return { ui: {}, products: {} };
}

function isOverrideKind(value: string): value is OverrideKind {
  return value === "ui" || value === "products";
}

/** Drops rows whose kind or locale the code no longer knows about. */
function toRow(row: Row): OverrideRow | null {
  if (!isOverrideKind(row.kind) || !isLocale(row.locale)) return null;
  return {
    kind: row.kind,
    locale: row.locale,
    path: row.path,
    draftValue: row.draft_value,
    liveValue: row.live_value,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function group(
  rows: OverrideRow[],
  pick: (row: OverrideRow) => string | null,
): OverrideSet {
  const set = emptySet();
  for (const row of rows) {
    const value = pick(row);
    if (value === null) continue;
    const byLocale = set[row.kind];
    (byLocale[row.locale] ??= {})[row.path] = value;
  }
  return set;
}

/** Reads every row. Returns an empty list instead of throwing. */
async function fetchRows(): Promise<OverrideRow[]> {
  if (!adminClientConfigured) return [];

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from(TABLE).select(SELECT).returns<Row[]>();

    if (error) {
      // Before the migration runs the table does not exist yet; that is a
      // normal state on a fresh checkout, not something to shout about.
      console.warn(`translation overrides unavailable: ${error.message}`);
      return [];
    }

    return (data ?? []).map(toRow).filter((row): row is OverrideRow => row !== null);
  } catch (error) {
    console.warn(
      `translation overrides unavailable: ${error instanceof Error ? error.message : error}`,
    );
    return [];
  }
}

/**
 * The published overrides, cached until {@link publishOverrides} invalidates
 * the tag. `revalidate: false` is deliberate: this app is the only writer, so
 * there is nothing to poll for, and a time based refresh would not reach the
 * prerendered pages anyway.
 */
const cachedLiveOverrides = unstable_cache(
  async (): Promise<OverrideSet> => group(await fetchRows(), (row) => row.liveValue),
  ["translation-overrides", "live"],
  { tags: [TRANSLATIONS_TAG], revalidate: false },
);

/** What the website renders. */
export async function loadLiveOverrides(): Promise<OverrideSet> {
  return cachedLiveOverrides();
}

/** Uncached read for the manager, which must always show the current state. */
export async function loadOverrideRows(): Promise<OverrideRow[]> {
  return fetchRows();
}

/** The draft values, grouped like {@link loadLiveOverrides}. */
export function draftSet(rows: OverrideRow[]): OverrideSet {
  return group(rows, (row) => row.draftValue);
}

/** The published values, grouped like {@link loadLiveOverrides}. */
export function liveSet(rows: OverrideRow[]): OverrideSet {
  return group(rows, (row) => row.liveValue);
}

/** Keys whose draft has not been published yet. */
export function pendingCount(rows: OverrideRow[]): number {
  return rows.filter((row) => row.draftValue !== row.liveValue).length;
}

export type OverrideResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "unconfigured" | "missing-table" | "error"; message: string };

function failure(error: {
  code?: string;
  message: string;
}): OverrideResult<never> {
  // PostgREST answers PGRST205 for an unknown table, Postgres itself 42P01.
  const missing =
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /could not find the table|does not exist/i.test(error.message);

  return {
    ok: false,
    reason: missing ? "missing-table" : "error",
    message: missing
      ? "Tabuľka translation_overrides neexistuje — spustite `npm run db:migrate`."
      : error.message,
  };
}

function unconfigured(): OverrideResult<never> {
  return {
    ok: false,
    reason: "unconfigured",
    message: "Chýba SUPABASE_SECRET_KEY v prostredí.",
  };
}

/**
 * Writes the given cells to the draft. Only the changed cells are sent, so an
 * autosave stays small no matter how large the translation set is.
 *
 * A `null` value means "no override": the row is emptied, and deleted outright
 * when nothing is published for that key either.
 */
export async function saveDraftEdits(
  edits: DraftEdit[],
  editorEmail: string | null,
): Promise<OverrideResult<{ saved: number }>> {
  if (!adminClientConfigured) return unconfigured();
  if (edits.length === 0) return { ok: true, data: { saved: 0 } };

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const written = edits.filter((edit) => edit.value !== null);
  const cleared = edits.filter((edit) => edit.value === null);

  if (written.length > 0) {
    // `live_value` is left out on purpose: an upsert only touches the columns
    // it is given, so a draft edit never disturbs what is currently published.
    const { error } = await supabase.from(TABLE).upsert(
      written.map((edit) => ({
        kind: edit.kind,
        locale: edit.locale,
        path: edit.path,
        draft_value: edit.value,
        updated_at: now,
        updated_by: editorEmail,
      })),
      { onConflict: "kind,locale,path" },
    );
    if (error) return failure(error);
  }

  for (const edit of cleared) {
    const { error } = await supabase
      .from(TABLE)
      .update({ draft_value: null, updated_at: now, updated_by: editorEmail })
      .match({ kind: edit.kind, locale: edit.locale, path: edit.path });
    if (error) return failure(error);
  }

  if (cleared.length > 0) {
    // Nothing drafted and nothing published — the row describes nothing.
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .is("draft_value", null)
      .is("live_value", null);
    if (error) return failure(error);
  }

  return { ok: true, data: { saved: edits.length } };
}

/** Copies every draft value onto the live value. Returns the keys published. */
export async function publishOverrides(
  editorEmail: string | null,
): Promise<OverrideResult<{ published: number }>> {
  if (!adminClientConfigured) return unconfigured();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("publish_translation_overrides", {
    editor: editorEmail,
  });

  if (error) return failure(error);
  return { ok: true, data: { published: typeof data === "number" ? data : 0 } };
}

/** One row, addressed. */
export type OverrideKey = Pick<OverrideRow, "kind" | "locale" | "path">;

/**
 * Deletes the given rows outright — draft and published value together.
 *
 * Used to retire overrides that have been folded back into the repository, so
 * unlike a reset this leaves nothing behind for a later publish to apply.
 */
export async function deleteOverrides(
  keys: OverrideKey[],
): Promise<OverrideResult<{ deleted: number }>> {
  if (!adminClientConfigured) return unconfigured();
  if (keys.length === 0) return { ok: true, data: { deleted: 0 } };

  const supabase = createSupabaseAdminClient();

  for (const key of keys) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .match({ kind: key.kind, locale: key.locale, path: key.path });
    if (error) return failure(error);
  }

  return { ok: true, data: { deleted: keys.length } };
}

/** Throws away unpublished work, restoring the draft to what is live. */
export async function discardDrafts(): Promise<OverrideResult<{ reverted: number }>> {
  if (!adminClientConfigured) return unconfigured();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("discard_translation_drafts");

  if (error) return failure(error);
  return { ok: true, data: { reverted: typeof data === "number" ? data : 0 } };
}
