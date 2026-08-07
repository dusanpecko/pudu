import { notFound } from "next/navigation";

import TranslationsManager from "@/components/admin/TranslationsManager";
import { productTexts } from "@/data/products/translations";
import { translations } from "@/data/translations";
import { locales } from "@/lib/i18n";
import {
  draftSet,
  liveSet,
  loadOverrideRows,
} from "@/lib/translation-overrides";
import { isEditor } from "@/lib/supabase/editors";
import { getEditor } from "@/lib/supabase/server";
import type { StringTree } from "@/lib/translation-source";

/**
 * Edit every translated string side by side.
 *
 * The files in data/ are read directly here — they are the defaults the editor
 * compares against, which is the one place in the app that wants them raw
 * rather than merged. The overrides come from Supabase: `draft` is the
 * autosaved work in progress, `live` is what the website currently renders.
 *
 * Access requires a Supabase session, enforced by proxy.ts.
 */
export default async function TranslationsManagerPage() {
  const editor = await getEditor();
  // Middleware already checks this; repeated here so the data cannot be
  // rendered even if the route is reached another way.
  if (!isEditor(editor?.email)) notFound();

  const ui = Object.fromEntries(
    locales.map((locale) => [locale, translations[locale] as unknown as StringTree]),
  );
  const products = Object.fromEntries(
    locales.map((locale) => [locale, productTexts[locale] as unknown as StringTree]),
  );

  const rows = await loadOverrideRows();

  return (
    <TranslationsManager
      ui={ui}
      products={products}
      draft={draftSet(rows)}
      live={liveSet(rows)}
    />
  );
}
