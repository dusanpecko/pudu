import Reveal from "@/components/effects/Reveal";
import { getTranslations } from "@/data/translations";
import type { Locale } from "@/lib/i18n";

type ProductFeaturesProps = {
  locale: Locale;
};

/** Safety, uptime and scaling — the three guarantees shared by every model. */
export default function ProductFeatures({ locale }: ProductFeaturesProps) {
  const t = getTranslations(locale);

  return (
    <section className="section">
      <div className="wrap">
        <h2 className="sr-only">{t.product.features}</h2>
        <div className="feature-grid">
          {t.product.sharedFeatures.map((feature) => (
            <Reveal as="article" className="feature" key={feature.title}>
              <span className="num">{feature.label}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
