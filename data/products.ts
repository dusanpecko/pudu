import type { Product, ProductSlug } from "@/types/product";

const IMAGES = {
  t150: {
    src: "/images/products/pudu-t150.webp",
    width: 2560,
    height: 1280,
    hasBackdrop: true,
  },
  // Blueprint render with alpha, 24 kB — 20x lighter than the PNG twin.
  t300: { src: "/images/products/pudu-t300.webp", width: 1024, height: 1024 },
  // Same render as a PNG, kept only for Open Graph previews.
  t300Social: { src: "/images/products/pudu-t300.png", width: 1024, height: 1024 },
  t300Safety: {
    src: "/images/products/pudu-t300-safety.webp",
    width: 2400,
    height: 1350,
  },
  t600Upright: {
    src: "/images/products/pudu-t600-upright.png",
    width: 600,
    height: 720,
  },
  t600Underride: {
    src: "/images/products/pudu-t600-underride.png",
    width: 800,
    height: 960,
  },
} as const;

/**
 * Canonical order of the fleet — drives navigation, static params and the
 * previous/next links on product pages.
 */
export const products: Product[] = [
  {
    slug: "pudu-t150",
    heroImage: IMAGES.t150,
    payload: "150 kg",
    runtime: "12 h",
    clearance: "60 cm",
    navigation: "VSLAM + LiDAR",
    charging: "2 h / 90 %",
    specifications: [
      { key: "payload", value: { kind: "measure", amount: 150, unit: "kg" } },
      { key: "runtimeEmpty", value: { kind: "measure", amount: 12, unit: "hours" } },
      { key: "clearance", value: { kind: "measure", amount: 60, unit: "cm" } },
      {
        key: "speed",
        value: { kind: "measure", amount: 1.2, unit: "mps", upTo: true },
      },
      {
        key: "dimensions",
        value: { kind: "dimensions", width: 835, depth: 500, height: 1350 },
      },
      { key: "charging", value: { kind: "charging", hours: 2, percent: 90 } },
    ],
  },

  {
    slug: "pudu-t300",
    heroImage: IMAGES.t300,
    socialImage: IMAGES.t300Social,
    galleryImages: [IMAGES.t300Safety],
    payload: "300 kg",
    runtime: "12 h",
    clearance: "60 cm",
    navigation: "VSLAM + LiDAR",
    charging: "2 h / 90 %",
    specifications: [
      { key: "payload", value: { kind: "measure", amount: 300, unit: "kg" } },
      { key: "runtimeEmpty", value: { kind: "measure", amount: 12, unit: "hours" } },
      { key: "runtimeLoaded", value: { kind: "measure", amount: 8, unit: "hours" } },
      {
        key: "speed",
        value: { kind: "measure", amount: 1.2, unit: "mps", upTo: true },
      },
      {
        key: "dimensions",
        value: { kind: "dimensions", width: 835, depth: 500, height: 1350 },
      },
      { key: "charging", value: { kind: "charging", hours: 2, percent: 90 } },
    ],
  },

  {
    slug: "pudu-t600-upright",
    heroImage: IMAGES.t600Upright,
    payload: "600 kg",
    runtime: "12 h",
    clearance: "70 cm",
    navigation: "VSLAM + LiDAR",
    specifications: [
      { key: "payload", value: { kind: "measure", amount: 600, unit: "kg" } },
      { key: "runtime", value: { kind: "measure", amount: 12, unit: "hours" } },
      { key: "clearance", value: { kind: "measure", amount: 70, unit: "cm" } },
      {
        key: "speed",
        value: { kind: "measure", amount: 1.2, unit: "mps", upTo: true },
      },
      {
        key: "dimensions",
        value: { kind: "dimensions", width: 960, depth: 500, height: 1350 },
      },
      { key: "lift", value: { kind: "measure", amount: 60, unit: "mm" } },
    ],
  },

  {
    slug: "pudu-t600-underride",
    heroImage: IMAGES.t600Underride,
    payload: "600 kg",
    runtime: "12 h",
    clearance: "65 cm",
    navigation: "LiDAR SLAM",
    specifications: [
      { key: "payload", value: { kind: "measure", amount: 600, unit: "kg" } },
      { key: "runtime", value: { kind: "measure", amount: 12, unit: "hours" } },
      { key: "clearance", value: { kind: "measure", amount: 65, unit: "cm" } },
      {
        key: "speed",
        value: { kind: "measure", amount: 1.2, unit: "mps", upTo: true },
      },
      {
        key: "dimensions",
        value: { kind: "dimensions", width: 845, depth: 500, height: 255 },
      },
      { key: "lift", value: { kind: "measure", amount: 60, unit: "mm" } },
    ],
  },
];

/** Order used by the product grid on the home page (as in the original design). */
export const homeProductOrder: ProductSlug[] = [
  "pudu-t300",
  "pudu-t150",
  "pudu-t600-upright",
  "pudu-t600-underride",
];
