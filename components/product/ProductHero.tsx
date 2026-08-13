import Link from "next/link";

import GridFloor from "@/components/effects/GridFloor";
import HologramPanel from "@/components/effects/HologramPanel";
import { LinkButton } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";
import { resolveHeroImage } from "@/lib/gallery";
import { homeSectionPath, sectionId } from "@/lib/routes";
import { getProductContent, getTranslations } from "@/lib/translations";
import type { Product } from "@/types/product";

type ProductHeroProps = {
  product: Product;
  locale: Locale;
};

export default async function ProductHero({ product, locale }: ProductHeroProps) {
  const t = await getTranslations(locale);
  const content = await getProductContent(product, locale);
  const heroImage = await resolveHeroImage(product.slug, product.heroImage);
  const [firstWord, ...restWords] = content.name.split(" ");

  return (
    <header className="hero product-hero">
      <GridFloor />
      <div className="wrap hero-layout">
        <div>
          <p className="eyebrow">{content.category}</p>
          <h1>
            {firstWord}
            <br />
            {restWords.join(" ")}
          </h1>
          <p className="lead">{content.shortDescription}</p>

          <div className="actions">
            <LinkButton href={`#${sectionId(locale, "contact")}`}>
              {t.navigation.requestDemo}
            </LinkButton>
            <LinkButton href={`#${sectionId(locale, "specs")}`} variant="ghost">
              {t.product.specifications}
            </LinkButton>
          </div>

          <Link className="back" href={homeSectionPath(locale, "products")}>
            <span aria-hidden="true">←</span> {t.product.backToProducts}
          </Link>
        </div>

        <HologramPanel
          image={heroImage}
          alt={content.imageAlt}
          statusLabel={t.product.hudStatus}
          dataLabel={`${t.specs.payload.toUpperCase()} / ${product.payload.toUpperCase()}`}
          priority
        />
      </div>
    </header>
  );
}
