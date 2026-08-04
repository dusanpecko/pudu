"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getTranslations } from "@/data/translations";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/routes";

/** Reads the language from the first path segment. */
export function localeFromPathname(pathname: string | null): Locale {
  const first = (pathname ?? "").split("/").filter(Boolean)[0];
  return isLocale(first) ? first : defaultLocale;
}

type NotFoundContentProps = {
  /** Fixed language; omitted inside `not-found.tsx`, which has no params. */
  locale?: Locale;
};

/**
 * `not-found.tsx` receives no route params, so the language is read from the
 * pathname — that keeps the 404 copy localized for `/cz/…` and `/en/…` URLs
 * while still returning a real 404 status.
 */
export default function NotFoundContent({ locale }: NotFoundContentProps) {
  const pathname = usePathname();
  const resolved = locale ?? localeFromPathname(pathname);
  const t = getTranslations(resolved);

  return (
    <div className="wrap">
      <p className="error-code">ERROR / 404</p>
      <h1>{t.notFound.title}</h1>
      <p>{t.notFound.description}</p>
      <Link className="btn primary" href={localizedPath(resolved, { type: "home" })}>
        {t.notFound.backHome}
      </Link>
    </div>
  );
}
