# PUDU Industrial — technická špecifikácia a odovzdávací protokol

**Dielo:** viacjazyčná webová prezentácia PUDU Industrial
**Domény:** pududotoho.sk · pududotoho.cz · puduindustrial.com · puduindustrial.de
**Stav:** nasadené na produkcii, štyri domény živé
**Verzia dokumentu:** 1 · 13. 8. 2026

Tento dokument opisuje, **z čoho je web postavený, čo dokáže a čo objednávateľ
preberá**. Obsluhu popisuje samostatný *Návod na obsluhu webu*.

---

## 1. Zhrnutie pre vedenie

Pôvodný statický web — päť HTML súborov, jeden štýl, jeden skript — bol prepracovaný
na aplikáciu, ktorá obsluhuje **štyri trhy v štyroch jazykoch** a ktorú **obsahovo
spravuje objednávateľ sám**, bez programátora a bez nasadzovania novej verzie.

Tri rozhodnutia, ktoré určujú prevádzkovú hodnotu diela:

**Obsah je oddelený od kódu.** Texty, obrázky, kontaktné údaje a nastavenie pošty
sú v databáze a menia sa z administrácie. Zásah do kódu si vyžaduje len nová
funkcia, nie nový text či nová fotografia.

**Každý trh je samostatný.** Vlastná doména, vlastný jazyk, vlastné kontaktné údaje
a vlastná adresa, kam chodia dopyty. Za slovenským a českým trhom môže stáť iná
firma než za nemeckým, a web to uvedie správne — vrátane copyrightu a odkazu na
zásady spracovania osobných údajov.

**Web sa nerozbije, keď zlyhá okolie.** Každé čítanie z databázy má zálohu
v podobe textov zo zdrojového kódu. Nedostupná databáza znamená stránku
s pôvodnými textami, nie chybové hlásenie. Dopyt sa uloží pred odoslaním pošty,
takže ho nestratí ani zlyhaný poštový server.

---

## 2. Technológie

### 2.1 Základ aplikácie

| technológia | verzia | úloha a dôvod voľby |
| --- | --- | --- |
| **Next.js** | 16.3.0 | Aplikačný rámec. Stránky sa predgenerujú do statického HTML, takže sa doručujú z CDN — rýchlosť statického webu s možnosťami aplikácie. |
| **React** | 19.2.8 | Komponentová vrstva. Väčšina komponentov beží na serveri, do prehliadača ide len to, čo naozaj potrebuje interaktivitu. |
| **TypeScript** | 5.9.3 | Typová kontrola. Chýbajúci alebo prepísaný preklad zhodí build namiesto toho, aby sa na stránke prejavil ako prázdne miesto. |
| **Tailwind CSS** | 4.3.3 | Štýly. Pôvodných ~1 900 riadkov CSS prevedených na pomenované dizajnové tokeny — dve palety, jedna sada premenných. |
| **Node.js** | 24.x | Serverové prostredie. Verzia je uzamknutá v repozitári, takže lokálne a na produkcii beží to isté. |

### 2.2 Databáza, úložisko a prihlasovanie

| technológia | úloha |
| --- | --- |
| **Supabase (PostgreSQL)** | Šesť tabuliek: preklady, galéria, kontaktné údaje, nastavenie pošty, dopyty a ochrana pred zneužitím. Osem migrácií, ktoré ich vytvorili. |
| **Supabase Auth** | Prihlasovanie do administrácie e-mailom a heslom. |
| **Supabase Storage** | Úložisko obrázkov (priečinok `pudu`) — originály aj vygenerované verzie. |

### 2.3 Prevádzka a služby

| služba | úloha |
| --- | --- |
| **Vercel** | Hosting, CDN, TLS certifikáty, automatické nasadenie z GitHubu, naplánovaná nočná úloha. |
| **GitHub** (privátny) | Zdrojový kód a história. Každý commit je nasadenie. |
| **Umami** | Meranie návštevnosti bez cookies a bez osobných údajov — nepotrebuje súhlas návštevníka. |
| **SMTP poskytovateľa** | Odosielanie pošty. Nastavuje sa z administrácie, pre každý jazyk samostatne. |

### 2.4 Knižnice

| knižnica | verzia | úloha |
| --- | --- | --- |
| `@supabase/supabase-js` | 2.112.1 | Prístup k databáze a úložisku |
| `@supabase/ssr` | 0.12.4 | Prihlásená session medzi serverom a prehliadačom |
| `sharp` | 0.35.3 | Orez obrázkov, prevod na WebP, zachovanie priehľadnosti |
| `nodemailer` | 9.0.4 | Odosielanie pošty cez SMTP |
| `pg` | 8.22.0 | Spúšťanie databázových migrácií |

### 2.5 Typografia

| font | použitie |
| --- | --- |
| **Space Grotesk** | nadpisy a číselné údaje |
| **Inter** | bežný text a rozhranie |

Oba sú hostované priamo z webu. Pôvodná stránka ich načítavala z Google Fonts CDN,
čo je jedno spojenie tretej strany navyše, jeden zdroj pomalšieho zobrazenia a jeden
prenos údajov o návštevníkovi mimo webu.

### 2.6 Farebná škála

V pôvodnom webe bolo **35 farieb zapísaných priamo v štýloch**. Dnes je farebnosť
sada pomenovaných tokenov, čo je dôvod, prečo web vôbec môže mať dve témy: farba sa
mení na jedinom mieste a prejaví sa všade.

| vrstva | počet tokenov |
| --- | --- |
| základná paleta | 9 farieb |
| tmavá téma (predvolená) | 63 farebných tokenov |
| svetlá téma | prepisuje 62 z nich |

#### Základná paleta — tmavá téma

| úloha | token | hodnota |
| --- | --- | --- |
| pozadie stránky | `--color-ink` | `#0B071C` |
| panel a karta | `--color-panel` | `#150F28` |
| text | `--color-fg` | `#F2EEFC` |
| tlmený text | `--color-muted` | `#9990B4` |
| **hlavný akcent** | `--color-accent` | `#73F6FF` |
| doplnkový akcent | `--color-accent-blue` | `#3A8CFF` |
| zvýraznenie | `--color-accent-lime` | `#C7FF64` |
| chybový stav | `--color-danger` | `#FF9D8B` |
| text na akcente | `--on-accent` | `#0A0718` |

#### Svetlá téma

| úloha | hodnota |
| --- | --- |
| pozadie stránky | `#F4F1FC` |
| panel a karta | `#FFFFFF` |
| text | `#1A1235` |
| tlmený text | `#5D5580` |
| **hlavný akcent** | `#4A2C8C` |
| zvýraznenie | `#3F9142` |
| text na akcente | `#FFFFFF` |

Svetlá téma **nie je zosvetlená tmavá**. Dva akcenty v nej museli byť nahradené,
pretože na svetlom podklade prestávajú byť čitateľné: tyrkysová `#73F6FF` sa mení
na fialovú `#4A2C8C` a limetková `#C7FF64` na zelenú `#3F9142`. Fialová je zároveň
to, čo dáva svetlej téme vlastný charakter namiesto vyblednutého dojmu.

#### Ostatné tokeny

Nad základnou paletou stojí ďalších približne šesťdesiat tokenov, ktoré z nej
vychádzajú a robia rozdiel medzi plochým a hĺbkovým vzhľadom: šesť odstupňovaných
podkladových plôch, priesvitné lišty navigácie a rozbaľovacích menu, vlasové linky,
mriežky, jemné svetelné odlesky a tiene. Každý má vlastnú hodnotu pre tmavú aj
svetlú tému.

Prepínač tém je v hlavičke; kým sa ho návštevník nedotkne, web sa riadi nastavením
jeho zariadenia. Farba lišty prehliadača sa mení spolu s témou.

---

## 3. Architektúra

### 3.1 Kde je obsah

Zásada, na ktorej stojí celá správa obsahu:

> **Súbory v repozitári určujú tvar a predvolený obsah. Databáza obsahuje úpravy,
> ktoré sa uplatnia pri zobrazení stránky.**

Z toho vyplýva niekoľko vlastností, ktoré sú v praxi podstatné:

- **Nasadenie novej verzie neprepíše texty**, ktoré niekto upravil v administrácii.
- **Nedostupná databáza znamená pôvodné texty**, nie chybu.
- **Nová sekcia sa v editore objaví sama**, s prekladmi zo zdrojového kódu.
- **Zrušený text zmizne aj s úpravou** — úprava neexistujúceho textu sa ignoruje,
  takže sa nemôže vrátiť starý obsah.

### 3.2 Ako sa doručuje

Stránky sa **predgenerujú pri nasadení** — 20 obsahových stránok, teda štyri jazyky
krát domovská stránka a štyri produkty, plus stránky chýb, `robots.txt`
a `sitemap.xml`. Administrácia sa vykresľuje na vyžiadanie, pretože zobrazuje
aktuálny stav databázy.

Údaje z databázy sú **medzipamäťované a zneplatňujú sa označením**: publikovanie
textov, uloženie kontaktov alebo nahranie obrázka zneplatní práve to, čoho sa zmena
týka. Zmena je preto na webe okamžite, bez čakania na vypršanie a bez nasadzovania.

### 3.3 Doména určuje trh

| doména | jazyk | adresa produktov |
| --- | --- | --- |
| pududotoho.sk | slovenčina | `/sk/produkty/…` |
| pududotoho.cz | čeština | `/cz/produkty/…` |
| puduindustrial.com | angličtina | `/en/products/…` |
| puduindustrial.de | nemčina | `/de/produkte/…` |

Adresa v jazyku trhu nie je kozmetika — je to signál pre vyhľadávače aj pre
návštevníka. Kanonické adresy a `hreflang` sa odvodzujú z tej istej mapy domén ako
presmerovania, takže doména nemôže v jednom mieste hlásiť jeden trh a otvárať iný.

---

## 4. Funkcie

### 4.1 Verejná stránka

- Domovská stránka a štyri produktové stránky, **štyri jazyky** (SK, CZ, EN, DE).
- **980 prekladových reťazcov** — 245 textov krát štyri jazyky, rozhranie
  aj produktové texty.
- Prepínač jazykov a prepínač **svetlej a tmavej témy**, obe voľby sa pamätajú.
- Produktové dáta so **správnym formátovaním čísel a jednotiek** podľa jazyka.
- **Galéria fotografií** v posúvateľnom páse; kliknutím sa fotografia otvorí na celú
  obrazovku a dá sa prechádzať tlačidlami.
- **Hlavné obrázky stránok** (hero) sa vyberajú v administrácii, nie v kóde.
- **Kontaktný formulár** s validáciou v jazyku návštevníka, povinným súhlasom so
  spracovaním osobných údajov a potvrdzovacou kópiou odosielateľovi.
- Vlastná stránka **404** vrátane jazykovej verzie.
- **Prístupnosť:** obsluha klávesnicou, viditeľný focus, ARIA popisy, odkaz na
  preskočenie navigácie, rešpektovanie nastavenia „obmedziť pohyb".
- **Bez JavaScriptu** zostáva stránka čitateľná a animovaný obsah je zobrazený.

### 4.2 SEO

- Kanonické adresy a `hreflang` naprieč štyrmi doménami.
- `sitemap.xml` s adresami na správnych hostoch a `robots.txt` so všetkými sitemapami.
- Metadáta, Open Graph a náhľady pre sociálne siete — vrátane verzie obrázka
  s podkladom, keďže priehľadnosť sa v náhľadoch nezobrazuje.
- Titulky, popisy a kľúčové slová **editovateľné z administrácie** pre každý jazyk.
- Obrázky s povinným alt textom, čitateľnými názvami súborov a vlastnými titulkami.
- Administrácia je pre vyhľadávače zakázaná.

### 4.3 Administrácia

| sekcia | čo umožňuje |
| --- | --- |
| **Prehľad** | Návštevnosť za 7, 30 alebo 90 dní: zobrazenia, návštevníci, návštevy, odchody bez interakcie — s porovnaním voči predchádzajúcemu obdobiu. Graf vývoja, najčastejšie stránky, zdroje návštev, krajiny. |
| **Dopyty** | Evidencia dopytov s príznakom vybavenia, menom toho, kto ho vybavil, a časom. Filtrovanie nevybavených, upozornenie na neodoslanú poštu, mazanie na žiadosť zákazníka, automatické mazanie po dobe uchovávania. |
| **Preklady** | Všetky texty webu v štyroch jazykoch vedľa seba. Priebežné ukladanie konceptu, publikovanie jedným tlačidlom, zahodenie zmien, návrat na predvolený text, hľadanie a filtre, farebné odlíšenie zmenených, nepublikovaných a prázdnych textov. |
| **Galéria** | Nahrávanie obrázkov s náhľadom orezu a voľbou ohniska, automatický prevod na WebP, zaradenie do galérií a hero pozícií, poradie, alt text, titulok a popis pre každý jazyk. |
| **Kontakty** | Kontaktné údaje päty pre každý jazyk: názov firmy, adresa, e-mail, telefón, identifikačné údaje s voliteľným označením, odkazy na sociálne siete. |
| **Nastavenia** | SMTP pre každý jazyk, príjemcovia dopytov, zapnutie a vypnutie odosielania, odkaz na zásady spracovania osobných údajov, overenie testovacím e-mailom. |

### 4.4 Spracovanie obrázkov

Nahraný obrázok sa spracuje na serveri:

| druh | výsledok | poznámka |
| --- | --- | --- |
| **fotografia do galérie** | WebP 2400 × 1350 px (16:9) | orez podľa zvoleného ohniska |
| **render do hero panela** | WebP 1600 × 1600 px | zachovaná priehľadnosť |
| **náhľad pre sociálne siete** | JPEG 1600 × 1600 px | priehľadnosť podložená farbou pozadia |

Menší originál sa nenaťahuje, takže z malého súboru nevznikne rozmazaný veľký.
**Originál zostáva v úložisku**, takže sa dá neskôr preorezať bez nového nahrávania.

Obrázky sa nahrávajú **priamo do úložiska podpísanou adresou**, čím sa obchádza
limit veľkosti požiadavky na hostingu — nahrať sa dá aj snímka z fotoaparátu
v plnej veľkosti.

---

## 5. Bezpečnosť a osobné údaje

### 5.1 Prístup do administrácie

Dva nezávislé zámky. Prvým je **platné prihlásenie**, druhým **serverový zoznam
povolených e-mailov** — samotný účet na prístup nestačí. Zoznam je v serverovej
premennej, prehliadač ho nikdy nedostane, a prázdny zoznam odmietne všetkých.
Nástroj teda zlyháva zamknutý, nie otvorený.

### 5.2 Databáza

Na všetkých šiestich tabuľkách je zapnuté zabezpečenie na úrovni riadkov **bez
jedinej povolovacej politiky**. Prakticky to znamená, že k údajom sa nedostane
žiadny klientský kľúč — čítať a zapisovať môže len server aplikácie tajným kľúčom,
ktorý sa do prehliadača nedostane.

### 5.3 Kontaktný formulár

| ochrana | ako funguje |
| --- | --- |
| **skryté pole** | človek ho nevyplní, robot áno — takému odoslaniu sa odpovie ako úspešnému, takže sa nemá čo naučiť |
| **obmedzenie počtu odoslaní** | 5 na adresu za 10 minút, 60 celkovo za hodinu |
| **kontrola na serveri** | prehliadač validuje pre okamžitú odozvu; rozhoduje kontrola na serveri, pretože požiadavka nemusí prísť z formulára |
| **povinný súhlas** | vynútený na serveri, nie len v prehliadači — súhlas je právny základ uloženia údajov |

Adresa návštevníka sa **neukladá**; na obmedzovanie sa používa jej nezvratný odtlačok
so soľou, aby sa z neho nedala adresa odvodiť skúšaním.

Neúspešné overenie nikdy neprezradí dôvod v jazyku návštevníka — dôvod ide do
serverového záznamu, pretože „zlyhalo prihlásenie na poštový server" je návod, čo
skúsiť ďalej.

### 5.4 Osobné údaje

- Dopyty obsahujú osobné údaje a sú prístupné len prihláseným editorom.
- **Doba uchovávania: päť rokov.** Mazanie beží automaticky každú noc, nie iba pri
  novom dopyte — doba uvedená v zásadách je sľub, nie zámer.
- Jednotlivý dopyt sa dá zmazať na žiadosť zákazníka.
- Naplánovaná úloha je chránená tajným kľúčom; bez neho odmietne bežať namiesto
  toho, aby bežala verejne prístupná.
- Meranie návštevnosti je bez cookies a bez osobných údajov, takže **nepotrebuje
  súhlas** — na webe nie je cookie lišta, pretože nie je čo odsúhlasiť.
- Odkaz na zásady spracovania osobných údajov je pri súhlase a nastavuje sa pre
  každý trh samostatne.

---

## 6. Rozsah diela

| ukazovateľ | hodnota |
| --- | --- |
| Zdrojový kód | **150 súborov, 17 143 riadkov** |
| React komponenty | 48 súborov, 5 634 riadkov |
| Stránky a serverové akcie | 28 súborov, 1 755 riadkov |
| Aplikačná logika | 28 súborov, 3 427 riadkov |
| Dáta a preklady | 11 súborov, 2 071 riadkov |
| Štýly | 2 398 riadkov |
| Databázové tabuľky | 6 |
| Databázové migrácie | 8 súborov, 553 riadkov |
| Predgenerované obsahové stránky | 20 |
| Jazyky | 4 |
| Prekladové reťazce | 980 (245 × 4 jazyky) |
| Produktové modely | 4 |
| Odovzdané balíky prác | 24 |

### Odovzdané balíky

| # | balík |
| --- | --- |
| 1.1 | Konverzia statického webu na Next.js |
| 1.2 | Doména podľa jazyka + SEO pre dva trhy |
| 1.3 | Oprava skrolovania pri prechode medzi stránkami |
| 1.4 | Fialová paleta + voliteľná svetlá téma |
| 1.5 | Editor prekladov + rozdelenie dát |
| 1.6 | Prihlasovanie pre vzdialených editorov |
| 1.7 | Nemčina ako štvrtý jazyk |
| 1.8 | Poradie kariet, zvýraznenie modelu a analytika |
| 1.9 | Admin zóna s prehľadom návštevnosti |
| 1.10 | Nastavenie e-mailu z admin zóny |
| 1.11 | Preklady z databázy bez nasadenia |
| 1.12 | Prevzatie prekladov od objednávateľa |
| 1.13 | Galéria fotografií s orezom a WebP |
| 1.14 | Doména na trh pre štyri jazyky |
| 1.15 | Nasadenie na produkciu, domény, DNS a TLS |
| 1.16 | Zjednotenie verzie Node |
| 1.17 | Päta s kontaktnými údajmi podľa jazyka |
| 1.18 | Hero obrázky z galérie namiesto z kódu |
| 1.19 | Odosielanie dopytov a pošta podľa jazyka |
| 1.20 | Evidencia dopytov, súhlas a ochrana pred zneužitím |
| 1.21 | Naplánované mazanie po dobe uchovávania |
| 1.22 | Prepínač svetlého a tmavého režimu |
| 1.23 | Meno odosielateľa dopytu podľa produktu |
| 1.24 | Návod na obsluhu webu |

Prácnosť a cena sú predmetom samostatného dokumentu *Cena diela*.

---

## 7. Čo objednávateľ preberá

### 7.1 Prístupy a účty

Vlastníctvo týchto účtov je podmienkou samostatnej prevádzky. Pokiaľ niektorý
z nich zostane na dodávateľovi, objednávateľ je na ňom závislý.

| účet | čo obsahuje | stav |
| --- | --- | --- |
| **GitHub** | zdrojový kód a celá história | privátny repozitár |
| **Vercel** | hosting, domény, premenné prostredia, nočná úloha | projekt nasadený |
| **Supabase** | databáza, úložisko obrázkov, používatelia administrácie | osem tabuliek nasadených |
| **Umami** | meranie návštevnosti | meria |
| **DNS domén** | štyri domény | nasmerované, TLS aktívne |
| **SMTP** | odosielanie pošty | nastavuje objednávateľ |

### 7.2 Dokumentácia

| dokument | obsah |
| --- | --- |
| **Návod na obsluhu webu** | ako web spravovať — pre ľudí, ktorí do kódu nevidia |
| **Technická špecifikácia** (tento dokument) | z čoho je web postavený a čo dokáže |
| **Cena diela** | rozpis prácnosti po balíkoch |

### 7.3 Premenné prostredia

Nastavené na hostingu. Uvedené pre úplnosť — bez nich aplikácia nefunguje alebo
prichádza o časť funkcií.

| premenná | funkcia bez nej |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | administrácia sa nedá otvoriť |
| `SUPABASE_SECRET_KEY` | žiadny obsah z databázy — web beží na textoch z kódu |
| `ADMIN_EMAILS` | do administrácie sa nedostane nikto |
| `NEXT_PUBLIC_SITE_URL`, `…_CZ`, `…_EN`, `…_DE` | kanonické adresy a `hreflang` |
| `UMAMI_API_KEY`, `UMAMI_WEBSITE_ID` | prehľad návštevnosti v administrácii |
| `NEXT_PUBLIC_UMAMI_SRC`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | meranie návštevnosti |
| `ENQUIRY_IP_PEPPER` | soľ pre odtlačok adresy pri obmedzovaní odoslaní |
| `CRON_SECRET` | **nočné mazanie dopytov po dobe uchovávania** |

---

## 8. Odovzdávací protokol

### 8.1 Stav k dátumu odovzdania

| položka | stav |
| --- | --- |
| Štyri domény živé, TLS aktívne | ✅ |
| Predgenerovaných 20 obsahových stránok, štyri jazyky | ✅ |
| Administrácia funkčná, šesť sekcií | ✅ |
| Databáza nasadená, šesť tabuliek, osem migrácií | ✅ |
| Meranie návštevnosti | ✅ |
| Kontaktný formulár vrátane ochrany a súhlasu | ✅ |
| Evidencia dopytov s dobou uchovávania päť rokov | ✅ |
| Návod na obsluhu | ✅ |

### 8.2 Podmienky plnej prevádzky

Bez týchto krokov je dielo hotové, ale **web ešte nie je pripravený na zákazníkov**.
Kroky sú na strane objednávateľa.

| # | krok | dôsledok, ak sa neurobí |
| --- | --- | --- |
| 1 | Nastaviť `CRON_SECRET` na hostingu | nočné mazanie neprebehne — **rozpor so zásadami spracovania osobných údajov** |
| 2 | Vyplniť **príjemcov dopytov** pre každý trh a overiť testovacím e-mailom | dopyt nikam nedôjde |
| 3 | Vyplniť **kontaktné údaje** pre všetky štyri jazyky | päta sa v tom jazyku nezobrazí |
| 4 | Doplniť **odkaz na zásady** pre každý jazyk | súhlas bez toho, na čo odkazuje |
| 5 | Skontrolovať texty filtrom „iba prázdne" | chýbajúci text na stránke |
| 6 | Doplniť galérie a hlavné obrázky produktov | stránka bez fotografií |

### 8.3 Neobsahuje

Pre jednoznačnosť rozsahu — tieto položky nie sú súčasťou diela:

- právne texty (zásady spracovania osobných údajov, obchodné podmienky),
- fotografie a produktové rendery,
- registrácia domén a poštové služby,
- správa produktov z administrácie (dnes sú produkty v zdrojovom kóde),
- registrácia webu v Google Search Console,
- školenie editorov nad rámec dodaného návodu.

### 8.4 Prevzatie

| | |
| --- | --- |
| Dielo odovzdal | Lectio.one, IČO 55 97 15 21 |
| Dielo prevzal | SysTech Group s. r. o., IČO 46564853 |
| Dátum | |
| Podpis za dodávateľa | |
| Podpis za objednávateľa | |

**Výhrady pri prevzatí:**

<br><br>

---

*Dokument popisuje stav diela k 13. 8. 2026.*
