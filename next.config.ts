import type { NextConfig } from "next";

import { defaultLocale } from "./lib/i18n";

const nextConfig: NextConfig = {
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
