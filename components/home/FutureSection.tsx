import Image from "next/image";

import Reveal from "@/components/effects/Reveal";
import { getTranslations } from "@/data/translations";
import type { Locale } from "@/lib/i18n";
import { getProduct } from "@/lib/products";
import { sectionId } from "@/lib/routes";

type FutureSectionProps = {
  locale: Locale;
};

/** "From one robot to a fleet" — the scaling story with a framed visual. */
export default function FutureSection({ locale }: FutureSectionProps) {
  const { solutions } = getTranslations(locale).home;
  const product = getProduct("pudu-t600-underride");

  return (
    <section id={sectionId(locale, "solutions")} className="section">
      <div className="wrap story">
        <Reveal className="story-media">
          <Image
            src={product.heroImage.src}
            alt={solutions.imageAlt}
            width={product.heroImage.width}
            height={product.heroImage.height}
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
