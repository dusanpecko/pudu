import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/effects/Reveal";
import type { Locale } from "@/lib/i18n";
import { getProductContent } from "@/lib/products";
import { localizedPath } from "@/lib/routes";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  locale: Locale;
  payloadLabel: string;
  runtimeLabel: string;
};

/** Product tile used in the fleet grid on the home page. */
export default function ProductCard({
  product,
  locale,
  payloadLabel,
  runtimeLabel,
}: ProductCardProps) {
  const content = getProductContent(product, locale);

  return (
    <Reveal as="article" className="card-shell">
      <Link
        className="product-card"
        href={localizedPath(locale, { type: "product", slug: product.slug })}
      >
        <span className="tag">{content.category}</span>
        <span className="shot">
          <Image
            className={product.heroImage.hasBackdrop ? "blend-backdrop" : undefined}
            src={product.heroImage.src}
            alt={content.imageAlt}
            width={product.heroImage.width}
            height={product.heroImage.height}
            sizes="(max-width: 620px) 88vw, (max-width: 950px) 44vw, 300px"
          />
        </span>
        <h3>{content.name}</h3>
        <p>{content.shortDescription}</p>
        <span className="meta">
          <span>
            {payloadLabel} {product.payload}
          </span>
          <span>
            {runtimeLabel} {product.runtime}
          </span>
        </span>
        <span className="arrow" aria-hidden="true">
          ↗
        </span>
      </Link>
    </Reveal>
  );
}
