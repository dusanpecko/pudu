import { isLocale, type Locale } from "@/lib/i18n";
import { isProductSlug } from "@/lib/products";
import type { ProductSlug } from "@/types/product";

/** Section anchors on the home page — localized so the URL stays readable. */
export const sectionIds = {
  products: { sk: "produkty", cz: "produkty", en: "products" },
  technology: { sk: "technologia", cz: "technologie", en: "technology" },
  solutions: { sk: "riesenia", cz: "reseni", en: "solutions" },
  contact: { sk: "kontakt", cz: "kontakt", en: "contact" },
  specs: { sk: "parametre", cz: "parametry", en: "specifications" },
} as const satisfies Record<string, Record<Locale, string>>;

export type SectionKey = keyof typeof sectionIds;

export function sectionId(locale: Locale, section: SectionKey): string {
  return sectionIds[section][locale];
}

/**
 * A page of the site, independent of language. Every internal link is built
 * from a route + locale, so a link can never lose its language prefix.
 */
export type Route =
  | { type: "home" }
  | { type: "product"; slug: ProductSlug };

/** `products` in English, `produkty` in Slovak and Czech. */
export function productSegment(locale: Locale): string {
  return locale === "en" ? "products" : "produkty";
}

export function localizedPath(
  locale: Locale,
  route: Route,
  section?: SectionKey,
): string {
  const base =
    route.type === "home"
      ? `/${locale}`
      : `/${locale}/${productSegment(locale)}/${route.slug}`;

  return section ? `${base}#${sectionId(locale, section)}` : base;
}

/** Home page path with a section anchor, usable from any page. */
export function homeSectionPath(locale: Locale, section: SectionKey): string {
  return localizedPath(locale, { type: "home" }, section);
}

/**
 * Resolves a pathname back to a locale + route so the language switcher can
 * stay on the current page instead of jumping to the home page.
 */
export function parsePath(pathname: string): { locale: Locale; route: Route } | null {
  const segments = pathname.split("/").filter(Boolean);
  const [maybeLocale, maybeSegment, maybeSlug] = segments;

  if (!isLocale(maybeLocale)) return null;
  if (segments.length === 1) return { locale: maybeLocale, route: { type: "home" } };

  if (
    segments.length === 3 &&
    maybeSegment === productSegment(maybeLocale) &&
    isProductSlug(maybeSlug)
  ) {
    return { locale: maybeLocale, route: { type: "product", slug: maybeSlug } };
  }

  return null;
}

/** Absolute-path map of every language version of one route, for `hreflang`. */
export function alternatePaths(route: Route): Record<"sk" | "cs" | "en", string> {
  return {
    sk: localizedPath("sk", route),
    cs: localizedPath("cz", route),
    en: localizedPath("en", route),
  };
}
