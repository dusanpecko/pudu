import Image from "next/image";

import Reveal from "@/components/effects/Reveal";
import type { Locale } from "@/lib/i18n";
import { resolveHeroImage } from "@/lib/gallery";
import { formatSpecValue, specLabel } from "@/lib/products";
import { sectionId } from "@/lib/routes";
import { getProductContent, getTranslations } from "@/lib/translations";
import type { Product } from "@/types/product";

type ProductStoryProps = {
  product: Product;
  locale: Locale;
};

/** Framed product visual next to the description and the parameter table. */
export default async function ProductStory({ product, locale }: ProductStoryProps) {
  const t = await getTranslations(locale);
  const content = await getProductContent(product, locale);
  const image = await resolveHeroImage(product.slug, product.heroImage);

  return (
    <section className="section">
      <div className="wrap story">
        <Reveal className="story-media">
          <Image
            className={image.hasBackdrop ? "blend-backdrop" : undefined}
            src={image.src}
            alt={content.imageAlt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 950px) 84vw, 44vw"
          />
        </Reveal>

        <Reveal className="story-copy">
          <p className="eyebrow">{t.product.storyEyebrow}</p>
          <h2>{content.headline}</h2>
          <p>{content.description}</p>

          <h3 className="sr-only">{t.product.specifications}</h3>
          <dl className="list" id={sectionId(locale, "specs")}>
            {product.specifications.map((entry) => (
              <div key={entry.key}>
                <dt>{specLabel(entry, t)}</dt>
                <dd>
                  <small>{formatSpecValue(entry.value, locale, t)}</small>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
