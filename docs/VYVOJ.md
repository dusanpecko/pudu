# Dokumentácia pre vývojára

Pre človeka, ktorý preberá kód. Čo je web zač a čo dokáže, hovorí
[SPECIFIKACIA.md](SPECIFIKACIA.md); ako sa obsluhuje administrácia,
[NAVOD-ADMIN.md](NAVOD-ADMIN.md); aktuálny stav nálezov [AUDIT.md](AUDIT.md).
Tento dokument hovorí, **ako sa v repozitári pracuje** — a hlavne, ktoré
rozhodnutia nie sú náhoda, aby ich budúca úprava omylom nezvrátila.

---

## 1. Lokálne spustenie

```bash
nvm use             # Node 24 — verzia je v .nvmrc aj v package.json engines
npm install
cp .env.example .env.local   # a doplniť hodnoty
npm run dev
```

| príkaz | čo robí |
| --- | --- |
| `npm run dev` | vývojový server |
| `npm run build` | produkčný build — musí prejsť pred každým commitom |
| `npm run typecheck` | typová kontrola; vynucuje aj úplnosť prekladov |
| `npm run lint` | ESLint |
| `npm test` | jednotkové testy (viď [TESTY.md](TESTY.md)) |
| `npm run smoke` | kontroly živej produkcie, len na čítanie |
| `npm run db:migrate` | migrácie — vyžaduje `SUPABASE_DB_URL`, viď časť 5 |

Keď sa vývojový server správa nevysvetliteľne, `rm -rf .next` — nie len
`.next/cache`; Turbopack drží dátovú cache inde v `.next`.

---

## 2. Rozloženie repozitára

```
app/[locale]/     verejné stránky — všetko žije pod jazykovým segmentom
app/admin/        administrácia; vlastný document shell, mimo dizajnu webu
app/api/cron/     naplánované úlohy (denné mazanie dopytov)
components/       React komponenty (admin/ len pre administráciu)
lib/              aplikačná logika; lib/supabase/ klienti a prístup
data/             produkty a preklady — generované súbory, viď časť 4
supabase/migrations/  očíslované SQL migrácie, spúšťané ručne
tests/            jednotkové testy (node:test, bez závislostí)
scripts/          smoke.sh a migračný skript
docs/             táto a ostatná dokumentácia
private/          NIKDY nejde do gitu (cenové dokumenty) — .gitignore aj
                  .git/info/exclude
```

---

## 3. Jadro architektúry: súbory vlastnia tvar, databáza obsah

Jediné pravidlo, z ktorého vyplýva väčšina ostatného:

> Súbory v repozitári určujú **tvar a predvolené hodnoty**. Databáza drží
> **úpravy**, ktoré sa aplikujú pri vykreslení. Každé čítanie z databázy
> zlyháva mäkko — na predvolené hodnoty, nikdy na chybovú stránku.

Prakticky:

- `lib/translations.ts` zlúči súborové preklady s publikovanými úpravami
  z databázy. Úprava kľúča, ktorý už v kóde neexistuje, sa **zahodí** — preto
  premenovanie kľúča nikdy nevzkriesi starý text.
- Rovnaký vzor: galéria (`lib/gallery.ts`), kontakty (`lib/company.ts`),
  pošta (`lib/smtp-settings.ts`).
- Nasadenie **nikdy neprepíše** obsah upravený v administrácii; databáza
  prebíja súbor, kým sa úprava nepreklopí do kódu a „neuprace" v editore
  prekladov.

### Cache a zneplatňovanie

Čítania z databázy sú v `unstable_cache` s **tagom a `revalidate: false`** —
neexspirujú časom, zneplatní ich až uloženie v administrácii (`updateTag`).
Dôsledok, na ktorý sa už raz narazilo: **zápis z iného prostredia nad tou istou
databázou sa na produkcii neprejaví**, kým tam niekto neuloží (audit, nález N3).
Ak meníš dáta z lokálu proti zdieľanej databáze, počítaj s tým.

Výnimka: **zoznam editorov sa nečíta z cache nikdy** (`lib/editors.ts`).
Zastaraný footer nestojí nič; zastaraný zoznam prístupov púšťa odobratých
a odmieta pridaných. Necachuj ho ani „na chvíľu".

---

## 4. Preklady a dátové súbory

- `data/translations/*.ts` a `data/products/translations/*.ts` sú **výstup
  serializéra** (`lib/translation-source.ts`), nie voľný zdroják. Ručná úprava
  je v poriadku obsahovo, ale formát potom treba znormalizovať — round-trip
  test to vynúti (regeneruj súbor serializérom, postup v TESTY.md).
- Slovenčina je referenčný súbor: z nej je odvodený typ `Translation`, takže
  **chýbajúci kľúč v inom jazyku zhodí build**. To je zámer — prázdny reťazec
  na stránke by nikto nezbadal, spadnutý build áno.
- Nová sekcia na webe = pridať kľúče do všetkých štyroch jazykov. V editore
  prekladov sa objavia samy.

---

## 5. Databáza a migrácie

- Migrácie sa **spúšťajú ručne** (SQL editor v Supabase alebo
  `npm run db:migrate` s `SUPABASE_DB_URL`), pushe nasadzujú automaticky.
  Z toho plynie deploy-order pravidlo: **kód, ktorý číta tabuľku, do ktorej
  migrácia ešte len pridá stĺpec, musí čítať `select("*")`** — PostgREST
  odmietne celý dotaz pre jediný neznámy stĺpec a vyprázdnil by celú funkciu
  na živom webe. Preto `lib/gallery.ts` a `lib/smtp-settings.ts` čítajú `*`.
- Všetky tabuľky majú **RLS zapnuté bez politík** — prehliadač sa k nim
  nedostane žiadnym kľúčom; číta a zapisuje výhradne server tajným kľúčom.
  Nový SQL objekt musí tento vzor zopakovať, vrátane `revoke`/`grant` pri
  funkciách (Postgres dáva EXECUTE public, Supabase anon a authenticated —
  treba menovať všetkých, vzor v migrácii 0007).
- Tajný kľúč sa číta na **jedinom mieste**: `lib/supabase/admin.ts`, ktorý je
  `server-only` — import z klientského komponentu zhodí build. Neobchádzať.
  Pre klientské komponenty existujú `-shared.ts` moduly bez serverových
  závislostí (vzor: `lib/gallery-shared.ts`).

---

## 6. Prístup do administrácie

Dva zámky: session (vynucuje `proxy.ts` — middleware; Next 16 názov) a zoznam
povolených adries (vynucuje **layout a každá stránka aj akcia zvlášť** —
middleware sa k databáze nedostane, `server-only` by v ňom spadol).

Platný zoznam = tabuľka `editors` **plus** `ADMIN_EMAILS` z prostredia.
Premenná je poistka proti zamknutiu — nemazať ju z Vercelu. Zlyhané čítanie
tabuľky púšťa **len** adresy z premennej.

---

## 7. Nasadenie

- `git push` na `main` = nasadenie na Vercel na všetky štyri domény.
  CI (GitHub Actions) pritom spustí typecheck + lint + testy; build stráži
  Vercel sám.
- Pred pushom lokálne: `npm run typecheck && npm run lint && npm test
  && npm run build`.
- Po nasadení obsahu **kontroluj ostrú doménu, nie `*.vercel.app`** — doména
  môže držať starú kópiu stránky, zatiaľ čo `vercel.app` už ukazuje novú
  (stalo sa; nasadenie starú kópiu zahodí).
- `npm run smoke` po väčších zmenách — 32 kontrol produkcie za ~15 s.

Premenné prostredia sú vymenované v SPECIFIKACIA.md, časť 7.3, aj s tým, čo
ktorá pokazí, keď chýba.

---

## 8. Bežné úlohy

| úloha | kde začať |
| --- | --- |
| zmena textu | editor prekladov v administrácii, nie kód |
| nová sekcia s textami | kľúče do 4 × `data/translations/*.ts`, komponent, hotovo — editor ju uvidí sám |
| nový produkt | `data/products.ts` (neutrálne dáta) + `data/products/translations/*` (4 jazyky) + obrázky cez administráciu |
| piaty jazyk | `lib/i18n.ts` (locale, doména), preklady, `next.config.ts` redirect, sitemap — vzor: commit nemčiny `6b54ec3` |
| zmena doby uchovávania dopytov | `RETENTION_YEARS` v `lib/enquiries.ts` — a zosúladiť so zásadami OÚ |
| nový editor | administrácia → Používatelia (nie Vercel) |
