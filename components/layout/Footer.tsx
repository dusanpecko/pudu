import Link from "next/link";

import SocialIcon from "@/components/layout/SocialIcon";
import { products } from "@/data/products";
import { isEmpty, loadCompanyDetails, platformLabel } from "@/lib/company";
import type { Locale } from "@/lib/i18n";
import { homeSectionPath, localizedPath } from "@/lib/routes";
import { getProductTexts, getTranslations } from "@/lib/translations";

type FooterProps = {
  locale: Locale;
};

/**
 * Two companies stand behind this site and each market names its own, so the
 * contact block comes from the database per language (/admin/contacts) rather
 * than from the translation files.
 *
 * A language with nothing stored renders the footer as it was before the details
 * existed — links, copyright and tagline — so an empty table costs nothing.
 */
export default async function Footer({ locale }: FooterProps) {
  const t = await getTranslations(locale);
  const texts = await getProductTexts(locale);
  const company = await loadCompanyDetails(locale);
  const hasCompany = !isEmpty(company);

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

        {hasCompany ? (
          <div className="footcompany">
            <div className="footblock">
              {company.companyName ? <strong>{company.companyName}</strong> : null}
              {company.address ? (
                // The editor writes the address as lines, and a foreign address
                // does not always fit a Slovak field order.
                <address>
                  {company.address.split("\n").map((line, index) => (
                    <span key={index}>{line}</span>
                  ))}
                </address>
              ) : null}
            </div>

            {company.email || company.phone ? (
              <div className="footblock">
                {company.email ? (
                  <a href={`mailto:${company.email}`}>{company.email}</a>
                ) : null}
                {company.phone ? (
                  // Strips the spaces a printed number carries, which a dialler
                  // would otherwise choke on.
                  <a href={`tel:${company.phone.replace(/[^\d+]/g, "")}`}>
                    {company.phone}
                  </a>
                ) : null}
              </div>
            ) : null}

            {company.identifiers.length > 0 ? (
              <div className="footblock">
                <ul className="footids">
                  {company.identifiers.map((entry) => (
                    <li key={`${entry.label}-${entry.value}`}>
                      <span>{entry.label}</span> {entry.value}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {company.social.length > 0 ? (
              <nav className="footsocial" aria-label={t.a11y.socialLinks}>
                {company.social.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    // An outbound link opened in a new tab must not hand the
                    // target a handle on this window.
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platformLabel(link.platform)}
                  >
                    <SocialIcon platform={link.platform} />
                  </a>
                ))}
              </nav>
            ) : null}
          </div>
        ) : null}

        <div className="footin">
          <span>{t.footer.copyright}</span>
          <span>{t.footer.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
