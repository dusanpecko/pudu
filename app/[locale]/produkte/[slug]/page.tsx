import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductPageTemplate from "@/components/product/ProductPageTemplate";
import type { Locale } from "@/lib/i18n";
import {
  buildProductMetadata,
  buildProductStaticParams,
  resolveProductRoute,
} from "@/lib/product-route";

/** German uses the `produkte` segment. */
const SEGMENT_LOCALES: readonly Locale[] = ["de"];

type PageParams = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return buildProductStaticParams(SEGMENT_LOCALES);
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolved = resolveProductRoute(locale, slug, SEGMENT_LOCALES);
  if (!resolved) return {};

  return buildProductMetadata(resolved.locale, resolved.product);
}

export default async function ProductPage({ params }: PageParams) {
  const { locale, slug } = await params;
  const resolved = resolveProductRoute(locale, slug, SEGMENT_LOCALES);
  if (!resolved) notFound();

  return <ProductPageTemplate product={resolved.product} locale={resolved.locale} />;
}
