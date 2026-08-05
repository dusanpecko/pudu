import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/ui/ProductCard";
import { getTranslations } from "@/data/translations";
import type { Locale } from "@/lib/i18n";
import { getHomeProducts } from "@/lib/products";
import { sectionId } from "@/lib/routes";

type ProductGridProps = {
  locale: Locale;
};

/** The fleet: four product tiles in the order used by the original design. */
export default function ProductGrid({ locale }: ProductGridProps) {
  const t = getTranslations(locale);
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
