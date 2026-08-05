import {
  analyticsEnabled,
  umamiDomains,
  umamiScriptSrc,
  umamiWebsiteId,
} from "@/lib/analytics";

/**
 * Cookieless page analytics. Renders nothing when no website id is configured,
 * so development and preview deployments stay out of the statistics.
 *
 * Deliberately a plain deferred script rather than next/script: with
 * `afterInteractive` the tag is injected only once React has hydrated, which
 * loses visits that end before that. This is the snippet Umami documents, it is
 * present in the initial HTML, and the tracker follows client-side navigation on
 * its own through the History API.
 */
export default function Umami() {
  if (!analyticsEnabled) return null;
  const domains = umamiDomains();

  return (
    <script
      defer
      src={umamiScriptSrc}
      data-website-id={umamiWebsiteId}
      data-domains={domains || undefined}
    />
  );
}
