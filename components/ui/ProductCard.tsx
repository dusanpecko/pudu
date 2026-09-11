import Image from "next/image";
import Link from "next/link";

import { cx } from "@/lib/cx";
import type { Locale } from "@/lib/i18n";
import { resolveHeroImage } from "@/lib/gallery";
import { localizedPath } from "@/lib/routes";
import { getProductContent } from "@/lib/translations";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  locale: Locale;
  payloadLabel: string;
  runtimeLabel: string;
  /** Label for the recommended model; the badge is skipped without it. */
  featuredLabel?: string;
};

/** Product tile, one snap point in the fleet row on the home page. */
export default async function ProductCard({
  product,
  locale,
  payloadLabel,
  runtimeLabel,
  featuredLabel,
}: ProductCardProps) {
  const content = await getProductContent(product, locale);
  const image = await resolveHeroImage(product.slug, product.heroImage);
  const featured = Boolean(product.featured && featuredLabel);

  return (
    // A plain article: the row it sits in is revealed as a whole by the strip,
    // and each tile is a snap point.
    <article className={cx("card-shell", "fleet-item", featured && "is-featured")}>
      <Link
        className={cx("product-card", featured && "featured")}
        href={localizedPath(locale, { type: "product", slug: product.slug })}
      >
        <span className="tag">{content.category}</span>
        <span className="shot">
          {featured ? <span className="badge">{featuredLabel}</span> : null}
          <Image
            className={image.hasBackdrop ? "blend-backdrop" : undefined}
            src={image.src}
            alt={content.imageAlt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 620px) 86vw, (max-width: 950px) 46vw, 380px"
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
    </article>
  );
}
