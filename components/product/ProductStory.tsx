import Image from "next/image";

import Reveal from "@/components/effects/Reveal";
import { getTranslations } from "@/data/translations";
import type { Locale } from "@/lib/i18n";
import { formatSpecValue, getProductContent, specLabel } from "@/lib/products";
import { sectionId } from "@/lib/routes";
import type { Product } from "@/types/product";

type ProductStoryProps = {
  product: Product;
  locale: Locale;
};

/** Framed product visual next to the description and the parameter table. */
export default function ProductStory({ product, locale }: ProductStoryProps) {
  const t = getTranslations(locale);
  const content = getProductContent(product, locale);

  return (
    <section className="section">
      <div className="wrap story">
        <Reveal className="story-media">
          <Image
            className={product.heroImage.hasBackdrop ? "blend-screen" : undefined}
            src={product.heroImage.src}
            alt={content.imageAlt}
            width={product.heroImage.width}
            height={product.heroImage.height}
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
                <dt>{specLabel(entry, locale)}</dt>
                <dd>
                  <small>{formatSpecValue(entry.value, locale)}</small>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
