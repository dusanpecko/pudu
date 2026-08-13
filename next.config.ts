import type { NextConfig } from "next";

import { defaultLocale, type Locale } from "./lib/i18n";

/**
 * Host of the Supabase storage bucket the gallery images live in. Derived from
 * the connection variable rather than hardcoded, so a different project — a
 * branch database, say — needs no change here.
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

/**
 * The market domains, read from the same variables lib/site.ts builds the
 * canonical URLs from. Deriving both from one source is what keeps a domain from
 * declaring one market in its canonical tag while its front page opens another.
 */
const marketDomains: { locale: Locale; url: string | undefined }[] = [
  { locale: "cz", url: process.env.NEXT_PUBLIC_SITE_URL_CZ },
  { locale: "en", url: process.env.NEXT_PUBLIC_SITE_URL_EN },
  { locale: "de", url: process.env.NEXT_PUBLIC_SITE_URL_DE },
];

/** Both spellings of a host, since a visitor may arrive at either. */
function hostVariants(url: string): string[] {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return [];
  }

  const bare = hostname.replace(/^www\./, "");
  return [...new Set([bare, `www.${bare}`])];
}

/**
 * Sends the front page of each market domain to its own language.
 *
 * Without this every domain opens Slovak, because the only rule is the
 * catch-all below — so the English domain would greet an English visitor in
 * Slovak. The specific hosts come first: the first matching redirect wins.
 */
function rootRedirects() {
  const perMarket = marketDomains.flatMap(({ locale, url }) =>
    url
      ? hostVariants(url).map((host) => ({
          source: "/",
          has: [{ type: "host" as const, value: host }],
          destination: `/${locale}`,
          permanent: false,
        }))
      : [],
  );

  return [
    ...perMarket,
    // Everything else, the primary domain and localhost included.
    { source: "/", destination: `/${defaultLocale}`, permanent: false },
  ];
}

const nextConfig: NextConfig = {
  images: {
    // Without this, next/image refuses the remote gallery URLs outright.
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/pudu/**",
          },
        ]
      : [],
  },
  async redirects() {
    return rootRedirects();
  },
};

export default nextConfig;
