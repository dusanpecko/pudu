import ProductCard from "@/components/ui/ProductCard";
import SectionHeading from "@/components/ui/SectionHeading";
import Strip from "@/components/ui/Strip";
import type { Locale } from "@/lib/i18n";
import { getHomeProducts } from "@/lib/products";
import { sectionId } from "@/lib/routes";
import { getTranslations } from "@/lib/translations";

type ProductSliderProps = {
  locale: Locale;
};

/**
 * The fleet, one tile per product in canonical order, in a row that scrolls.
 *
 * It was a grid of four while the fleet was four. A fifth product left a tile
 * stranded on a second row, and a sixth would leave two, so the row now scrolls
 * — on the same strip the photo gallery uses, with the same buttons and the same
 * swipe. Three tiles fill a wide screen; the arrows are named after what they
 * move between, "previous model" and "next model", from the product pages.
 */
export default async function ProductSlider({ locale }: ProductSliderProps) {
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
        <Strip
          className="fleet"
          labels={{
            previous: t.product.previousModel,
            next: t.product.nextModel,
            // The section's own heading names the row, so it needs no
            // translation key of its own.
            track: `${t.home.products.titleLine1} ${t.home.products.titleLine2}`,
          }}
        >
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
        </Strip>
      </div>
    </section>
  );
}
