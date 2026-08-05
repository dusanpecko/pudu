import { notFound } from "next/navigation";

import TranslationsManager from "@/components/admin/TranslationsManager";
import { productTexts } from "@/data/products/translations";
import { translations } from "@/data/translations";
import { locales } from "@/lib/i18n";
import type { StringTree } from "@/lib/translation-source";

/**
 * Edit every translated string side by side and download the regenerated
 * TypeScript modules. Nothing is written to disk and nothing is stored — the
 * files are committed by hand, so the repository stays the single source of
 * truth. Development only; see app/admin/layout.tsx.
 */
export default function TranslationsManagerPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const ui = Object.fromEntries(
    locales.map((locale) => [locale, translations[locale] as unknown as StringTree]),
  );
  const products = Object.fromEntries(
    locales.map((locale) => [locale, productTexts[locale] as unknown as StringTree]),
  );

  return <TranslationsManager ui={ui} products={products} />;
}
