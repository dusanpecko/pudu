import { productTextsCz } from "@/data/products/translations/cz";
import { productTextsEn } from "@/data/products/translations/en";
import { productTextsSk } from "@/data/products/translations/sk";
import type { Locale } from "@/lib/i18n";
import type { LocalizedProductContent, ProductSlug } from "@/types/product";

/**
 * Product copy per language. Kept apart from the technical data in
 * data/products.ts so the translations manager can regenerate one without
 * touching the other.
 */
export const productTexts: Record<
  Locale,
  Record<ProductSlug, LocalizedProductContent>
> = {
  sk: productTextsSk,
  cz: productTextsCz,
  en: productTextsEn,
};

export { productTextsSk, productTextsCz, productTextsEn };
