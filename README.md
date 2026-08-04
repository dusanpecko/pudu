# PUDU Industrial — multilingual Next.js site

Trilingual (SK / CZ / EN) presentation of the PUDU autonomous mobile robot
fleet. Converted from the original static HTML prototype (kept in
[legacy/](legacy/)) with the design, animations and layout preserved.

All content lives in TypeScript files — no database, no CMS, no Supabase.

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
npm run build      # production build, statically prerenders all 15 pages
npm start
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## URLs

| Page | SK | CZ | EN |
| --- | --- | --- | --- |
| Home | `/sk` | `/cz` | `/en` |
| Product | `/sk/produkty/[slug]` | `/cz/produkty/[slug]` | `/en/products/[slug]` |

Slugs: `pudu-t150`, `pudu-t300`, `pudu-t600-upright`, `pudu-t600-underride`.

`/` redirects to `/sk` (configured in [next.config.ts](next.config.ts)); the
browser language is never used to switch automatically. English uses the
`products` segment, Slovak and Czech use `produkty` —
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
│   ├── [...rest]/            unknown paths inside a language → localized 404
│   └── not-found.tsx
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
└── ui/        Button, SectionHeading, ProductCard
data/
├── products.ts               technical data + per-language product content
└── translations/{sk,cz,en}.ts
lib/            i18n, routes, products, metadata, fonts, motion, site
types/          product.ts, translation.ts
```

## Content and translations

- [data/translations/sk.ts](data/translations/sk.ts) is the reference shape;
  `Translation` in [types/translation.ts](types/translation.ts) is derived from
  it, so `cz.ts` and `en.ts` fail to compile if a key is missing or extra.
- Product data is language neutral (payload, runtime, dimensions, images).
  Numbers stay numbers and are formatted per language — decimal comma for
  SK/CZ, decimal point for EN — with units and labels coming from the
  translations (`formatSpecValue` in [lib/products.ts](lib/products.ts)).
- Product names (`PUDU T150`, …) are never translated.

## SEO

Every page provides a localized `title` and `description`, Open Graph and
Twitter tags, a canonical URL and `alternates.languages` for all three
languages. The `/cz` URL prefix maps to the standard `cs` code in `hreflang`
and `<html lang>`. `sitemap.xml` lists all 15 URLs with their alternates.

Set `NEXT_PUBLIC_SITE_URL` (see [.env.example](.env.example)) so canonical and
Open Graph URLs point at the real domain.

## Animations and accessibility

The original `assets/app.js` was rewritten as React components: `Reveal`
(IntersectionObserver), `CountUp`, `HologramPanel` (pointer tilt via
`requestAnimationFrame`) and `CursorGlow`. Every listener and animation frame
is released on unmount. `prefers-reduced-motion` disables motion, a `<noscript>`
rule keeps revealed content visible without JavaScript, and the mobile menu
supports keyboard operation (`aria-expanded`, focus trap, Escape, focus
restore). Verified from 320 px to 1920 px with no horizontal scrolling.
