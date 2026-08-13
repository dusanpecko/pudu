"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import ThemeToggle from "@/components/layout/ThemeToggle";
import MobileNavigation from "@/components/layout/MobileNavigation";
import type { NavContent } from "@/components/layout/nav-content";
import type { Locale } from "@/lib/i18n";
import { localizedPath, parsePath } from "@/lib/routes";

type NavigationProps = {
  locale: Locale;
  content: NavContent;
};

/**
 * Panel state is stored together with the pathname it was opened on, so a
 * navigation implicitly closes every panel without an extra effect.
 */
type PanelState = {
  products: boolean;
  menu: boolean;
  path: string;
};

export default function Navigation({ locale, content }: NavigationProps) {
  const pathname = usePathname() ?? "";
  const [panels, setPanels] = useState<PanelState>({
    products: false,
    menu: false,
    path: pathname,
  });
  const groupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const dropdownId = useId();

  const onCurrentPath = panels.path === pathname;
  const productsOpen = onCurrentPath && panels.products;
  const menuOpen = onCurrentPath && panels.menu;

  const parsed = parsePath(pathname);
  const activeSlug = parsed?.route.type === "product" ? parsed.route.slug : null;
  const isHome = pathname === localizedPath(locale, { type: "home" });

  // The contact section exists on every page — stay on the current one.
  const contactHref = activeSlug
    ? `#${content.contactAnchor}`
    : content.contact.href;

  const setPanel = useCallback(
    (panel: "products" | "menu", open: boolean) => {
      setPanels({ products: false, menu: false, [panel]: open, path: pathname });
    },
    [pathname],
  );

  const closeProducts = useCallback(
    () => setPanel("products", false),
    [setPanel],
  );

  useEffect(() => {
    if (!productsOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!groupRef.current?.contains(event.target as Node)) closeProducts();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeProducts();
      triggerRef.current?.focus();
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!groupRef.current?.contains(event.target as Node)) closeProducts();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [productsOpen, closeProducts]);

  return (
    <>
      <header className="nav">
        <div className="wrap navin">
          <Link className="brand" href={content.home.href}>
            <span className="brandmark" aria-hidden="true" />
            {content.brand}
          </Link>

          <nav className="links" aria-label={content.labels.mainNavigation}>
            <Link
              href={content.home.href}
              aria-current={isHome ? "page" : undefined}
            >
              {content.home.label}
            </Link>

            <div className="navgroup" ref={groupRef}>
              <button
                type="button"
                className="navtrigger"
                ref={triggerRef}
                aria-expanded={productsOpen}
                aria-controls={dropdownId}
                onClick={() => setPanel("products", !productsOpen)}
              >
                {content.products.label}
                <span className="navcaret" aria-hidden="true" />
              </button>

              {productsOpen ? (
                <div
                  className="dropdown"
                  id={dropdownId}
                  role="group"
                  aria-label={content.labels.productsSubmenu}
                >
                  {content.products.items.map((item) => (
                    <Link
                      key={item.slug}
                      href={item.href}
                      aria-current={item.slug === activeSlug ? "page" : undefined}
                      onClick={closeProducts}
                    >
                      {item.name}
                      <small>{item.category}</small>
                    </Link>
                  ))}
                  <Link
                    className="dropdown-all"
                    href={content.products.allHref}
                    onClick={closeProducts}
                  >
                    {content.products.allLabel}
                  </Link>
                </div>
              ) : null}
            </div>

            <Link href={content.technology.href}>{content.technology.label}</Link>
            <Link href={content.solutions.href}>{content.solutions.label}</Link>
            <Link href={contactHref}>{content.contact.label}</Link>

            <ThemeToggle label={content.labels.themeToggle} />

            <LanguageSwitcher
              locale={locale}
              groupLabel={content.labels.languageSwitcher}
              currentLabel={content.labels.currentLanguage}
              switchLabel={content.labels.switchTo}
            />
          </nav>

          <Link className="navcta" href={contactHref}>
            {content.cta.label}
          </Link>

          <button
            type="button"
            className="menu"
            ref={menuToggleRef}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? content.labels.closeMenu : content.labels.openMenu}
            onClick={() => setPanel("menu", !menuOpen)}
          >
            <span className="menu-bars" aria-hidden="true" />
          </button>
        </div>
      </header>

      {menuOpen ? (
        <MobileNavigation
          locale={locale}
          content={content}
          contactHref={contactHref}
          activeSlug={activeSlug}
          isHome={isHome}
          onClose={() => setPanel("menu", false)}
          toggleRef={menuToggleRef}
        />
      ) : null}
    </>
  );
}
