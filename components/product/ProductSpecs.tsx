import Reveal from "@/components/effects/Reveal";
import type { Locale } from "@/lib/i18n";
import { getSpecHighlights } from "@/lib/products";
import { getTranslations } from "@/lib/translations";
import type { Product } from "@/types/product";

type ProductSpecsProps = {
  product: Product;
  locale: Locale;
};

/** Four headline values directly below the product hero. */
export default async function ProductSpecs({ product, locale }: ProductSpecsProps) {
  const highlights = getSpecHighlights(product, await getTranslations(locale));

  return (
    <section className="section tight">
      <Reveal className="wrap specs">
        {highlights.map((item) => (
          <div className="spec" key={item.label}>
            <b>{item.value}</b>
            <span>{item.label}</span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
