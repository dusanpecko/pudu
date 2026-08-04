import type { Locale } from "@/lib/i18n";
import type { Translation } from "@/types/translation";

import { cz } from "./cz";
import { en } from "./en";
import { sk } from "./sk";

export const translations: Record<Locale, Translation> = { sk, cz, en };

export function getTranslations(locale: Locale): Translation {
  return translations[locale];
}

export { sk, cz, en };
