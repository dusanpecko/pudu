import GalleryGrid, { type GalleryItem } from "@/components/gallery/GalleryGrid";
import SectionHeading from "@/components/ui/SectionHeading";
import { loadGallery, textFor, type GalleryKey } from "@/lib/gallery";
import type { Locale } from "@/lib/i18n";
import { sectionId } from "@/lib/routes";
import { getTranslations } from "@/lib/translations";

type PhotoGalleryProps = {
  locale: Locale;
  /** Which gallery to render; the home page passes `home`. */
  gallery: GalleryKey;
  /** Product pages supply their own heading instead of the generic one. */
  titleLine1?: string;
  titleLine2?: string;
  description?: string;
};

/**
 * Photographs from real deployments, uploaded in /admin/gallery.
 *
 * Renders nothing at all when the gallery is empty — an "our robots in real
 * operation" heading above a blank strip is worse than no section, and it also
 * means the component can ship before any image exists.
 *
 * Every image is 16:9 by the time it reaches here (the upload crops it), so the
 * grid needs no ratio juggling and nothing shifts as the images load.
 */
export default async function PhotoGallery({
  locale,
  gallery,
  titleLine1,
  titleLine2,
  description,
}: PhotoGalleryProps) {
  const images = await loadGallery(gallery);
  if (images.length === 0) return null;

  const t = await getTranslations(locale);
  const copy = t.home.gallery;

  // Resolved here so the browser receives one language instead of four.
  const items: GalleryItem[] = images.map((image) => ({
    id: image.id,
    url: image.url,
    width: image.width,
    height: image.height,
    alt: textFor(image.alt, locale),
    title: textFor(image.title, locale),
    caption: textFor(image.caption, locale),
  }));

  const heading = `${titleLine1 ?? copy.titleLine1} ${
    titleLine2 ?? copy.titleLine2
  }`.trim();

  // ImageGallery structured data: this is what a crawler reads to understand
  // the images as content rather than decoration.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: heading,
    image: images.map((image) => ({
      "@type": "ImageObject",
      contentUrl: image.url,
      width: image.width,
      height: image.height,
      name: textFor(image.title, locale) || textFor(image.alt, locale),
      description: textFor(image.caption, locale) || textFor(image.alt, locale),
    })),
  };

  return (
    <section id={sectionId(locale, "gallery")} className="section">
      <div className="wrap">
        <SectionHeading
          titleLine1={titleLine1 ?? copy.titleLine1}
          titleLine2={titleLine2 ?? copy.titleLine2}
          description={description ?? copy.description}
        />

        <GalleryGrid
          items={items}
          labels={{
            open: t.a11y.galleryOpen,
            close: t.a11y.galleryClose,
            previous: t.a11y.galleryPrevious,
            next: t.a11y.galleryNext,
            counter: t.a11y.galleryCounter,
            // The section's own heading names the strip, so the scroll
            // container needs no translation key of its own.
            track: heading,
          }}
        />
      </div>

      <script
        type="application/ld+json"
        // Serialised by us from our own data, never from user input that could
        // close the tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
    </section>
  );
}
