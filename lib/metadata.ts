import type { Metadata } from "next";

import { getTranslations } from "@/data/translations";
import { htmlLang, ogLocale, type Locale } from "@/lib/i18n";
import type { Route } from "@/lib/routes";
import {
  alternateUrls,
  localeAssetUrl,
  localeOrigin,
  localizedUrl,
} from "@/lib/site";
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
 * Localized metadata for one page: an absolute canonical URL on the language's
 * own domain, `hreflang` alternates across all three languages (and both
 * domains) and Open Graph tags.
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
  const canonical = localizedUrl(locale, route);
  const languages = alternateUrls(route);
  const imageUrl = image ? localeAssetUrl(locale, image.src) : undefined;

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
      images:
        image && imageUrl
          ? [
              {
                url: imageUrl,
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
      images: imageUrl ? [imageUrl] : undefined,
    },
    other: {
      "content-language": htmlLang(locale),
    },
    metadataBase: new URL(localeOrigin(locale)),
  };
}
