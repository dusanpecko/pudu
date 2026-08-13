import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import Umami from "@/components/analytics/Umami";
import CursorGlow from "@/components/effects/CursorGlow";
import NoiseOverlay from "@/components/effects/NoiseOverlay";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import { buildNavContent } from "@/components/layout/nav-content";
import ThemeScript from "@/components/layout/ThemeScript";
import { fontVariables } from "@/lib/fonts";
import { htmlLang, isLocale, locales } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import { getTranslations } from "@/lib/translations";

import "@/app/globals.css";

export const viewport: Viewport = {
  // The browser chrome cannot follow the toggle — it is resolved before any
  // script runs — so it follows the system preference instead, which is what an
  // untouched toggle does too.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1fc" },
    { media: "(prefers-color-scheme: dark)", color: "#06090b" },
  ],
  // Both, so form controls and scrollbars adapt with the palette.
  colorScheme: "light dark",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LayoutParams = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LayoutParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getTranslations(locale);

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

  const t = await getTranslations(locale);
  const navContent = await buildNavContent(locale);

  return (
    // `data-scroll-behavior` lets the router turn off the smooth scrolling from
    // globals.css during route changes, so a new page opens at the top instead
    // of animating down from the previous scroll position.
    <html
      lang={htmlLang(locale)}
      className={fontVariables}
      data-scroll-behavior="smooth"
      /* The starting point, and what a visitor without JavaScript keeps.
         ThemeScript replaces it before the first paint with the stored choice or
         the system preference. */
      data-theme="light"
    >
      <head>
        <ThemeScript />
      </head>
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
        <Umami />
      </body>
    </html>
  );
}
