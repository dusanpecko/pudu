import type { MetadataRoute } from "next";

import { siteOrigins } from "@/lib/site";

/**
 * Both domains serve the same file, so every domain's sitemap is listed — that
 * is also what lets the shared sitemap be cross-submitted in Search Console.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: siteOrigins.map((origin) => `${origin}/sitemap.xml`),
  };
}
