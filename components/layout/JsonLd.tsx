"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";

type JsonLdProps = {
  /** A schema.org object. Serialised here, never by the caller. */
  data: Record<string, unknown>;
};

/**
 * Structured data for search engines, written into the server-rendered HTML
 * and nowhere else.
 *
 * Next's own guidance for JSON-LD is a native `<script type="application/ld+json">`
 * in the page, and that is what this used to be. It was correct and it was
 * noisy: React 19 warns whenever it *creates* a `<script>` element on the client,
 * and a language switch re-creates the whole page, JSON-LD included. The warning
 * was pointless for JSON-LD — nothing in it was ever meant to execute — but it
 * shared a console with warnings that did matter, and a console with one
 * permanent false alarm is a console nobody reads.
 *
 * The data only needs to exist where crawlers look, which is the HTML the server
 * sends for a URL — a crawler does not click the language switcher. So it is
 * injected through `useServerInsertedHTML`, outside the React tree: present in
 * every server response, absent from every client render, and React never sees a
 * script element to complain about. It lands in `<head>` rather than beside the
 * content it describes, which schema.org does not mind.
 *
 * `<` is escaped the way the Next guide shows, so a value cannot close the tag.
 * The data is ours, but the escape costs nothing and the guarantee is worth
 * having in one place rather than at every call site.
 */
export default function JsonLd({ data }: JsonLdProps) {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    // The stream can ask more than once; one copy is the right number.
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data).replace(/</g, "\\u003c"),
        }}
      />
    );
  });

  return null;
}
