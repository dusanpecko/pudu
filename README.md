# PUDU Industrial — multilingual Next.js site

Multilingual (SK / CZ / EN / DE) presentation of the PUDU autonomous mobile robot
fleet. Converted from the original static HTML prototype (kept in
[legacy/](legacy/)) with the design, animations and layout preserved.

All content lives in TypeScript files — the public site has no database and no
CMS behind it. Supabase is used only to sign in to the editing tools at
`/admin`; the site itself never talks to it.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19
- TypeScript (strict)
- Tailwind CSS 4 (design tokens via `@theme`) + ported component CSS
- `next/font` (Inter, Space Grotesk — self-hosted at build time)
- `next/image` for every image
- CSS animations + React hooks (no animation library)

## Commands

```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /sk
npm run build      # production build, statically prerenders all 20 content pages
npm start
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## URLs

| Page | SK | CZ | EN | DE |
| --- | --- | --- | --- | --- |
| Home | `/sk` | `/cz` | `/en` | `/de` |
| Product | `/sk/produkty/…` | `/cz/produkty/…` | `/en/products/…` | `/de/produkte/…` |

Slugs: `pudu-t150`, `pudu-t300`, `pudu-t600-upright`, `pudu-t600-underride`.

`/` redirects to `/sk` (configured in [next.config.ts](next.config.ts)); the
browser language is never used to switch automatically. Each market uses its own
path segment — `produkty`, `products`, `produkte` —
[lib/routes.ts](lib/routes.ts) builds every internal link from a locale plus a
`Route`, so a link can never lose its language prefix.

## Structure

```
app/
├── [locale]/                 root layout (<html lang>), locale validation
│   ├── layout.tsx            navigation, main, footer, global effects
│   ├── page.tsx              home page
│   ├── produkty/[slug]/      SK + CZ product pages
│   ├── products/[slug]/      EN product pages
│   ├── produkte/[slug]/      DE product pages
│   ├── [...rest]/            unknown paths inside a language → localized 404
│   └── not-found.tsx
├── admin/                    editing tools, behind a Supabase sign-in
├── not-found.tsx             404 for paths without a language prefix
├── globals.css               design tokens + ported component CSS
├── robots.ts, sitemap.ts
components/
├── layout/    Navigation, MobileNavigation, LanguageSwitcher, Footer
├── home/      HomeHero, TickerBand, ProductGrid, TechnologySection, FutureSection
├── product/   ProductHero, ProductSpecs, ProductStory, ProductModes,
│              ProductGallery, ProductFeatures, ProductApplications,
│              ProductNavigation, ProductPageTemplate
├── effects/   HologramPanel, RadarAnimation, ScanLines, GridFloor, CursorGlow,
│              NoiseOverlay, Reveal, CountUp
├── contact/   ContactSection, ContactForm
├── ui/        Button, SectionHeading, ProductCard
└── admin/     TranslationsManager, LoginForm
data/
├── products.ts                        language neutral product data
├── products/translations/{sk,cz,en,de}.ts   product copy
└── translations/{sk,cz,en,de}.ts            interface copy
lib/            i18n, routes, products, metadata, fonts, motion, site,
                translation-source, supabase/
middleware.ts   session gate, scoped to /admin
types/          product.ts, translation.ts
```

## Content and translations

- [data/translations/sk.ts](data/translations/sk.ts) is the reference shape;
  `Translation` in [types/translation.ts](types/translation.ts) is derived from
  it, so the other languages fail to compile if a key is missing or extra.
- Adding a language means: add it to `locales` in [lib/i18n.ts](lib/i18n.ts) —
  the compiler then lists every place that needs a value, including the routing
  segment, both translation files and the canonical origin.
- Product data is language neutral (payload, runtime, dimensions, images).
  Numbers stay numbers and are formatted per language — decimal comma for
  SK/CZ/DE, decimal point for EN — with units and labels coming from the
  translations (`formatSpecValue` in [lib/products.ts](lib/products.ts)).
- Product names (`PUDU T150`, …) are never translated.

## SEO

Every page provides a localized `title` and `description`, Open Graph and
Twitter tags, an absolute canonical URL and `alternates.languages` for every
language. The `/cz` URL prefix maps to the standard `cs` code in `hreflang` and
`<html lang>`. `sitemap.xml` lists all 20 URLs with their alternates.

## Domains and deployment (Vercel)

One project serves both domains, and each language declares a single canonical
host, so the two domains never compete as duplicate content:

| Language | Canonical origin |
| --- | --- |
| Slovak (`/sk`) | `https://pududotoho.sk` |
| Czech (`/cz`) | `https://pududotoho.cz` |
| English (`/en`) | `https://pududotoho.sk` |
| German (`/de`) | `https://pududotoho.sk` — set `NEXT_PUBLIC_SITE_URL_DE` to move it |

The mapping lives in [lib/site.ts](lib/site.ts) and drives canonical URLs,
`hreflang` alternates, `og:url`, Open Graph images, `sitemap.xml` and
`robots.txt`. Environment variables (see [.env.example](.env.example)), both
read at build time — changing them needs a redeploy:

- `NEXT_PUBLIC_SITE_URL` — primary origin (Slovak, English, `robots.txt`).
  Falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then `http://localhost:3000`.
- `NEXT_PUBLIC_SITE_URL_CZ`, `NEXT_PUBLIC_SITE_URL_DE` — per-market origins.
  Set them **only in production**; unset, every language stays on the primary
  host, which is what local development and preview deployments need.

Add both domains to the same Vercel project (neither one redirecting). Because
the shared `sitemap.xml` contains URLs for both hosts, verify both domains in
Search Console and submit the sitemap for each — `robots.txt` already advertises
both sitemap URLs.

## Editing the content

`/admin/translations-manager` shows every translated string with one column per
language, and regenerates the data files from what you type. It never parses the
source, so an edit cannot silently fail to apply; regenerating an unchanged file
reproduces it byte for byte, which keeps the diff limited to what you actually
changed. The serializer lives in
[lib/translation-source.ts](lib/translation-source.ts).

Access needs a Supabase account **and** an e-mail listed in `ADMIN_EMAILS`. The
allowlist is a server-only variable, checked in
[middleware.ts](middleware.ts) and again in the page — a session alone is not
enough, because a project with sign-ups enabled would otherwise let anybody in.
An empty list denies everyone. Accounts are created in the Supabase dashboard;
there is no sign-up form.

## Animations and accessibility

The original `assets/app.js` was rewritten as React components: `Reveal`
(IntersectionObserver), `CountUp`, `HologramPanel` (pointer tilt via
`requestAnimationFrame`) and `CursorGlow`. Every listener and animation frame
is released on unmount. `prefers-reduced-motion` disables motion, a `<noscript>`
rule keeps revealed content visible without JavaScript, and the mobile menu
supports keyboard operation (`aria-expanded`, focus trap, Escape, focus
restore). Verified from 320 px to 1920 px with no horizontal scrolling.
