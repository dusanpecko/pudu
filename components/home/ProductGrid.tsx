import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/ui/ProductCard";
import type { Locale } from "@/lib/i18n";
import { getHomeProducts } from "@/lib/products";
import { sectionId } from "@/lib/routes";
import { getTranslations } from "@/lib/translations";

type ProductGridProps = {
  locale: Locale;
};

/**
 * The fleet, one tile per product in canonical order.
 *
 * The grid is four to a row, which was the whole fleet when the design was
 * drawn. It no longer is, so the CSS wraps and centres what does not fill a row
 * rather than leaving it orphaned at the left — see `.cards` in globals.css.
 */
export default async function ProductGrid({ locale }: ProductGridProps) {
  const t = await getTranslations(locale);
  const products = getHomeProducts();

  return (
    <section id={sectionId(locale, "products")} className="section">
      <div className="wrap">
        <SectionHeading
          titleLine1={t.home.products.titleLine1}
          titleLine2={t.home.products.titleLine2}
          description={t.home.products.description}
        />
        <div className="cards">
          {products.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              locale={locale}
              payloadLabel={t.specs.payload}
              runtimeLabel={t.specs.runtime}
              featuredLabel={t.product.featuredBadge}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
