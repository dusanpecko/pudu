"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { locales, localeLabels, localeNames, type Locale } from "@/lib/i18n";
import { localizedPath, parsePath } from "@/lib/routes";

type LanguageSwitcherProps = {
  locale: Locale;
  groupLabel: string;
  currentLabel: string;
  switchLabel: string;
};

/**
 * SK / CZ / EN switch that keeps the visitor on the current page — a product
 * page maps to the same product in the target language, including the
 * localized `produkty` / `products` segment.
 */
export default function LanguageSwitcher({
  locale,
  groupLabel,
  currentLabel,
  switchLabel,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const parsed = parsePath(pathname ?? "");
  const route = parsed?.route ?? { type: "home" as const };

  return (
    <nav className="langs" aria-label={groupLabel}>
      {locales.map((target) => {
        const isCurrent = target === locale;

        return (
          <Link
            key={target}
            href={localizedPath(target, route)}
            hrefLang={target === "cz" ? "cs" : target}
            aria-current={isCurrent ? "true" : undefined}
            aria-label={`${isCurrent ? currentLabel : switchLabel}: ${localeNames[target]}`}
          >
            {localeLabels[target]}
          </Link>
        );
      })}
    </nav>
  );
}
