import Reveal from "@/components/effects/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getTranslations } from "@/data/translations";
import type { Locale } from "@/lib/i18n";
import { sectionId } from "@/lib/routes";

type TechnologySectionProps = {
  locale: Locale;
};

/** Navigation, safety and integration — three technology pillars. */
export default function TechnologySection({ locale }: TechnologySectionProps) {
  const { technology } = getTranslations(locale).home;

  return (
    <section id={sectionId(locale, "technology")} className="section">
      <div className="wrap">
        <SectionHeading
          titleLine1={technology.titleLine1}
          titleLine2={technology.titleLine2}
          description={technology.description}
        />
        <div className="feature-grid">
          {technology.items.map((item) => (
            <Reveal as="article" className="feature" key={item.title}>
              <span className="num">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
