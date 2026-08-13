import { products } from "@/data/products";
import type { Locale } from "@/lib/i18n";
import { homeSectionPath, localizedPath, sectionId } from "@/lib/routes";
import { getProductTexts, getTranslations } from "@/lib/translations";
import type { ProductSlug } from "@/types/product";

export type NavProductLink = {
  slug: ProductSlug;
  name: string;
  category: string;
  href: string;
};

export type NavLink = {
  label: string;
  href: string;
};

/**
 * Everything the navigation needs, resolved on the server and handed to the
 * client components as plain serializable data.
 */
export type NavContent = {
  brand: string;
  home: NavLink;
  products: {
    label: string;
    allLabel: string;
    allHref: string;
    items: NavProductLink[];
  };
  technology: NavLink;
  solutions: NavLink;
  contact: NavLink;
  cta: NavLink;
  /** Anchor of the contact section, present on every page. */
  contactAnchor: string;
  labels: {
    openMenu: string;
    closeMenu: string;
    language: string;
    mainNavigation: string;
    languageSwitcher: string;
    currentLanguage: string;
    switchTo: string;
    productsSubmenu: string;
    themeToggle: string;
  };
};

export async function buildNavContent(locale: Locale): Promise<NavContent> {
  const t = await getTranslations(locale);
  const texts = await getProductTexts(locale);

  return {
    brand: "PUDU INDUSTRIAL",
    home: { label: t.navigation.home, href: localizedPath(locale, { type: "home" }) },
    products: {
      label: t.navigation.products,
      allLabel: t.navigation.allProducts,
      allHref: homeSectionPath(locale, "products"),
      items: products.map((product) => {
        const content = texts[product.slug];
        return {
          slug: product.slug,
          name: content.name,
          category: content.category,
          href: localizedPath(locale, { type: "product", slug: product.slug }),
        };
      }),
    },
    technology: {
      label: t.navigation.technology,
      href: homeSectionPath(locale, "technology"),
    },
    solutions: {
      label: t.navigation.solutions,
      href: homeSectionPath(locale, "solutions"),
    },
    contact: {
      label: t.navigation.contact,
      href: homeSectionPath(locale, "contact"),
    },
    cta: {
      label: t.navigation.requestDemo,
      href: homeSectionPath(locale, "contact"),
    },
    contactAnchor: sectionId(locale, "contact"),
    labels: {
      openMenu: t.navigation.openMenu,
      closeMenu: t.navigation.closeMenu,
      language: t.navigation.language,
      mainNavigation: t.a11y.mainNavigation,
      languageSwitcher: t.a11y.languageSwitcher,
      currentLanguage: t.a11y.currentLanguage,
      switchTo: t.a11y.switchTo,
      productsSubmenu: t.a11y.productsSubmenu,
      themeToggle: t.a11y.themeToggle,
    },
  };
}
