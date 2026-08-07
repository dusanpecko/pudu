import "server-only";

import { cache } from "react";

import { productTexts } from "@/data/products/translations";
import { translations } from "@/data/translations";
import { locales, type Locale } from "@/lib/i18n";
import {
  loadLiveOverrides,
  type OverrideKey,
  type OverrideMap,
  type OverrideRow,
} from "@/lib/translation-overrides";
import { applyEdits, readPath } from "@/lib/translation-source";
import type { LocalizedProductContent, Product, ProductSlug } from "@/types/product";
import type { Translation } from "@/types/translation";

/**
 * The translations the website renders: the typed defaults from data/, with the
 * published overrides from Supabase applied on top.
 *
 * Import from here rather than from data/ directly. The data modules are the
 * defaults only, and reading them straight would quietly ignore every edit made
 * in /admin/translations-manager.
 *
 * `applyEdits` ignores paths that no longer exist, so the files remain in
 * charge of the shape: renaming or deleting a key in the repository drops its
 * override instead of resurrecting the old wording.
 *
 * Both readers are wrapped in React's `cache`, which deduplicates them for the
 * duration of one render — a page pulls the same translation into a dozen
 * components, and this way the merge happens once.
 */

function merge<T>(defaults: T, overrides: OverrideMap | undefined): T {
  // No overrides for this language is the common case, and skipping the deep
  // clone in `applyEdits` keeps it free.
  if (!overrides || Object.keys(overrides).length === 0) return defaults;
  return applyEdits(defaults, overrides);
}

export const getTranslations = cache(async (locale: Locale): Promise<Translation> => {
  const overrides = await loadLiveOverrides();
  return merge(translations[locale], overrides.ui[locale]);
});

export const getProductTexts = cache(
  async (locale: Locale): Promise<Record<ProductSlug, LocalizedProductContent>> => {
    const overrides = await loadLiveOverrides();
    return merge(productTexts[locale], overrides.products[locale]);
  },
);

export async function getProductContent(
  product: Product,
  locale: Locale,
): Promise<LocalizedProductContent> {
  return (await getProductTexts(locale))[product.slug];
}

/**
 * Overrides that no longer change anything, and can be retired.
 *
 * That happens on the normal round trip: an editor publishes, downloads the
 * regenerated file, commits it, and from the next deployment the repository
 * says what the override says. The row is then pure weight — and worse than
 * idle, because it would keep beating the file if a later commit changed that
 * key again.
 *
 * A row qualifies only when nothing is pending on it (`draft` equals `live`),
 * and either the value now matches the file or the key has left the files
 * altogether.
 */
export function redundantOverrides(rows: OverrideRow[]): OverrideKey[] {
  return rows
    .filter((row) => {
      if (row.draftValue !== row.liveValue) return false;
      if (row.draftValue === null) return false;

      const tree =
        row.kind === "ui" ? translations[row.locale] : productTexts[row.locale];
      const fileValue = readPath(tree, row.path);

      return fileValue === undefined || fileValue === row.draftValue;
    })
    .map(({ kind, locale, path }) => ({ kind, locale, path }));
}

/**
 * The 404 copy in every language.
 *
 * A `not-found.tsx` receives no route params, so the language is only known in
 * the browser, from the pathname — which is why the client component that
 * renders it needs all four at once rather than a single resolved translation.
 */
export const getNotFoundCopy = cache(
  async (): Promise<Record<Locale, Translation["notFound"]>> => {
    const entries = await Promise.all(
      locales.map(
        async (locale) => [locale, (await getTranslations(locale)).notFound] as const,
      ),
    );
    return Object.fromEntries(entries) as Record<Locale, Translation["notFound"]>;
  },
);
