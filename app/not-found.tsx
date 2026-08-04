import Link from "next/link";

import NoiseOverlay from "@/components/effects/NoiseOverlay";
import NotFoundContent from "@/components/layout/NotFoundContent";
import { getTranslations } from "@/data/translations";
import { fontVariables } from "@/lib/fonts";
import { defaultLocale, htmlLang } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";

import "@/app/globals.css";

/**
 * Global 404 for paths without a language prefix (for example `/unknown`).
 * Unknown paths *inside* a language are handled by `[locale]/[...rest]`, so
 * they keep their own layout and language; here the default language applies.
 *
 * Every real page lives inside the locale layout, which is why this file has to
 * provide its own document shell.
 */
export default function GlobalNotFound() {
  const t = getTranslations(defaultLocale);
  const home = localizedPath(defaultLocale, { type: "home" });

  return (
    <html
      lang={htmlLang(defaultLocale)}
      className={fontVariables}
      data-scroll-behavior="smooth"
    >
      <body>
        <header className="nav">
          <div className="wrap navin">
            <Link className="brand" href={home}>
              <span className="brandmark" aria-hidden="true" />
              PUDU INDUSTRIAL
            </Link>
            <Link className="navcta" href={home}>
              {t.notFound.backHome}
            </Link>
          </div>
        </header>

        <main className="error-page">
          <div className="gridfloor" aria-hidden="true" />
          <NotFoundContent locale={defaultLocale} />
        </main>

        <NoiseOverlay />
      </body>
    </html>
  );
}
