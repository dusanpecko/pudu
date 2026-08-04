import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import CursorGlow from "@/components/effects/CursorGlow";
import NoiseOverlay from "@/components/effects/NoiseOverlay";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import { buildNavContent } from "@/components/layout/nav-content";
import { getTranslations } from "@/data/translations";
import { fontVariables } from "@/lib/fonts";
import { htmlLang, isLocale, locales } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

import "@/app/globals.css";

export const viewport: Viewport = {
  themeColor: "#06090b",
  colorScheme: "dark",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LayoutParams = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LayoutParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = getTranslations(locale);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t.meta.homeTitle,
      // Page titles are already complete — no suffix is appended.
      template: "%s",
    },
    description: t.meta.homeDescription,
    applicationName: t.meta.siteName,
    keywords: t.meta.keywordsLabel.split(", "),
  };
}

/**
 * Root layout — every route lives under `/[locale]`, which lets `<html lang>`
 * follow the current language.
 */
export default async function LocaleLayout({
  children,
  params,
}: LayoutParams & { children: ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = getTranslations(locale);
  const navContent = buildNavContent(locale);

  return (
    // `data-scroll-behavior` lets the router turn off the smooth scrolling from
    // globals.css during route changes, so a new page opens at the top instead
    // of animating down from the previous scroll position.
    <html
      lang={htmlLang(locale)}
      className={fontVariables}
      data-scroll-behavior="smooth"
    >
      <body>
        <noscript>
          {/* Scroll animations never run without JavaScript — show everything. */}
          <style>{".reveal{opacity:1 !important;transform:none !important}"}</style>
        </noscript>

        <a className="skiplink" href="#content">
          {t.a11y.skipToContent}
        </a>

        <CursorGlow />
        <Navigation locale={locale} content={navContent} />

        <main id="content">{children}</main>

        <Footer locale={locale} />
        <NoiseOverlay />
      </body>
    </html>
  );
}
