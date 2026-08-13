import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ContactSection from "@/components/contact/ContactSection";
import PhotoGallery from "@/components/gallery/PhotoGallery";
import FutureSection from "@/components/home/FutureSection";
import HomeHero from "@/components/home/HomeHero";
import ProductGrid from "@/components/home/ProductGrid";
import TechnologySection from "@/components/home/TechnologySection";
import TickerBand from "@/components/home/TickerBand";
import { HOME_GALLERY } from "@/lib/gallery";
import { isLocale, locales } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { getProduct } from "@/lib/products";
import { getProductContent, getTranslations } from "@/lib/translations";

type PageParams = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getTranslations(locale);
  const hero = getProduct("pudu-t300");
  const heroContent = await getProductContent(hero, locale);

  return buildPageMetadata({
    locale,
    route: { type: "home" },
    title: t.meta.homeTitle,
    description: t.meta.homeDescription,
    image: hero.socialImage ?? hero.heroImage,
    imageAlt: heroContent.imageAlt,
  });
}

export default async function HomePage({ params }: PageParams) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <HomeHero locale={locale} />
      <TickerBand locale={locale} />
      <ProductGrid locale={locale} />
      <TechnologySection locale={locale} />
      <FutureSection locale={locale} />
      <PhotoGallery locale={locale} gallery={HOME_GALLERY} />
      <ContactSection locale={locale} />
    </>
  );
}
