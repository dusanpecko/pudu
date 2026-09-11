"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import Strip from "@/components/ui/Strip";

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
 * The row itself is the shared `Strip` — the fleet on the home page scrolls the
 * same way — so what is left here is what makes this a *photo* row: the figures,
 * and the lightbox.
 *
 * The lightbox is a native `<dialog>`: `showModal()` gives the focus trap, the
 * Escape key, the inert background and the backdrop, all four of which are easy
 * to get subtly wrong by hand. Only the arrow keys are ours.
 */
export default function GalleryGrid({ items, labels }: GalleryGridProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  const [index, setIndex] = useState(0);

  const many = items.length > 1;
  const current = items[index];
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
      <Strip
        className="gallery-slider"
        labels={{ previous: labels.previous, next: labels.next, track: labels.track }}
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
      </Strip>

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
