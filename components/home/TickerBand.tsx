import { getTranslations } from "@/data/translations";
import type { Locale } from "@/lib/i18n";

type TickerBandProps = {
  locale: Locale;
};

/**
 * Scrolling keyword marquee. The list is rendered twice so the CSS animation
 * loops seamlessly; the duplicated half is hidden from assistive technology.
 */
export default function TickerBand({ locale }: TickerBandProps) {
  const { ticker } = getTranslations(locale).home;
  const items = [...ticker, ...ticker];

  return (
    <div className="band">
      <div className="ticker">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            aria-hidden={index >= ticker.length ? "true" : undefined}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
