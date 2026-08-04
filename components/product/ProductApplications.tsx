import Reveal from "@/components/effects/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getTranslations } from "@/data/translations";
import type { Locale } from "@/lib/i18n";
import { getProductContent } from "@/lib/products";
import type { Product } from "@/types/product";

type ProductApplicationsProps = {
  product: Product;
  locale: Locale;
};

/** Where the model is typically deployed. */
export default function ProductApplications({
  product,
  locale,
}: ProductApplicationsProps) {
  const t = getTranslations(locale);
  const content = getProductContent(product, locale);

  return (
    <section className="section">
      <div className="wrap">
        <SectionHeading
          titleLine1={t.product.applicationsTitle}
          description={t.product.applicationsDescription}
        />
        <div className="applications">
          {content.applications.map((application, index) => (
            <Reveal as="article" className="application" key={application.title}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <h3>{application.title}</h3>
              <p>{application.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
