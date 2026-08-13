import type { Locale } from "@/lib/i18n";

/**
 * The half of the company module a browser may see.
 *
 * lib/company.ts is `server-only` — it reaches the database with the secret key
 * — so the admin form cannot import from it, not even for a type: pulling it
 * into the client graph drags the admin Supabase client along and fails the
 * build. Everything both sides need lives here instead.
 */

/** A registration number, named by whatever the jurisdiction calls it. */
export type Identifier = {
  label: string;
  value: string;
};

/**
 * A social profile. `platform` decides which icon the footer draws; anything it
 * does not recognise is rendered as text, so a new network needs no code change.
 */
export type SocialLink = {
  platform: string;
  url: string;
};

export type CompanyDetails = {
  locale: Locale;
  companyName: string;
  /** Multi-line, so a foreign address keeps its own conventions. */
  address: string;
  email: string;
  phone: string;
  identifiers: Identifier[];
  social: SocialLink[];
  updatedAt: string | null;
  updatedBy: string | null;
};

/** Platforms the footer has an icon for. */
export const knownPlatforms = [
  "linkedin",
  "youtube",
  "facebook",
  "instagram",
  "x",
] as const;

export type KnownPlatform = (typeof knownPlatforms)[number];

export function isKnownPlatform(value: string): value is KnownPlatform {
  return (knownPlatforms as readonly string[]).includes(value);
}

/** Human-readable name, used as the link's accessible name. */
export const platformLabels: Record<KnownPlatform, string> = {
  linkedin: "LinkedIn",
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
};

export function platformLabel(platform: string): string {
  return isKnownPlatform(platform) ? platformLabels[platform] : platform;
}

export function emptyDetails(locale: Locale): CompanyDetails {
  return {
    locale,
    companyName: "",
    address: "",
    email: "",
    phone: "",
    identifiers: [],
    social: [],
    updatedAt: null,
    updatedBy: null,
  };
}

/** True when there is nothing worth rendering — the footer then omits the block. */
export function isEmpty(details: CompanyDetails): boolean {
  return (
    details.companyName.trim() === "" &&
    details.address.trim() === "" &&
    details.email.trim() === "" &&
    details.phone.trim() === "" &&
    details.identifiers.length === 0 &&
    details.social.length === 0
  );
}
