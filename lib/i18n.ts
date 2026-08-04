/**
 * Locale definitions shared by routing, metadata and content.
 *
 * `cz` is the URL segment the project asked for, while `cs` is the standard
 * language code used for `<html lang>` and `hreflang`.
 */
export const locales = ["sk", "cz", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sk";

/** Language tag used for `<html lang>` and `alternates.languages`. */
const htmlLangs: Record<Locale, string> = {
  sk: "sk",
  cz: "cs",
  en: "en",
};

/** Full BCP 47 tag used for Open Graph `locale`. */
const ogLocales: Record<Locale, string> = {
  sk: "sk_SK",
  cz: "cs_CZ",
  en: "en_GB",
};

/** Short label shown in the language switcher. */
export const localeLabels: Record<Locale, string> = {
  sk: "SK",
  cz: "CZ",
  en: "EN",
};

/** Accessible, human readable language name (in its own language). */
export const localeNames: Record<Locale, string> = {
  sk: "Slovenčina",
  cz: "Čeština",
  en: "English",
};

/** Decimal separator used when formatting technical values. */
export const decimalSeparators: Record<Locale, string> = {
  sk: ",",
  cz: ",",
  en: ".",
};

export function isLocale(value: string | undefined): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function htmlLang(locale: Locale): string {
  return htmlLangs[locale];
}

export function ogLocale(locale: Locale): string {
  return ogLocales[locale];
}
