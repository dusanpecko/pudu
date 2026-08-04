import type { MetadataRoute } from "next";

import { locales } from "@/lib/i18n";
import { productSlugs } from "@/lib/products";
import type { Route } from "@/lib/routes";
import { alternateUrls, localizedUrl } from "@/lib/site";

const routes: Route[] = [
  { type: "home" },
  ...productSlugs.map((slug): Route => ({ type: "product", slug })),
];

/**
 * Every language version of every page, each on its own canonical domain and
 * carrying the full set of `hreflang` alternates.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) => {
    const languages = alternateUrls(route);

    return locales.map((locale) => ({
      url: localizedUrl(locale, route),
      changeFrequency: "monthly" as const,
      priority: route.type === "home" ? 1 : 0.8,
      alternates: { languages },
    }));
  });
}
