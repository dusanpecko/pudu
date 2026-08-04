import type { Metadata } from "next";

import { getTranslations } from "@/data/translations";
import { htmlLang, ogLocale, type Locale } from "@/lib/i18n";
import { alternatePaths, localizedPath, type Route } from "@/lib/routes";
import { siteUrl } from "@/lib/site";
import type { ProductImage } from "@/types/product";

type PageMetadataInput = {
  locale: Locale;
  route: Route;
  title: string;
  description: string;
  image?: ProductImage;
  imageAlt?: string;
};

/**
 * Localized metadata for one page: canonical URL, `hreflang` alternates for
 * all three languages and Open Graph tags.
 */
export function buildPageMetadata({
  locale,
  route,
  title,
  description,
  image,
  imageAlt,
}: PageMetadataInput): Metadata {
  const t = getTranslations(locale);
  const canonical = localizedPath(locale, route);
  const languages = alternatePaths(route);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...languages,
        "x-default": languages.sk,
      },
    },
    openGraph: {
      type: "website",
      siteName: t.meta.siteName,
      title,
      description,
      url: canonical,
      locale: ogLocale(locale),
      images: image
        ? [
            {
              url: image.src,
              width: image.width,
              height: image.height,
              alt: imageAlt ?? title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image.src] : undefined,
    },
    other: {
      "content-language": htmlLang(locale),
    },
    metadataBase: new URL(siteUrl),
  };
}
