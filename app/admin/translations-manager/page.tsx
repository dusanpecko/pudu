import { notFound } from "next/navigation";

import TranslationsManager from "@/components/admin/TranslationsManager";
import { productTexts } from "@/data/products/translations";
import { translations } from "@/data/translations";
import { locales } from "@/lib/i18n";
import { isEditor } from "@/lib/supabase/editors";
import { getEditor } from "@/lib/supabase/server";
import type { StringTree } from "@/lib/translation-source";

/**
 * Edit every translated string side by side. The repository stays the single
 * source of truth: the editor regenerates the data files, which are either
 * downloaded or committed by the publish action. Access requires a Supabase
 * session, enforced by middleware.ts.
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

  return (
    <TranslationsManager
      ui={ui}
      products={products}
      editorEmail={editor?.email ?? null}
    />
  );
}
