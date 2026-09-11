import type { Product } from "@/types/product";

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
  // Manufacturer's render with alpha, 16 kB. Same frame as the T600 renders,
  // so the fleet grid keeps one rhythm.
  mp2000: { src: "/images/products/pudu-mp2000.webp", width: 800, height: 960 },
  // PNG twin for Open Graph previews, for the same crawlers T300 needs one for.
  mp2000Social: { src: "/images/products/pudu-mp2000.png", width: 800, height: 960 },
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
    featured: true,
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

  // A different class of machine from the four above: a pallet-handling robot
  // with forks rather than a platform. Values are the manufacturer's for the
  // standard-fork model MPID01-M; the narrow-fork MPID01-N differs only in fork
  // width (550 mm against 620 mm), which the copy mentions rather than the
  // table, since a single width column would misstate one of the two.
  {
    slug: "pudu-mp2000",
    heroImage: IMAGES.mp2000,
    socialImage: IMAGES.mp2000Social,
    payload: "2000 kg",
    runtime: "12 h",
    // Right-angle stacking aisle for a 1200 × 1000 pallet — the figure that
    // decides whether the machine fits a warehouse, so it takes the aisle slot.
    clearance: "200 cm",
    // Shortened from "3D LiDAR SLAM + VSLAM": in the highlight strip it broke
    // onto three lines and made its cell taller than the other three.
    navigation: "3D LiDAR + VSLAM",
    specifications: [
      { key: "payload", value: { kind: "measure", amount: 2000, unit: "kg" } },
      { key: "runtimeEmpty", value: { kind: "measure", amount: 12, unit: "hours" } },
      { key: "runtimeLoaded", value: { kind: "measure", amount: 6, unit: "hours" } },
      { key: "lift", value: { kind: "measure", amount: 200, unit: "mm" } },
      { key: "clearance", value: { kind: "measure", amount: 200, unit: "cm" } },
      {
        // Unloaded. Loaded it is 1.2 m/s, which the features copy gives.
        key: "speed",
        value: { kind: "measure", amount: 1.6, unit: "mps", upTo: true },
      },
      {
        key: "dimensions",
        value: { kind: "dimensions", width: 1585, depth: 910, height: 1870 },
      },
      // The manufacturer states "about 2 h" with no charge percentage, so the
      // `charging` value kind — which renders "2 h to 90 %" — would invent one.
      { key: "charging", value: { kind: "text", text: "≈ 2 h" } },
    ],
  },
];
