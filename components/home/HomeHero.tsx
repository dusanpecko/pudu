import CountUp from "@/components/effects/CountUp";
import GridFloor from "@/components/effects/GridFloor";
import HologramPanel from "@/components/effects/HologramPanel";
import { LinkButton } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";
import { getProduct } from "@/lib/products";
import { homeSectionPath } from "@/lib/routes";
import { getProductContent, getTranslations } from "@/lib/translations";

type HomeHeroProps = {
  locale: Locale;
};

/** Payload range across the fleet, shown in the hero statistics. */
const PAYLOAD_RANGE = "150–600 kg";
const UPTIME = "24/7";

export default async function HomeHero({ locale }: HomeHeroProps) {
  const t = await getTranslations(locale);
  const { hero } = t.home;
  const heroProduct = getProduct("pudu-t300");
  const heroContent = await getProductContent(heroProduct, locale);
  const modelCount = 4;

  return (
    <header className="hero">
      <GridFloor />
      <div className="wrap hero-layout">
        <div>
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1>
            {hero.titleLine1}
            <span>{hero.titleLine2}</span>
          </h1>
          <p className="lead">{hero.description}</p>

          <div className="actions">
            <LinkButton href={homeSectionPath(locale, "products")}>
              {hero.exploreProducts}
            </LinkButton>
            <LinkButton href={homeSectionPath(locale, "contact")} variant="ghost">
              {hero.contactUs}
            </LinkButton>
          </div>

          <div className="microstats">
            <div>
              <b>
                <CountUp to={modelCount} />
              </b>
              <small>{hero.statModels}</small>
            </div>
            <div>
              <b>{PAYLOAD_RANGE}</b>
              <small>{hero.statPayload}</small>
            </div>
            <div>
              <b>{UPTIME}</b>
              <small>{hero.statUptime}</small>
            </div>
          </div>
        </div>

        <HologramPanel
          image={heroProduct.heroImage}
          alt={heroContent.imageAlt}
          statusLabel={hero.hudStatus}
          dataLabel={hero.hudRoute}
          priority
        />
      </div>
    </header>
  );
}
