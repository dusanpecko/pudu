# Audit webu PUDU Industrial

**Vykonaný:** 14. 8. 2026, na produkcii (štyri živé domény) a nad repozitárom
**Zásada:** každé tvrdenie v tomto dokumente je zmerané — hlavičky a presmerovania
čítané z produkcie, stav databázy zo skutočných tabuliek, DNS zo živých záznamov,
závislosti cez `npm audit`. Nič nie je prevzaté z pamäti ani z dokumentácie.

---

## 1. Zhrnutie

Web je v dobrom stave: prístup do administrácie má dva nezávislé zámky, databáza
je pre prehliadač úplne neprístupná, formulár má serverovú validáciu, súhlas aj
ochranu pred zneužitím, SEO základ je kompletný a výkon je meraný na hornej
hranici (97–99 bodov, plný počet za prístupnosť, postupy aj SEO).

Audit našiel **3 nálezy vysokej priority** — všetky prevádzkové, žiadny nie je
chyba v kóde: pošta je nastavená iba pre slovenský trh a s testovacími údajmi,
naplánované mazanie dopytov nebežalo, a český trh by pri spustení pošty narazil
na SPF. **Jeden z nich (mazanie) bol vyriešený ešte počas auditu**, rovnako ako
zraniteľnosť závislosti. Otvorené ostávajú **2 vysoké**, **2 stredné**
a **4 nízke**.

| priorita | počet | charakter |
| --- | --- | --- |
| vysoká | 2 | prevádzkové kroky pred ostrým spustením |
| stredná | 2 | obrana do hĺbky (hlavičky, DMARC) |
| nízka | 4 | poriadok a odolnosť |
| vyriešené počas auditu | 2 | závislosť `nanoid`; `CRON_SECRET` (V2) |

---

## 2. Čo je v poriadku (overené)

### Prístup a administrácia

- **Dva zámky:** platné prihlásenie + zoznam povolených adries. Prázdny zoznam
  odmietne všetkých — nástroj zlyháva zamknutý.
- Registrácia v Supabase **vypnutá** (overené v projekte), anonymné prihlásenie
  vypnuté. Konto zvonku vytvoriť nejde.
- Každá admin stránka aj každá serverová akcia si oprávnenie **kontroluje
  samostatne** — middleware nie je jediná obrana (14 kontrolných miest).
- `/admin` presmeruje neprihláseného na prihlásenie (307, overené) a nesie
  `noindex, nofollow, nocache` (overené v HTML).
- Servisný kľúč databázy je v module označenom `server-only` — import
  z prehliadačového kódu zhodí build. Jediné miesto, kde sa kľúč číta.
- Zoznam prístupov sa **nikdy nečíta z cache** — odobratie platí okamžite.
- Poistky proti zamknutiu: `ADMIN_EMAILS` sa z administrácie odobrať nedá,
  vlastný prístup tiež nie, posledný prístup tiež nie. Stav pred migráciou
  otestovaný proti reálnej databáze — nikoho nezamkne.

### Dáta

- Všetkých **7 tabuliek** má zapnuté RLS **bez jedinej politiky** — klientským
  kľúčom sa k nim nedá dostať vôbec; číta a zapisuje len server.
- Heslo k pošte sa nikdy neposiela do prehliadača (formulár vie len to, či
  existuje).
- Dopyt sa ukladá **pred** odoslaním pošty; zlyhanie pošty je viditeľné
  v administrácii ako štítok, nie stratená správa.
- IP adresa návštevníka sa neukladá — len jej nezvratný odtlačok so soľou.
- V gite nie je žiadny citlivý súbor (overené: `.env.local` aj `private/` sú
  vylúčené, v repozitári je len `.env.example`).

### Formulár a osobné údaje

- Rozhoduje **serverová** validácia; prehliadačová je len pre odozvu.
- Súhlas so spracovaním je vynútený na serveri a ukladá sa **čas** súhlasu.
- Honeypot odpovedá robotom „úspech", takže sa nemajú čo naučiť.
- Limit 5 odoslaní / 10 min na adresu, 60 / hod. celkovo.
- Chybové hlásenia neprezrádzajú príčinu (tá ide do serverového logu).
- Mazanie: jednotlivo na žiadosť, hromadne po dobe uchovávania, kód dennej
  úlohy je nasadený a chránený kľúčom (že kľúč chýba — viď nález V2).
- Analytika bez cookies — cookie lišta nie je potrebná.

### SEO a doručovanie

- Canonical na správnej doméne (overené na CZ), hreflang všetkých štyroch
  jazykov + `x-default` (overené v HTML produkcie).
- `robots.txt` so všetkými štyrmi sitemapami; administrácia je z indexu
  vylúčená cez `noindex` — správna kombinácia (zákaz v robots.txt by Googlu
  zabránil `noindex` vôbec uvidieť).
- HTTP → HTTPS (308) → www (308) → jazyk trhu (307), overená celá reťaz.
- HSTS s dvojročnou platnosťou.
- Výkon podľa meraní z 13. 8.: mobil 97, desktop 99, prístupnosť/postupy/SEO
  100/100/100, GTmetrix A (97 % / 100 %), LCP pod 1 s, TBT 0 ms.

---

## 3. Nálezy

### V1 — vysoká · Pošta beží na testovacích údajoch a len pre slovenský trh

**Zistené:** v databáze existuje jediné nastavenie pošty (SK). Meno odosielateľa
je „PUDU TEST" a jediný príjemca dopytov je IT adresa správcu. CZ, EN a DE dedia
toto slovenské nastavenie.

**Dopad:** dopyty zo všetkých štyroch trhov chodia na IT adresu, nie obchodu.
„PUDU TEST" je meno odosielateľa testovacieho e-mailu.

**Riešenie:** v administrácii (Nastavenia) vyplniť ostré údaje pre SK a založiť
nastavenia pre CZ — pri EN a DE je dedenie zo SK pravdepodobne v poriadku,
keďže za nimi stojí tá istá firma. Overiť testovacím e-mailom. Ide o krok 2
odovzdávacieho protokolu; je na strane objednávateľa.

### V2 — VYRIEŠENÉ 14. 8. · Naplánované mazanie dopytov nebežalo

**Zistené:** endpoint dennej úlohy vracal na produkcii **503** — premenná
`CRON_SECRET` nebola nastavená. (503 je zámerné správanie: bez kľúča úloha
odmieta bežať, aby nebola verejným zapisovacím endpointom.)

**Vyriešené počas auditu:** objednávateľ nastavil `CRON_SECRET` vo Verceli
a redeployol. Overené na všetkých štyroch doménach: volanie bez kľúča aj so
zlým kľúčom vracia **401**. Prvý naplánovaný beh: najbližšia noc, 3:17 UTC —
skontrolovateľný v logoch cronu vo Verceli.

### V3 — vysoká pred spustením CZ · SPF domény 4igv.cz odmietne poštu z webu

**Zistené (živé DNS):** SPF `4igv.cz` povoľuje výhradne Microsoft 365 a končí
tvrdým `-all`. Poštový server `mail.4igv.cz` (45.13.137.5) v ňom nie je —
na rozdiel od `systechgroup.eu`, ktorá svoj server v SPF výslovne uvádza.

**Dopad:** ak sa český trh nastaví rovnako ako slovenský (vlastný poštový
server), prijímajúce servery dopyty **odmietnu** — nie spam, odmietnutie.
Zákazník vidí odoslaný formulár, firma nedostane nič.

**Riešenie:** pre český trh odosielať priamo cez Microsoft 365, alebo pred
nastavením doplniť server do SPF. Podrobne v dokumente *Domény a pošta*.

### S1 — stredná · Z bezpečnostných hlavičiek posiela produkcia len HSTS

**Zistené:** odpoveď produkcie obsahuje `strict-transport-security` a nič
ďalšie — chýba `X-Content-Type-Options: nosniff`, `X-Frame-Options` /
`frame-ancestors` (ochrana pred clickjackingom, relevantná najmä pre
administráciu), `Referrer-Policy` a `Permissions-Policy`.

**Dopad:** obrana do hĺbky. Žiadna z chýbajúcich hlavičiek nekryje známu dieru
v tomto webe; kryjú triedy útokov, ktoré sa objavujú neskôr.

**Riešenie:** doplniť `headers()` do `next.config.ts` — malá, nízkoriziková
zmena. Plná CSP je väčšia úloha (inline skript témy a Umami by potrebovali
nonce alebo hash) a dá sa odložiť.

### S2 — stredná · DMARC iba sleduje, a nikomu nehlási

**Zistené (živé DNS):** obe odosielacie domény (`systechgroup.eu`, `4igv.cz`)
majú DMARC `p=none` **bez adresy na hlásenia**. Štyri domény PUDU nemajú DMARC
vôbec.

**Dopad:** domény sa dajú zneužiť na podvrhnutú poštu (faktúry v mene firmy)
a nikto sa to nedozvie.

**Riešenie:** doplniť `rua=`, po pár týždňoch sprísniť na `quarantine`
a `reject`. Rozpísané v dokumente *Domény a pošta* — mimo rozsahu diela,
odporúčané ako samostatná úloha.

### N1 — nízka · Odkaz na zásady OÚ existuje len pre slovenčinu

**Zistené:** `privacy_url` je vyplnená iba pre SK (adresa SysTech Group).
CZ, EN a DE dedia slovenskú — vrátane českého trhu, za ktorým stojí iná firma
(4IGV) a odkaz je navyše na slovensky písané zásady.

**Riešenie:** doplniť v Nastaveniach pre každý jazyk, keď budú texty zásad.

### N2 — nízka · Kontakty CZ, EN a DE sú bez e-mailu a telefónu

**Zistené:** v päte majú tieto tri jazyky len názov firmy, adresu
a identifikátory; e-mail a telefón sú prázdne (SK je kompletná).

**Riešenie:** doplniť v administrácii (Kontakty). Nič sa nerozbije, len päta
ponúka menej.

### N3 — nízka · Dátová cache bez stropu expirácie

**Zistené:** texty, galéria a kontakty sa čítajú s cache bez expirácie —
zneplatní ju len uloženie v administrácii. Zápis z iného prostredia nad tou
istou databázou (napr. z vývojového stroja) sa preto na produkcii neprejaví,
kým tam niekto neuloží. Nový zoznam prístupov už toto riziko nemá (bez cache).

**Riešenie:** doplniť strop expirácie (napr. 1 hodina). Úpravy z administrácie
budú naďalej okamžité; zásah odinakiaľ sa prejaví do hodiny namiesto nikdy.

### N4 — nízka · Editor prekladov negeneruje jazykové súbory bajt na bajt

**Zistené:** štyri produktové súbory sa reprodukujú presne; štyri jazykové sa
líšia v zalomení riadkov a jednom komentári (obsah je totožný — overené
normalizovaným porovnaním). Preklady nie sú v ohrození; commit stiahnutého
súboru len vyrobí hlučný diff.

**Riešenie:** zarovnať serializér, keď bude vhodná chvíľa. Netlačí.

### Opravené počas auditu · Zraniteľnosť závislosti nanoid

`npm audit` hlásil 1 zraniteľnosť vysokej závažnosti v tranzitívnej závislosti
`nanoid` (< 3.3.18). Prakticky nezneužiteľná v tomto webe (nič tu nanoid
nevolá), napriek tomu opravená zdvihom v lockfile. Po oprave: **0 zraniteľností**,
build prechádza.

---

## 4. Informatívne (nie sú to nálezy)

- Tabuľka `editors` je nasadená a prázdna — prístup zatiaľ beží výhradne cez
  `ADMIN_EMAILS`, čo je platný stav. V projekte existujú **dve kontá**
  (miroslav.ciernik@…, marek.matovcik@…), ktoré sa vedia prihlásiť, ale narazia
  na „Prístup zamietnutý", kým ich niekto nepridá v Používateľoch.
- V databáze nie je žiadny testovací dopyt (0 záznamov) — čisté.
- Galéria: 9 obrázkov, kontakty: 4 jazyky (SK kompletná), pošta: 1 nastavenie.
- V repozitári sú nepushnuté commity (upratanie, správa používateľov, oprava
  závislosti, tento audit) — čakajú na pokyn na push.

---

## 5. Odporúčané poradie krokov

| # | krok | kto | nález |
| --- | --- | --- | --- |
| 1 | ~~Nastaviť `CRON_SECRET` + redeploy~~ **hotové 14. 8.** | — | V2 |
| 2 | Ostré údaje pošty pre SK, nastavenie pre CZ, test | objednávateľ | V1 |
| 3 | Pred CZ poštou: SPF 4igv.cz alebo M365 | objednávateľ / IT firmy | V3 |
| 4 | Bezpečnostné hlavičky do `next.config.ts` | dodávateľ (malá zmena) | S1 |
| 5 | Zásady OÚ + odkazy pre všetky jazyky | objednávateľ (texty) | N1 |
| 6 | Kontakty CZ/EN/DE doplniť | objednávateľ (5 min) | N2 |
| 7 | DMARC s hlásením, neskôr sprísniť | samostatná úloha | S2 |
| 8 | Strop expirácie cache | dodávateľ, pri ďalšej zmene | N3 |

---

*Audit vykonaný 14. 8. 2026 nad commitom `af78b4e`. Opakovateľný: všetky
kontroly sú príkazy nad produkciou, DNS a databázou, nie úsudky.*
