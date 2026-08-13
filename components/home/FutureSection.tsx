import Image from "next/image";

import Reveal from "@/components/effects/Reveal";
import type { Locale } from "@/lib/i18n";
import { resolveHeroImage } from "@/lib/gallery";
import { getProduct } from "@/lib/products";
import { sectionId } from "@/lib/routes";
import { getTranslations } from "@/lib/translations";

type FutureSectionProps = {
  locale: Locale;
};

/** "From one robot to a fleet" — the scaling story with a framed visual. */
export default async function FutureSection({ locale }: FutureSectionProps) {
  const { solutions } = (await getTranslations(locale)).home;
  const product = getProduct("pudu-t600-underride");
  // The same render the product page shows, so replacing it in the admin
  // updates both places rather than only one.
  const image = await resolveHeroImage(product.slug, product.heroImage);

  return (
    <section id={sectionId(locale, "solutions")} className="section">
      <div className="wrap story">
        <Reveal className="story-media">
          <Image
            src={image.src}
            alt={solutions.imageAlt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 950px) 84vw, 44vw"
          />
        </Reveal>

        <Reveal className="story-copy">
          <p className="eyebrow">{solutions.eyebrow}</p>
          <h2>{solutions.title}</h2>
          <p>{solutions.description}</p>

          <div className="list">
            {solutions.items.map((item, index) => (
              <div key={item}>
                <span>{item}</span>
                <small>{String(index + 1).padStart(2, "0")}</small>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
