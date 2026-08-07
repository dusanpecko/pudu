import Reveal from "@/components/effects/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Locale } from "@/lib/i18n";
import { getProductContent, getTranslations } from "@/lib/translations";
import type { Product } from "@/types/product";

type ProductModesProps = {
  product: Product;
  locale: Locale;
};

/** Three product specific capabilities — "three layers of intelligence". */
export default async function ProductModes({ product, locale }: ProductModesProps) {
  const t = await getTranslations(locale);
  const content = await getProductContent(product, locale);

  return (
    <section className="section">
      <div className="wrap">
        <SectionHeading
          titleLine1={t.product.featuresTitleLine1}
          titleLine2={t.product.featuresTitleLine2}
          description={t.product.featuresDescription}
        />
        <div className="modes">
          {content.features.map((feature, index) => (
            <Reveal as="article" className="mode" key={feature.title}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
