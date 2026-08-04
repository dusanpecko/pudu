"use client";

import { createElement, useCallback, type ReactNode } from "react";

import { cx } from "@/lib/cx";

type RevealTag = "div" | "section" | "article" | "li" | "figure";

type RevealProps = {
  children: ReactNode;
  as?: RevealTag;
  className?: string;
  id?: string;
};

/**
 * Fades content in once it scrolls into view — the `.reveal` / `.reveal.on`
 * pair from the original site, driven by an IntersectionObserver.
 *
 * Content stays visible when JavaScript is unavailable (see the `<noscript>`
 * override in the layout) or when reduced motion is requested.
 */
export default function Reveal({ children, as = "div", className, id }: RevealProps) {
  // Callback ref: the observer is attached when the node mounts and the
  // returned cleanup runs when it unmounts.
  const attach = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("on");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("on");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return createElement(
    as,
    { ref: attach, id, className: cx("reveal", className) },
    children,
  );
}
