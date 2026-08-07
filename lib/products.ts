import { products } from "@/data/products";
import { decimalSeparators, type Locale } from "@/lib/i18n";
import type { Product, ProductSlug, SpecEntry, SpecValue } from "@/types/product";
import type { Translation } from "@/types/translation";

/**
 * The fleet, and the pure helpers that read it.
 *
 * Nothing here reaches for translations on its own: the copy now lives behind
 * an async, database-backed lookup (lib/translations.ts, which is server only),
 * and this module is on the import path of lib/routes.ts, which client
 * components use. The formatters therefore take the resolved translation the
 * caller already has.
 */

export const productSlugs: ProductSlug[] = products.map((product) => product.slug);

export function isProductSlug(value: string | undefined): value is ProductSlug {
  return typeof value === "string" && productSlugs.includes(value as ProductSlug);
}

export function getProduct(slug: ProductSlug): Product {
  const product = products.find((item) => item.slug === slug);
  // `slug` is validated by `isProductSlug` before it reaches this function.
  if (!product) throw new Error(`Unknown product slug: ${slug}`);
  return product;
}

export function findProduct(slug: string): Product | undefined {
  return isProductSlug(slug) ? getProduct(slug) : undefined;
}

/**
 * Products for the home page grid. Deliberately the canonical fleet order, so a
 * newly added product cannot be missing from the grid.
 */
export function getHomeProducts(): Product[] {
  return products;
}

/** Neighbours in the canonical fleet order, wrapping around the ends. */
export function getProductNeighbours(slug: ProductSlug): {
  previous: Product;
  next: Product;
} {
  const index = products.findIndex((product) => product.slug === slug);
  const previous = products[(index - 1 + products.length) % products.length];
  const next = products[(index + 1) % products.length];
  return { previous, next };
}

function formatNumber(value: number, locale: Locale): string {
  return value.toString().replace(".", decimalSeparators[locale]);
}

/** Renders a language neutral technical value with localized units. */
export function formatSpecValue(
  value: SpecValue,
  locale: Locale,
  { units }: Translation,
): string {
  switch (value.kind) {
    case "text":
      return value.text;
    case "measure": {
      const amount = `${formatNumber(value.amount, locale)} ${units[value.unit]}`;
      return value.upTo ? `${units.upTo} ${amount}` : amount;
    }
    case "dimensions":
      return `${value.width} × ${value.depth} × ${value.height} ${units.mm}`;
    case "charging":
      return units.chargingTemplate
        .replace("{hours}", formatNumber(value.hours, locale))
        .replace("{percent}", formatNumber(value.percent, locale));
  }
}

export function specLabel(entry: SpecEntry, { specs }: Translation): string {
  return specs[entry.key];
}

/** The four headline values shown in the strip under the product hero. */
export function getSpecHighlights(
  product: Product,
  { specs }: Translation,
): { label: string; value: string }[] {
  return [
    { label: specs.payload, value: product.payload },
    { label: specs.runtime, value: product.runtime },
    { label: specs.clearanceShort, value: product.clearance },
    { label: specs.navigation, value: product.navigation },
  ];
}
