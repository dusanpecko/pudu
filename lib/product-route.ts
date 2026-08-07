import type { Metadata } from "next";

import { isLocale, type Locale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { findProduct, productSlugs } from "@/lib/products";
import { getProductContent } from "@/lib/translations";
import type { Product } from "@/types/product";

/**
 * Validates the `[locale]` / `[slug]` pair for a product route. The localized
 * path segment differs per language (`produkty` vs `products`), so each route
 * only accepts the locales that use its segment.
 */
export function resolveProductRoute(
  localeParam: string,
  slugParam: string,
  allowedLocales: readonly Locale[],
): { locale: Locale; product: Product } | null {
  if (!isLocale(localeParam)) return null;
  if (!allowedLocales.includes(localeParam)) return null;

  const product = findProduct(slugParam);
  if (!product) return null;

  return { locale: localeParam, product };
}

export function buildProductStaticParams(
  allowedLocales: readonly Locale[],
): { locale: Locale; slug: string }[] {
  return allowedLocales.flatMap((locale) =>
    productSlugs.map((slug) => ({ locale, slug })),
  );
}

export async function buildProductMetadata(
  locale: Locale,
  product: Product,
): Promise<Metadata> {
  const content = await getProductContent(product, locale);

  return buildPageMetadata({
    locale,
    route: { type: "product", slug: product.slug },
    title: content.seoTitle,
    description: content.seoDescription,
    image: product.socialImage ?? product.heroImage,
    imageAlt: content.imageAlt,
  });
}
