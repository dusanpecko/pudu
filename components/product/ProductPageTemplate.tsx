import ContactSection from "@/components/contact/ContactSection";
import ProductApplications from "@/components/product/ProductApplications";
import ProductFeatures from "@/components/product/ProductFeatures";
import ProductGallery from "@/components/product/ProductGallery";
import ProductHero from "@/components/product/ProductHero";
import ProductModes from "@/components/product/ProductModes";
import ProductNavigation from "@/components/product/ProductNavigation";
import ProductSpecs from "@/components/product/ProductSpecs";
import ProductStory from "@/components/product/ProductStory";
import { getTranslations } from "@/data/translations";
import type { Locale } from "@/lib/i18n";
import { getProductContent } from "@/lib/products";
import type { Product } from "@/types/product";

type ProductPageTemplateProps = {
  product: Product;
  locale: Locale;
};

/**
 * One template for all four models in all three languages — only the data
 * changes.
 */
export default function ProductPageTemplate({
  product,
  locale,
}: ProductPageTemplateProps) {
  const t = getTranslations(locale);
  const content = getProductContent(product, locale);

  return (
    <>
      <ProductHero product={product} locale={locale} />
      <ProductSpecs product={product} locale={locale} />
      <ProductStory product={product} locale={locale} />
      <ProductModes product={product} locale={locale} />
      <ProductGallery product={product} locale={locale} />
      <ProductFeatures locale={locale} />
      <ProductApplications product={product} locale={locale} />
      <ProductNavigation slug={product.slug} locale={locale} />
      <ContactSection
        locale={locale}
        eyebrow={content.name}
        title={t.product.ctaTitle}
        description={t.product.ctaDescription}
        defaultProduct={product.slug}
      />
    </>
  );
}
