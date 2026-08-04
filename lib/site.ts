/**
 * Absolute site origin used for canonical URLs, `hreflang` alternates and
 * Open Graph images. Set `NEXT_PUBLIC_SITE_URL` for the deployed domain.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
