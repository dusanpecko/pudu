import type { NextConfig } from "next";

import { defaultLocale } from "./lib/i18n";

/**
 * Host of the Supabase storage bucket the gallery images live in. Derived from
 * the connection variable rather than hardcoded, so a different project — a
 * branch database, say — needs no change here.
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

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
    return [
      {
        source: "/",
        destination: `/${defaultLocale}`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
