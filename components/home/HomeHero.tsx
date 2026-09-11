import CountUp from "@/components/effects/CountUp";
import GridFloor from "@/components/effects/GridFloor";
import HologramPanel from "@/components/effects/HologramPanel";
import { LinkButton } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";
import { products } from "@/data/products";
import { HOME_GALLERY, resolveHeroImage } from "@/lib/gallery";
import { getProduct } from "@/lib/products";
import { homeSectionPath } from "@/lib/routes";
import { getProductContent, getTranslations } from "@/lib/translations";
import type { Translation } from "@/types/translation";

type HomeHeroProps = {
  locale: Locale;
};

const UPTIME = "24/7";

/**
 * Payload range across the fleet, read from the same table the product pages
 * render. It used to be the literal "150–600 kg" beside a literal model count of
 * four, and both went quietly stale the day a fifth product was added — which is
 * the one day anybody edits this file.
 */
function payloadRange({ units }: Translation): string {
  const payloads = products.flatMap((product) =>
    product.specifications.flatMap((entry) =>
      entry.key === "payload" && entry.value.kind === "measure"
        ? [entry.value.amount]
        : [],
    ),
  );
  return `${Math.min(...payloads)}–${Math.max(...payloads)} ${units.kg}`;
}

export default async function HomeHero({ locale }: HomeHeroProps) {
  const t = await getTranslations(locale);
  const { hero } = t.home;
  const heroProduct = getProduct("pudu-t300");
  const heroContent = await getProductContent(heroProduct, locale);
  // The home hero has a slot of its own, so the picture no longer has to be
  // whichever product happens to be featured.
  const heroImage = await resolveHeroImage(HOME_GALLERY, heroProduct.heroImage);
  const modelCount = products.length;

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
              <b>{payloadRange(t)}</b>
              <small>{hero.statPayload}</small>
            </div>
            <div>
              <b>{UPTIME}</b>
              <small>{hero.statUptime}</small>
            </div>
          </div>
        </div>

        <HologramPanel
          image={heroImage}
          alt={heroContent.imageAlt}
          statusLabel={hero.hudStatus}
          dataLabel={hero.hudRoute}
          priority
        />
      </div>
    </header>
  );
}
