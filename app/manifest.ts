import type { MetadataRoute } from "next";

import { defaultLocale } from "@/lib/i18n";
import { getTranslations } from "@/lib/translations";

/**
 * The installable-app description, served at `/manifest.webmanifest`. Next adds
 * the `<link rel="manifest">` tag to every document from this file's presence
 * alone — neither root layout has to mention it.
 *
 * The name and description are read from the translations rather than repeated
 * here, so an edit in /admin/translations-manager reaches the install prompt too.
 * Only the default language is available: a manifest is one document per origin,
 * and `start_url: "/"` is what makes that acceptable — the root redirect in
 * next.config.ts sends each market to its own language, so an installed icon
 * opens Slovak on the Slovak domain and Czech on the Czech one.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations(defaultLocale);

  return {
    name: t.meta.siteName,
    // The brand alone — launchers truncate a long name under the icon.
    short_name: "PUDU",
    description: t.meta.homeDescription,
    start_url: "/",
    display: "standalone",
    // The site's dark ink, which is also what the icons are drawn against.
    background_color: "#0b071c",
    theme_color: "#0b071c",
    icons: [
      // Drawn on transparency, so these stay `any`: Android would crop a
      // full-bleed icon to its safe circle and clip the ring off the logo.
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // The padded variant that survives that crop.
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
