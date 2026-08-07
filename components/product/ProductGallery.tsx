import Image from "next/image";

import Reveal from "@/components/effects/Reveal";
import type { Locale } from "@/lib/i18n";
import { getProductContent, getTranslations } from "@/lib/translations";
import type { Product } from "@/types/product";

type ProductGalleryProps = {
  product: Product;
  locale: Locale;
};

/**
 * Wide scan visual, rendered only for models that ship a gallery image.
 */
export default async function ProductGallery({ product, locale }: ProductGalleryProps) {
  const t = await getTranslations(locale);
  const content = await getProductContent(product, locale);
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
