import Image from "next/image";

import Reveal from "@/components/effects/Reveal";
import { getTranslations } from "@/data/translations";
import type { Locale } from "@/lib/i18n";
import { getProductContent } from "@/lib/products";
import type { Product } from "@/types/product";

type ProductGalleryProps = {
  product: Product;
  locale: Locale;
};

/**
 * Wide scan visual, rendered only for models that ship a gallery image.
 */
export default function ProductGallery({ product, locale }: ProductGalleryProps) {
  const t = getTranslations(locale);
  const content = getProductContent(product, locale);
  const image = product.galleryImages?.[0];

  if (!image) return null;

  return (
    <section className="section">
      <div className="wrap gallery">
        <Reveal className="gallery-frame" as="figure">
          <Image
            src={image.src}
            alt={content.galleryAlt ?? content.imageAlt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 1280px) 100vw, 1240px"
          />
        </Reveal>
        <Reveal className="gallery-copy">
          <h3>{t.product.galleryTitle}</h3>
          <p>{t.product.galleryDescription}</p>
        </Reveal>
      </div>
    </section>
  );
}
