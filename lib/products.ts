import { homeProductOrder, products } from "@/data/products";
import { productTexts } from "@/data/products/translations";
import { getTranslations } from "@/data/translations";
import { decimalSeparators, type Locale } from "@/lib/i18n";
import type {
  LocalizedProductContent,
  Product,
  ProductSlug,
  SpecEntry,
  SpecValue,
} from "@/types/product";

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

export function getProductContent(
  product: Product,
  locale: Locale,
): LocalizedProductContent {
  return productTexts[locale][product.slug];
}

/** Products in the order used by the home page grid. */
export function getHomeProducts(): Product[] {
  return homeProductOrder.map(getProduct);
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
export function formatSpecValue(value: SpecValue, locale: Locale): string {
  const { units } = getTranslations(locale);

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

export function specLabel(entry: SpecEntry, locale: Locale): string {
  return getTranslations(locale).specs[entry.key];
}

/** The four headline values shown in the strip under the product hero. */
export function getSpecHighlights(
  product: Product,
  locale: Locale,
): { label: string; value: string }[] {
  const { specs } = getTranslations(locale);

  return [
    { label: specs.payload, value: product.payload },
    { label: specs.runtime, value: product.runtime },
    { label: specs.clearanceShort, value: product.clearance },
    { label: specs.navigation, value: product.navigation },
  ];
}
