import Link from "next/link";

import Reveal from "@/components/effects/Reveal";
import { getTranslations } from "@/data/translations";
import type { Locale } from "@/lib/i18n";
import { getProductContent, getProductNeighbours } from "@/lib/products";
import { localizedPath } from "@/lib/routes";
import type { ProductSlug } from "@/types/product";

type ProductNavigationProps = {
  slug: ProductSlug;
  locale: Locale;
};

/** Previous / next model links at the end of a product page. */
export default function ProductNavigation({ slug, locale }: ProductNavigationProps) {
  const t = getTranslations(locale);
  const { previous, next } = getProductNeighbours(slug);

  return (
    <section className="section">
      <div className="wrap">
        <h2 className="sr-only">{t.product.otherModels}</h2>
        <Reveal className="pager">
          <Link href={localizedPath(locale, { type: "product", slug: previous.slug })}>
            <small>{t.product.previousModel}</small>
            <span>{getProductContent(previous, locale).name}</span>
          </Link>
          <Link
            className="next"
            href={localizedPath(locale, { type: "product", slug: next.slug })}
          >
            <small>{t.product.nextModel}</small>
            <span>{getProductContent(next, locale).name}</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
