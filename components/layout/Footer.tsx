import Link from "next/link";

import { products } from "@/data/products";
import type { Locale } from "@/lib/i18n";
import { homeSectionPath, localizedPath } from "@/lib/routes";
import { getProductTexts, getTranslations } from "@/lib/translations";

type FooterProps = {
  locale: Locale;
};

export default async function Footer({ locale }: FooterProps) {
  const t = await getTranslations(locale);
  const texts = await getProductTexts(locale);

  return (
    <footer className="footer">
      <div className="wrap">
        <nav aria-label={t.a11y.footerNavigation}>
          <ul className="footlinks">
            <li>
              <Link href={localizedPath(locale, { type: "home" })}>
                {t.navigation.home}
              </Link>
            </li>
            {products.map((product) => (
              <li key={product.slug}>
                <Link
                  href={localizedPath(locale, {
                    type: "product",
                    slug: product.slug,
                  })}
                >
                  {texts[product.slug].name}
                </Link>
              </li>
            ))}
            <li>
              <Link href={homeSectionPath(locale, "contact")}>
                {t.navigation.contact}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="footin">
          <span>{t.footer.copyright}</span>
          <span>{t.footer.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
