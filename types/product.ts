export type ProductSlug =
  | "pudu-t150"
  | "pudu-t300"
  | "pudu-t600-upright"
  | "pudu-t600-underride";

/** Keys of technical parameters — the label itself lives in the translations. */
export type SpecKey =
  | "payload"
  | "runtime"
  | "runtimeEmpty"
  | "runtimeLoaded"
  | "clearance"
  | "speed"
  | "dimensions"
  | "charging"
  | "lift"
  | "navigation";

/** Units of technical parameters — the label itself lives in the translations. */
export type UnitKey = "kg" | "hours" | "hoursShort" | "cm" | "mm" | "mps" | "percent";

/**
 * Language independent technical value. Numbers stay numbers so that the
 * decimal separator and the unit can be rendered per language.
 */
export type SpecValue =
  | { kind: "text"; text: string }
  | { kind: "measure"; amount: number; unit: UnitKey; upTo?: boolean }
  | { kind: "dimensions"; width: number; depth: number; height: number }
  | { kind: "charging"; hours: number; percent: number };

export type SpecEntry = {
  key: SpecKey;
  value: SpecValue;
};

export type ProductImage = {
  src: string;
  width: number;
  height: number;
  /**
   * The render has a dark studio backdrop instead of transparency. Floating
   * placements blend it into the page so no rectangle is visible.
   */
  hasBackdrop?: boolean;
};

export type LocalizedProductContent = {
  name: string;
  category: string;
  headline: string;
  description: string;
  shortDescription: string;
  features: {
    title: string;
    description: string;
  }[];
  applications: {
    title: string;
    description: string;
  }[];
  imageAlt: string;
  galleryAlt?: string;
  seoTitle: string;
  seoDescription: string;
};

export type Product = {
  slug: ProductSlug;
  heroImage: ProductImage;
  /**
   * Open Graph image. Only needed when `heroImage` is a WebP and a PNG or JPEG
   * twin exists — some crawlers (LinkedIn in particular) skip WebP previews.
   */
  socialImage?: ProductImage;
  galleryImages?: ProductImage[];
  /** Language neutral headline values, reused in cards and hero HUD. */
  payload: string;
  runtime: string;
  clearance: string;
  navigation: string;
  charging?: string;
  /** Full parameter table; labels and units are localized at render time. */
  specifications: SpecEntry[];
  /** Highlighted in the fleet grid as the recommended model. */
  featured?: boolean;
};
