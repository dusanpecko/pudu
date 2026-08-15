# Testy

Ako sa web testuje, čo je pokryté zámerne a čo zámerne nie.

```bash
npm test          # jednotkové testy — ~34 testov, pod sekundu, bez siete
npm run smoke     # 32 kontrol živej produkcie — len na čítanie, ~15 s
```

Testy bežia na vstavanom runneri Node (`node:test`) — **žiadna testovacia
závislosť sa neinštaluje**. Nepotrebujú `.env.local`, databázu ani sieť, takže
bežia rovnako u vývojára aj v CI (GitHub Actions pri každom pushi: typecheck,
lint, testy; build stráži Vercel).

---

## 1. Čo je pokryté a prečo práve to

Testovaná je **logika, ktorej zlyhanie by build ani typová kontrola nechytili**.
Zvyšok webu chráni prísnejšia sieť, než býva zvykom: typ `Translation` vynucuje
úplnosť prekladov (chýbajúci kľúč = spadnutý build), build musí vygenerovať
všetky stránky, a Vercel rozbitý build nenasadí.

| súbor | invariant, ktorý stráži |
| --- | --- |
| `translation-roundtrip.test.ts` | regenerácia nezmeneného dátového súboru = **bajt na bajt** ten istý súbor. Záruka editora prekladov; raz sa potichu rozišla (audit N4), tento test bol chýbajúci alarm |
| `translation-edits.test.ts` | úprava kľúča, ktorý v kóde už neexistuje, sa **zahodí** — preto sa staré texty nikdy nevracajú; a `applyEdits` nemení vstup |
| `theme-script.test.ts` | 7 prípadov skriptu témy vrátane **zablokovaného úložiska** — presne ten prípad, ktorý počas vývoja regresol |
| `mailer-sender.test.ts` | meno odosielateľa: adresa vždy z nastavení, a **cez meno sa nedá prepašovať hlavička** (nový riadok, úvodzovky, spätné lomky) |
| `gallery-crop.test.ts` | orez má vždy žiadaný pomer, vždy sa zmestí, ohnisko na okraji **nepretečie** |
| `editors-env.test.ts` | `ADMIN_EMAILS`: normalizácia adries, prázdna premenná nepúšťa nikoho — polovica poistky proti zamknutiu |

## 2. Jedna zvláštnosť: testy „vystrihujú" zo zdrojákov

`sender()`, skript témy a `cropRect` žijú v súboroch, ktoré sa z testu nedajú
importovať celé — `server-only` mimo Reactu vyhodí výnimku, `.tsx` obsahuje JSX
a aliasy `@/` Node nerozlúšti. Testy preto **vystrihnú presne tú funkciu zo
skutočného súboru** (regexom, cez `tests/helpers.ts`) a spustia doslova text,
ktorý sa nasadzuje.

Dôsledok, s ktorým treba počítať: **premenovanie alebo presun takej funkcie
zhodí test** s hláškou „Snippet not found". To je zámer — alternatívou by bolo
prerábať produkčný kód kvôli testom, alebo riskovať, že test potichu testuje
niečo iné, než sa nasadzuje. Po presune stačí upraviť regex v teste.

## 3. Keď spadne round-trip test

Znamená to, že dátový súbor prekladov sa líši od svojej kanonickej podoby —
najčastejšie po ručnej úprave `data/translations/*.ts`. Obsah je v poriadku;
znormalizuj formát regeneráciou:

```bash
node -e '
import("./lib/translation-source.ts").then(async ({ serializeUiTranslations }) => {
  const fs = await import("node:fs");
  for (const l of ["sk", "cz", "en", "de"]) {
    const m = await import(`./data/translations/${l}.ts`);
    fs.writeFileSync(`data/translations/${l}.ts`, serializeUiTranslations(l, m[l]));
  }
});'
```

Pozor: serializér nevie o ručne dopísaných komentároch v dátach — regenerácia
ich zahodí. Komentáre patria do kódu alebo dokumentácie, nie do dátových
súborov; presne tým sa záruka rozišla prvýkrát.

## 4. Čo pokryté zámerne nie je

- **E2E prehliadačové testy** — administrácia vyžaduje prihlásenie a databázu;
  údržba by pri webe, ktorý sa po odovzdaní mení zriedka, prevýšila úžitok.
  Náhradou je `npm run smoke`: reťaz presmerovaní, päta z databázy, hreflang,
  ochrana administrácie a cronu, sitemap — na všetkých štyroch doménach.
- **Komponentové testy UI** — administračné obrazovky sa overujú očami a menia
  málo; snapshot testy by len zamŕzali dizajn.
- **Integračné testy proti databáze** — prístupová logika je preto rozdelená
  tak, aby čistá časť (zjednotenie zoznamov, normalizácia) bola testovateľná
  bez nej. Serverová časť sa overuje ručne proti reálnemu projektu pri zmene.

## 5. Ako pridať test

Nový súbor `tests/<nazov>.test.ts`, `import { test } from "node:test"`,
`assert` z `node:assert/strict`. Ak potrebuješ funkciu spoza `server-only`,
použi `importSnippet` z `tests/helpers.ts`. Testy musia zostať čisté — žiadna
sieť, databáza ani `.env.local`; CI beží bez tajomstiev a má to tak zostať.
