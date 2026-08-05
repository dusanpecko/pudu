import { siteOrigins } from "@/lib/site";

/**
 * Umami analytics.
 *
 * The tracker only loads when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set. Set it in
 * the production environment only — that way local development and preview
 * deployments never count towards the statistics, without needing to check the
 * hostname at runtime.
 *
 * The website id is not a secret; it is visible in the page source of every site
 * that uses Umami. It lives in an environment variable for the on/off control,
 * not for secrecy.
 */
export const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "";

/** Overridable so the site can move from Umami Cloud to a self-hosted instance. */
export const umamiScriptSrc =
  process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";

export const analyticsEnabled = Boolean(umamiWebsiteId);

/**
 * Hostnames the tracker is allowed to report from, derived from the configured
 * canonical origins. Umami drops events sent from anywhere else, which keeps a
 * local build out of the statistics even if it is run with production
 * environment variables — the mistake the environment gating alone cannot catch.
 */
export function umamiDomains(): string {
  return siteOrigins
    .map((origin) => {
      try {
        return new URL(origin).hostname;
      } catch {
        return "";
      }
    })
    .filter((host) => host && host !== "localhost")
    .join(",");
}
