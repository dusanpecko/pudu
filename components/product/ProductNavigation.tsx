import Link from "next/link";

import Reveal from "@/components/effects/Reveal";
import type { Locale } from "@/lib/i18n";
import { getProductNeighbours } from "@/lib/products";
import { localizedPath } from "@/lib/routes";
import { getProductTexts, getTranslations } from "@/lib/translations";
import type { ProductSlug } from "@/types/product";

type ProductNavigationProps = {
  slug: ProductSlug;
  locale: Locale;
};

/** Previous / next model links at the end of a product page. */
export default async function ProductNavigation({
  slug,
  locale,
}: ProductNavigationProps) {
  const t = await getTranslations(locale);
  const texts = await getProductTexts(locale);
  const { previous, next } = getProductNeighbours(slug);

  return (
    <section className="section">
      <div className="wrap">
        <h2 className="sr-only">{t.product.otherModels}</h2>
        <Reveal className="pager">
          <Link href={localizedPath(locale, { type: "product", slug: previous.slug })}>
            <small>{t.product.previousModel}</small>
            <span>{texts[previous.slug].name}</span>
          </Link>
          <Link
            className="next"
            href={localizedPath(locale, { type: "product", slug: next.slug })}
          >
            <small>{t.product.nextModel}</small>
            <span>{texts[next.slug].name}</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
