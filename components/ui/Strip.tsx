"use client";

import { Children, useCallback, useRef, useState, type ReactNode } from "react";

import Reveal from "@/components/effects/Reveal";
import { cx } from "@/lib/cx";

export type StripLabels = {
  previous: string;
  next: string;
  /** Accessible name of the scrolling row. */
  track: string;
};

type StripProps = {
  labels: StripLabels;
  /** Extra class on the outer wrapper, for per-use spacing. */
  className?: string;
  /** The items. Each one sizes itself; the strip only lays them in a row. */
  children: ReactNode;
};

/**
 * One row of anything that scrolls sideways.
 *
 * Extracted from the photo gallery when the fleet needed the same thing, so the
 * site has one way of scrolling a row rather than two that drift apart. The
 * gallery keeps its lightbox; this is only the row and its two buttons.
 *
 * The row is a scroll-snap container rather than a scripted carousel, so
 * dragging, a trackpad swipe and the arrow keys all work through the browser and
 * keep working if the buttons never get their JavaScript. The buttons only call
 * `scrollBy`, by one item, measured rather than assumed.
 *
 * A client component whose children are usually server-rendered — the product
 * cards resolve translations and images on the server — which is fine: it only
 * needs to know how many there are, never what they contain.
 */
export default function Strip({ labels, className, children }: StripProps) {
  const track = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // No buttons for a row that cannot scroll.
  const many = Children.count(children) > 1;

  /**
   * Attached as a ref callback rather than in an effect: the listener belongs to
   * the node's lifetime, and this way the first measurement happens on mount
   * without a render pass that only exists to set state.
   */
  const attachTrack = useCallback((node: HTMLDivElement | null) => {
    track.current = node;
    if (!node) return;

    const sync = () => {
      // The row has a few pixels of padding so the hover lift and focus ring are
      // not clipped, and mandatory snapping parks the first item at that padding
      // rather than at zero — measured at 4px, never 0, even after scrollTo(0).
      // So "at the start" is judged from the padding, plus one pixel for the
      // fractional scrollLeft that fractional zoom levels produce. Before this,
      // the "previous" button was never disabled at the start of either row.
      const pad = Number.parseFloat(getComputedStyle(node).paddingLeft) || 0;
      setAtStart(node.scrollLeft <= pad + 1);
      setAtEnd(node.scrollLeft + node.clientWidth >= node.scrollWidth - pad - 1);
    };

    sync();
    node.addEventListener("scroll", sync, { passive: true });

    // The visible count changes with the viewport, and with it whether there is
    // anything left to scroll.
    const observer = new ResizeObserver(sync);
    observer.observe(node);

    return () => {
      node.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, []);

  /** Scrolls by exactly one item, measured rather than assumed. */
  const scrollByItem = (direction: -1 | 1) => {
    const node = track.current;
    if (!node) return;

    const item = node.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(node).columnGap || "0") || 0;
    const step = item ? item.offsetWidth + gap : node.clientWidth;
    node.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  return (
    <Reveal className={cx("strip", className)}>
      {many ? (
        <div className="strip-controls">
          <button
            type="button"
            className="strip-arrow"
            onClick={() => scrollByItem(-1)}
            disabled={atStart}
            aria-label={labels.previous}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className="strip-arrow"
            onClick={() => scrollByItem(1)}
            disabled={atEnd}
            aria-label={labels.next}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}

      <div
        ref={attachTrack}
        className="strip-track"
        // Focusable so the arrow keys can scroll it; a scroll container with no
        // accessible name is a dead end for a screen reader.
        tabIndex={0}
        role="group"
        aria-label={labels.track}
      >
        {children}
      </div>
    </Reveal>
  );
}
