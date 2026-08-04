import { Inter, Space_Grotesk } from "next/font/google";

/**
 * Self-hosted through next/font — the original site loaded these from the
 * Google Fonts CDN.
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const fontVariables = `${inter.variable} ${spaceGrotesk.variable}`;
