"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import Reveal from "@/components/effects/Reveal";

/**
 * One image, with its text already resolved for the current language. Resolving
 * on the server keeps four languages out of the browser bundle.
 */
export type GalleryItem = {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  caption: string;
};

export type GalleryLabels = {
  open: string;
  close: string;
  previous: string;
  next: string;
  /** Contains `{index}` and `{total}`. */
  counter: string;
  /** Accessible name of the scrolling strip. */
  track: string;
};

type GalleryGridProps = {
  items: GalleryItem[];
  labels: GalleryLabels;
};

/**
 * A single row of photographs that scrolls sideways, and the lightbox it opens.
 *
 * The strip is a scroll-snap container rather than a scripted carousel, so
 * dragging, a trackpad swipe and the arrow keys all work through the browser and
 * keep working if the buttons never get their JavaScript. The buttons only call
 * `scrollBy`.
 *
 * The lightbox is a native `<dialog>`: `showModal()` gives the focus trap, the
 * Escape key, the inert background and the backdrop, all four of which are easy
 * to get subtly wrong by hand. Only the arrow keys are ours.
 */
export default function GalleryGrid({ items, labels }: GalleryGridProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement | null>(null);

  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const many = items.length > 1;
  const current = items[index];

  /**
   * Attached as a ref callback rather than in an effect: the listener belongs to
   * the node's lifetime, and this way the first measurement happens on mount
   * without a render pass that only exists to set state.
   */
  const attachTrack = useCallback((node: HTMLDivElement | null) => {
    track.current = node;
    if (!node) return;

    const sync = () => {
      // A fractional scrollLeft is normal at fractional zoom levels, so both
      // ends need a pixel of tolerance or the buttons never quite disable.
      setAtStart(node.scrollLeft <= 1);
      setAtEnd(node.scrollLeft + node.clientWidth >= node.scrollWidth - 1);
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

  /** Scrolls by exactly one card, measured rather than assumed. */
  const scrollByCard = (direction: -1 | 1) => {
    const node = track.current;
    if (!node) return;

    const card = node.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(node).columnGap || "0") || 0;
    const step = card ? card.offsetWidth + gap : node.clientWidth;
    node.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  const open = (next: number) => {
    setIndex(next);
    dialog.current?.showModal();
  };

  const step = (direction: -1 | 1) => {
    // Wrapping means the arrow keys never dead-end, which matters more in a
    // lightbox than knowing you reached the end.
    setIndex((value) => (value + direction + items.length) % items.length);
  };

  return (
    <>
      <Reveal className="gallery-slider">
        {many ? (
          <div className="gallery-controls">
            <button
              type="button"
              className="gallery-arrow"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label={labels.previous}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className="gallery-arrow"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label={labels.next}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : null}

        <div
          ref={attachTrack}
          className="gallery-track"
          // Focusable so the arrow keys can scroll it; a scroll container with
          // no accessible name is a dead end for a screen reader.
          tabIndex={0}
          role="group"
          aria-label={labels.track}
        >
          {items.map((item, position) => (
            <figure className="gallery-item" key={item.id}>
              <button
                type="button"
                className="gallery-open"
                onClick={() => open(position)}
                aria-label={`${labels.open}: ${item.alt}`}
              >
                <Image
                  src={item.url}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(max-width: 700px) 88vw, (max-width: 1100px) 46vw, 600px"
                  // The first two are visible without scrolling; the rest can
                  // wait until they are scrolled towards.
                  loading={position < 2 ? "eager" : "lazy"}
                />
              </button>
              {item.title || item.caption ? (
                <figcaption>
                  {item.title ? <strong>{item.title}</strong> : null}
                  {item.caption ? <span>{item.caption}</span> : null}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </Reveal>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={current?.alt}
        onKeyDown={(event) => {
          if (!many) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
        }}
        // A click landing on the dialog itself is a click on the backdrop: the
        // figure inside covers everything else.
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        {current ? (
          <figure className="lightbox-figure">
            <Image
              src={current.url}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="(max-width: 1100px) 94vw, 1500px"
              priority
            />

            {current.title || current.caption ? (
              <figcaption>
                {current.title ? <strong>{current.title}</strong> : null}
                {current.caption ? <span>{current.caption}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <button
          type="button"
          className="lightbox-close"
          onClick={() => dialog.current?.close()}
          aria-label={labels.close}
        >
          <span aria-hidden="true">✕</span>
        </button>

        {many ? (
          <>
            <button
              type="button"
              className="lightbox-nav prev"
              onClick={() => step(-1)}
              aria-label={labels.previous}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className="lightbox-nav next"
              onClick={() => step(1)}
              aria-label={labels.next}
            >
              <span aria-hidden="true">→</span>
            </button>
            <p className="lightbox-counter" aria-live="polite">
              {labels.counter
                .replace("{index}", String(index + 1))
                .replace("{total}", String(items.length))}
            </p>
          </>
        ) : null}
      </dialog>
    </>
  );
}
