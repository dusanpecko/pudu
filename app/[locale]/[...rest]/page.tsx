import { notFound } from "next/navigation";

/**
 * Catch-all for unknown paths inside a language, e.g. `/en/unknown`. Matching
 * here (instead of falling through to the global 404) keeps the locale layout,
 * so the navigation and the 404 copy stay in the right language.
 *
 * Static segments and `[slug]` routes take precedence over this catch-all.
 */
export default async function LocaleCatchAll() {
  notFound();
}
