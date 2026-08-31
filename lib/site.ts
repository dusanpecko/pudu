import type { Locale } from "@/lib/i18n";
import { localizedPath, type HreflangCode, type Route } from "@/lib/routes";

/**
 * Canonical origins per market. Slovak and English live on the Slovak domain,
 * Czech on the Czech one, so each language declares exactly one canonical host
 * and the two domains do not compete as duplicate content.
 *
 * Resolution of the primary origin:
 *  1. `NEXT_PUBLIC_SITE_URL` — the real domain, set this in the deployment.
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` — the project's production domain, so a
 *     deployment without step 1 still gets absolute URLs instead of localhost.
 *     Vercel exposes it at build time; preview deployments also report the
 *     production domain, which is what canonical URLs should point at.
 *  3. `http://localhost:3000` for local development.
 *
 * `NEXT_PUBLIC_SITE_URL_CZ`, `NEXT_PUBLIC_SITE_URL_EN` and
 * `NEXT_PUBLIC_SITE_URL_DE` move those markets onto their own domains. Leave
 * them unset in development and on previews — everything then stays on a single
 * host.
 *
 * Only imported from server code (metadata, sitemap, robots), which is why the
 * unprefixed Vercel variable can be used.
 */
function trimSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolvePrimaryOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return trimSlashes(explicit);

  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelDomain) return `https://${vercelDomain}`;

  return "http://localhost:3000";
}

/** Primary origin — used for the Slovak and English versions. */
export const siteUrl = resolvePrimaryOrigin();

function marketOrigin(value: string | undefined): string {
  return value ? trimSlashes(value) : siteUrl;
}

const localeOrigins: Record<Locale, string> = {
  sk: siteUrl,
  cz: marketOrigin(process.env.NEXT_PUBLIC_SITE_URL_CZ),
  en: marketOrigin(process.env.NEXT_PUBLIC_SITE_URL_EN),
  de: marketOrigin(process.env.NEXT_PUBLIC_SITE_URL_DE),
};

/** Canonical origin of one language version. */
export function localeOrigin(locale: Locale): string {
  return localeOrigins[locale];
}

/** Every distinct origin the site is served from, primary first. */
export const siteOrigins: string[] = [
  ...new Set([siteUrl, ...Object.values(localeOrigins)]),
];

/**
 * Both spellings of every host in the given origins.
 *
 * Pure, and exported separately from {@link siteHostnames} so it can be tested
 * without the environment — see tests/site-hostnames.test.ts, which exists
 * because a mistake here is invisible outside production.
 *
 * Both spellings, because the site redirects bare domains to `www` and anything
 * reporting a hostname back to us — a Turnstile token, an `Origin` header —
 * carries whichever host the visitor actually stood on.
 */
export function originHostnames(origins: readonly string[]): Set<string> {
  return new Set(
    origins.flatMap((origin) => {
      let hostname: string;
      try {
        hostname = new URL(origin).hostname;
      } catch {
        // A malformed origin contributes nothing rather than throwing. One bad
        // variable must not empty the whole set, which is used to decide what to
        // trust — an empty set trusts nothing and would refuse every submission.
        return [];
      }
      const bare = hostname.replace(/^www\./, "");
      return [bare, `www.${bare}`];
    }),
  );
}

/**
 * The hosts this site is served from, as hostnames.
 *
 * The answer to "is this ours?" for anything that names a host: which hostnames a
 * Turnstile token may have been solved on (lib/turnstile.ts), and which `Origin`
 * a form submission may carry (app/[locale]/contact-actions.ts). One definition,
 * derived from the same variables as the canonical URLs, so a market that moves
 * to a new domain is covered by the change somebody had to make anyway.
 */
export const siteHostnames: ReadonlySet<string> = originHostnames(siteOrigins);

/** Absolute canonical URL of a page. */
export function localizedUrl(locale: Locale, route: Route): string {
  return `${localeOrigin(locale)}${localizedPath(locale, route)}`;
}

/**
 * Absolute URL of every language version of one route, keyed by the standard
 * language code used in `hreflang` (`cs`, not the `cz` URL segment).
 */
export function alternateUrls(route: Route): Record<HreflangCode, string> {
  return {
    sk: localizedUrl("sk", route),
    cs: localizedUrl("cz", route),
    en: localizedUrl("en", route),
    de: localizedUrl("de", route),
  };
}

/** Absolute URL of an asset on the canonical host of the given language. */
export function localeAssetUrl(locale: Locale, path: string): string {
  return `${localeOrigin(locale)}${path}`;
}
