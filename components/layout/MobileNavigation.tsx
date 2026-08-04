"use client";

import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";

import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import type { NavContent } from "@/components/layout/nav-content";
import type { Locale } from "@/lib/i18n";
import type { ProductSlug } from "@/types/product";

type MobileNavigationProps = {
  locale: Locale;
  content: NavContent;
  contactHref: string;
  activeSlug: ProductSlug | null;
  isHome: boolean;
  onClose: () => void;
  /** Focus goes back here once the menu closes. */
  toggleRef: RefObject<HTMLButtonElement | null>;
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full screen menu for narrow viewports. Closes on Escape, traps focus while
 * open, locks page scrolling and restores focus to the toggle afterwards.
 */
export default function MobileNavigation({
  locale,
  content,
  contactHref,
  activeSlug,
  isHome,
  onClose,
  toggleRef,
}: MobileNavigationProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const toggle = toggleRef.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // Growing past the breakpoint brings the desktop navigation back.
    const desktop = window.matchMedia("(min-width: 951px)");
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
      document.body.style.overflow = overflow;
      toggle?.focus();
    };
  }, [onClose, toggleRef]);

  return (
    <div
      className="mobilenav"
      id="mobile-navigation"
      role="dialog"
      aria-modal="true"
      aria-label={content.labels.mainNavigation}
      ref={panelRef}
    >
      <div className="wrap mobilenav-head">
        <Link className="brand" href={content.home.href} onClick={onClose}>
          <span className="brandmark" aria-hidden="true" />
          {content.brand}
        </Link>
        <button
          type="button"
          className="mobilenav-close"
          aria-label={content.labels.closeMenu}
          onClick={onClose}
          ref={closeRef}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <nav className="wrap" aria-label={content.labels.mainNavigation}>
        <ul className="mobilenav-list">
          <li>
            <Link
              href={content.home.href}
              aria-current={isHome ? "page" : undefined}
              onClick={onClose}
            >
              {content.home.label}
            </Link>
          </li>
          <li>
            <Link href={content.products.allHref} onClick={onClose}>
              {content.products.label}
            </Link>
            <ul className="mobilenav-sub" aria-label={content.labels.productsSubmenu}>
              {content.products.items.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={item.href}
                    aria-current={item.slug === activeSlug ? "page" : undefined}
                    onClick={onClose}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <Link href={content.technology.href} onClick={onClose}>
              {content.technology.label}
            </Link>
          </li>
          <li>
            <Link href={content.solutions.href} onClick={onClose}>
              {content.solutions.label}
            </Link>
          </li>
          <li>
            <Link href={contactHref} onClick={onClose}>
              {content.contact.label}
            </Link>
          </li>
        </ul>
      </nav>

      <div className="wrap mobilenav-foot">
        <span className="mobilenav-langlabel">{content.labels.language}</span>
        <LanguageSwitcher
          locale={locale}
          groupLabel={content.labels.languageSwitcher}
          currentLabel={content.labels.currentLanguage}
          switchLabel={content.labels.switchTo}
        />
        <Link className="btn primary" href={contactHref} onClick={onClose}>
          {content.cta.label}
        </Link>
      </div>
    </div>
  );
}
