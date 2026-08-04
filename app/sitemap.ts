import type { MetadataRoute } from "next";

import { locales } from "@/lib/i18n";
import { productSlugs } from "@/lib/products";
import { alternatePaths, localizedPath, type Route } from "@/lib/routes";
import { siteUrl } from "@/lib/site";

const routes: Route[] = [
  { type: "home" },
  ...productSlugs.map((slug): Route => ({ type: "product", slug })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) => {
    const paths = alternatePaths(route);

    return locales.map((locale) => ({
      url: `${siteUrl}${localizedPath(locale, route)}`,
      changeFrequency: "monthly" as const,
      priority: route.type === "home" ? 1 : 0.8,
      alternates: {
        languages: {
          sk: `${siteUrl}${paths.sk}`,
          cs: `${siteUrl}${paths.cs}`,
          en: `${siteUrl}${paths.en}`,
        },
      },
    }));
  });
}
