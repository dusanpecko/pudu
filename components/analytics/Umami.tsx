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
 * Deliberately a plain script rather than next/script: with `afterInteractive`
 * the tag is injected only once React has hydrated, which loses visits that end
 * before that. This is the snippet Umami documents, it is present in the initial
 * HTML, and the tracker follows client-side navigation on its own through the
 * History API.
 *
 * `async`, not `defer`, and the difference is React's rather than the browser's.
 * React 19 treats `<script async src>` as a resource it owns: hoisted into
 * `<head>`, deduplicated by `src`, and left alone when the tree around it is
 * rebuilt. A `defer` script is to React just another element — one it re-creates
 * on every client mount of this layout, never executes, and warns about in the
 * console each time a visitor switches language.
 *
 * Umami's documentation shows `defer` and says nothing either way about `async`.
 * The tracker's source does: it reads its own attributes from
 * `document.currentScript`, which is set for an async script exactly as for a
 * deferred one, and it checks `document.readyState` before it starts — the guard
 * a script needs when it may run before the document has finished parsing. That
 * is what makes `async` safe here; only React cares which of the two it is.
 */
export default function Umami() {
  if (!analyticsEnabled) return null;
  const domains = umamiDomains();

  return (
    <script
      async
      src={umamiScriptSrc}
      data-website-id={umamiWebsiteId}
      data-domains={domains || undefined}
    />
  );
}
