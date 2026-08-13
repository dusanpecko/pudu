# PUDU Industrial — návod na obsluhu webu

Príručka pre ľudí, ktorí web spravujú: ako sa prihlásiť, ako zmeniť text, pridať
fotografiu, vybaviť dopyt a nastaviť poštu. Programátor na nič z toho nie je
potrebný — okrem výslovne označených výnimiek na konci.

---

## 1. Čo web tvorí

Jedna aplikácia obsluhuje **štyri domény**, každá pre jeden trh a jeden jazyk:

| doména | jazyk | trh |
| --- | --- | --- |
| pududotoho.sk | slovenčina | Slovensko |
| pududotoho.cz | čeština | Česko |
| puduindustrial.com | angličtina | medzinárodný |
| puduindustrial.de | nemčina | Nemecko a Rakúsko |

Návštevník, ktorý príde na hlavnú adresu domény, sa dostane rovno do jazyka toho
trhu. Jazyk si vie prepnúť aj sám, prepínačom v hlavičke.

Obsah je na štyroch miestach a nič z toho sa nenachádza v kóde:

- **texty** — všetky nadpisy, popisy a produktové texty,
- **obrázky** — galérie a hlavné obrázky stránok,
- **kontaktné údaje** — päta, pre každý jazyk samostatne,
- **nastavenie pošty** — kam chodia dopyty, pre každý jazyk samostatne.

Preto sa dá web upravovať bez zásahu programátora a bez nasadzovania novej verzie.

---

## 2. Prihlásenie

Administrácia je na adrese **/admin** ktorejkoľvek zo štyroch domén, napríklad:

```
https://www.pududotoho.sk/admin
```

Prihlasuje sa **e-mailom a heslom**. Po prihlásení je v hlavičke šesť sekcií —
Prehľad, Dopyty, Preklady, Galéria, Kontakty, Nastavenia — a vpravo vaša adresa
s tlačidlom **Odhlásiť sa**.

Prihlásiť sa dá len z e-mailu, ktorý je na zozname povolených. Samotné vytvorenie
účtu teda na prístup nestačí; keď treba pridať ďalšieho človeka, je to úloha pre
programátora (viď časť 10).

Administrácia je pre vyhľadávače zakázaná — nedostane sa do Googlu ani keď na ňu
niekto omylom odkáže.

---

## 3. Prehľad — návštevnosť

Úvodná stránka administrácie. Vpravo nahor sa prepína obdobie: **7 dní, 30 dní,
90 dní** (predvolene 30). Obdobie platí naraz pre celú stránku.

**Štyri čísla** navrchu, každé s porovnaním voči predchádzajúcemu obdobiu:

- **Zobrazenia** — koľko stránok si ľudia otvorili,
- **Návštevníci** — koľko rôznych ľudí prišlo,
- **Návštevy** — koľko návštev to bolo dohromady (jeden človek môže prísť viackrát),
- **Odchody bez interakcie** — podiel ľudí, ktorí si otvorili jednu stránku a odišli.

Pod tým graf vývoja v čase a tri rebríčky: **Najčastejšie stránky**, **Odkiaľ
prichádzajú** a **Krajiny**.

Meranie je bez cookies a bez osobných údajov, takže nepotrebuje súhlas
návštevníka. Údaje sa obnovujú približne každých päť minút — hneď po vlastnej
návšteve teda číslo ešte nemusí byť vyššie.

---

## 4. Dopyty

Každý dopyt z kontaktného formulára sa tu uloží, **a to ešte pred odoslaním
e-mailu**. Keby pošta zlyhala, dopyt sa nestratí — text si prečítate tu.

### Práca s dopytom

Každý dopyt je jedna karta: meno, firma, jazyk, produkt, e-mail a telefón (dajú
sa rovno kliknúť), dátum a text. Dlhší text sa zbalí, rozbalíte ho odkazom
**celý text**.

- **vybavené** — zaškrtnite, keď je dopyt uzavretý. Uloží sa aj to, **kto** ho
  vybavil a **kedy**, takže je vidieť, či ho niekto nedrží zbytočne otvorený.
- **iba nevybavené** — filter vpravo nahor. Vedľa neho je počítadlo
  nevybavených; nevybavené karty majú oranžový rám.
- **Zmazať** — zmaže jeden dopyt. Slúži na prípad, keď o to zákazník požiada.
  Mazanie je nezvratné a pýta sa na potvrdenie s menom zákazníka.

### Štítky, ktoré sa môžu objaviť

| štítok | čo znamená |
| --- | --- |
| **neodoslané** | dopyt sa nepodarilo poslať e-mailom. Zákazník o tom nevie — text máte tu, ale skontrolujte nastavenie pošty. |
| **bez kópie** | dopyt firme odišel, potvrdzovacia kópia zákazníkovi nie. |

### Doba uchovávania

Dopyty obsahujú osobné údaje. Uchovávajú sa **päť rokov** a potom sa mažú
automaticky — úloha beží každú noc, netreba na ňu myslieť. Keď sa niečo za dobou
uchovávania objaví, ukáže sa modrý pás s tlačidlom **Zmazať staré**, ktorým sa to
dá zmazať hneď.

Doba uchovávania musí súhlasiť s tým, čo uvádzajú zásady spracovania osobných
údajov, na ktoré formulár odkazuje.

---

## 5. Preklady — všetky texty na webe

Najdôležitejšia a najrozsáhlejšia časť. Meniť sa dá **každý text na webe** vo
všetkých štyroch jazykoch naraz, vedľa seba.

### Ako to funguje — koncept a publikovanie

Toto je jediná vec v celom návode, ktorú sa treba naučiť:

1. **Píšete → ukladá sa priebežne ako koncept.** Nie je tu tlačidlo Uložiť.
   Stav vpravo nahor ukazuje *ukladá sa…* a potom *uložené*. Na webe zatiaľ nie je
   nič vidieť.
2. **Kliknete na Publikovať → texty idú na web.** Naraz všetky pripravené zmeny.
3. **Zahodiť** — vráti všetky nepublikované zmeny na pôvodný stav.

Koncept je bezpečné miesto. Môžete texty rozpracovať, odísť a pokračovať zajtra;
nikto medzitým na webe nič nové neuvidí.

> Ukladá sa krátko po tom, čo prestanete písať. Ak by ste stránku zavreli skôr,
> než sa koncept stihne uložiť, prehliadač sa opýta, či to myslíte naozaj. Nie je
> to chyba — je to poistka, aby sa posledná veta nestratila.

### Farby polí

| farba | význam |
| --- | --- |
| bez farby | text je pôvodný |
| **oranžová** | text je zmenený a **publikovaný** |
| **modrá** | text je zmenený, ale **ešte nie je na webe** |
| **červená** | pole je prázdne — na webe nebude nič |

Pod zmeneným poľom je odkaz **späť na predvolené**, ktorý vráti pôvodný text.

### Orientácia

Vľavo je zoznam skupín. Pri každej je počet textov, červené číslo prázdnych
a modrý bod, keď v nej niečo čaká na publikovanie.

- **meta** — texty pre Google a sociálne siete (titulky stránok, popisy),
- **a11y** — popisky pre čítačky obrazovky, návštevník ich nevidí,
- **navigation** — hlavné menu,
- **home** — domovská stránka,
- **product** — spoločné texty produktových stránok,
- **contact** — kontaktný formulár vrátane chybových hlásení,
- **footer** — päta,
- **notFound** — stránka „nenašlo sa",
- **PUDU T150, PUDU T300, PUDU T600-UPRIGHT, PUDU T600-UNDERRIDE** — texty
  jednotlivých produktov.

Nad tabuľkou je hľadanie (podľa kľúča aj podľa textu) a dva filtre: **iba
prázdne** a **iba upravené**.

### Osem tlačidiel so súbormi

Nad tabuľkou je osem tlačidiel s názvami súborov. Slúžia programátorovi na
natrvalé preklopenie textov do zdrojového kódu; vy ich nepotrebujete. Ak ich
niekto použije, platí jediné pravidlo: **najprv publikovať, potom stiahnuť.**
Tlačidlo na to samo upozorní.

Keď sa objaví modrý pás **Upratať prevzaté**, znamená to, že programátor texty
už preklopil do kódu a záznamy v databáze sú zbytočné. Tlačidlo ich odstráni;
na webe sa nezmení nič.

### Keď na web pribudne nová sekcia

Nové texty sa v tabuľke objavia samy, s pôvodnými prekladmi. Nič sa nestratí
a nič sa neprepíše — vaše publikované úpravy majú prednosť pred kódom.

---

## 6. Galéria — obrázky

Sem sa nahrávajú fotografie do galérií aj hlavné obrázky stránok. Programátor na
zmenu obrázka nie je potrebný.

### Dva druhy obrázkov

O druhu rozhoduje **miesto, kam obrázok zaradíte**, nie nastavenie. Preto sa
jeden obrázok nedá zaradiť do galérie aj do hero panela naraz.

| druh | miesto | čo sa s ním stane |
| --- | --- | --- |
| **fotografia** | Galérie | oreže sa na 16:9 |
| **render** | Hero pozície | oreže sa na kvadrát a zachová priehľadnosť |

**Galérie** zobrazia všetky obrázky v pásoch, ktoré sa dajú posúvať.
**Hero pozícia** je hlavný obrázok stránky a zobrazí sa v nej **iba prvý**
obrázok — ak ich tam bude viac, administrácia na to upozorní.

Obe skupiny majú tie isté miesta: **Domovská stránka** a štyri produkty.

### Nahranie obrázka

1. **Vyberte súbor.** JPEG, PNG, WebP, AVIF alebo TIFF. Nahrajte najlepšiu
   kvalitu, akú máte — zmenšenie si web urobí sám.
2. **Skontrolujte orez.** V náhľade je bielym rámom vyznačené, čo z obrázka
   zostane, a pod ním napísané, koľko percent sa odreže. Posuvníkom **Ohnisko
   orezu** vyberiete, ktorá časť má zostať. Ak je obrázok už v správnom pomere,
   posuvník sa neponúkne.
3. **Zaškrtnite umiestnenie.** Aj viac miest naraz — jedna fotografia môže byť
   v galérii domovskej stránky aj konkrétneho produktu.
4. **Pri renderoch:** ak render nemá priehľadné pozadie, ale tmavé, zaškrtnite to.
   Stránka ho potom zmieša s podkladom namiesto zobrazenia obdĺžnika.
5. **Názov súboru** (nepovinné) — čitateľný názov pomáha vyhľadávačom. Ak ho
   nevyplníte, odvodí sa z titulku.
6. **Vyplňte texty** — prepínačom vyberáte jazyk. Bodka pri jazyku znamená, že mu
   chýba alt text. Tlačidlom sa text skopíruje do všetkých jazykov naraz.

   - **Alt text** — *povinný*, aspoň v jednom jazyku. Opisuje, čo je na obrázku;
     čítajú ho čítačky obrazovky aj Google.
   - **Titulok** — krátky nadpis, zobrazí sa pod obrázkom.
   - **Popis** — dlhší text pre kontext.

7. **Nahrať obrázok.**

Obrázok sa uloží ako WebP — fotografie 2400 × 1350 px, rendery 1600 × 1600 px.
Menší obrázok sa nenaťahuje, takže z malého súboru nevznikne rozmazaný veľký.
**Originál zostáva v úložisku**, takže sa dá neskôr preorezať bez nového
nahrávania. Z renderov sa navyše vyrobí verzia s podkladom pre náhľady na
sociálnych sieťach, kde priehľadnosť nefunguje.

### Úprava a poradie

Pri každom obrázku v zozname:

- **Upraviť** — otvorí texty a umiestnenie na zmenu, potom **Uložiť**,
- **strelky nahor a nadol** — poradie v páse,
- **Zmazať** — odstráni obrázok aj súbory v úložisku, nezvratne.

---

## 7. Kontakty — päta stránky

Údaje v päte, **pre každý jazyk samostatne**. Za slovenským a českým trhom môže
stáť iná firma než za anglickým, a päta to potom uvedie správne, vrátane
copyrightu.

Prepínačom navrchu vyberiete jazyk; bodka znamená nevyplnený jazyk. Voľbou
**prevziať z** sa dajú údaje skopírovať z iného jazyka a potom doupraviť.

- **Názov firmy** — použije sa aj v copyrighte v päte a ako meno odosielateľa pri
  všeobecnom dopyte.
- **Adresa** — každý riadok sa v päte zobrazí ako samostatný riadok.
- **E-mail, Telefón**.
- **Identifikačné údaje** — označenie si volíte sami: IČO a DIČ pre slovenskú
  firmu, HRB a USt-IdNr. pre nemeckú. Vypíšu sa za sebou.
- **Sociálne siete** — sieť zo zoznamu a adresa začínajúca `https://`. Pri známych
  sieťach sa zobrazí ikona.

Nevyplnený jazyk pätu jednoducho nezobrazí. Nič sa nerozbije.

---

## 8. Nastavenia e-mailu

Odtiaľto web odosiela dopyty. Znovu **pre každý jazyk samostatne**, takže český
dopyt môže ísť inej firme než slovenský.

Jazyk, ktorý vlastné nastavenie nemá, používa slovenské — administrácia to napíše
oranžovým pásom. Uložením v takom jazyku vznikne preň samostatné nastavenie.

### Polia

| pole | poznámka |
| --- | --- |
| **Odosielanie e-mailov je zapnuté** | keď je vypnuté, web e-maily neodosiela ani sa o to nepokúša |
| **Server (SMTP host), Port** | od poskytovateľa e-mailu |
| **Prihlasovacie meno, Heslo** | uložené heslo sa nikdy nezobrazuje; prázdne pole ho ponechá |
| **Meno odosielateľa** | používa sa pri testovacom e-maile |
| **Adresa odosielateľa** | z tejto adresy pošta odchádza |
| **Adresa pre odpoveď** | nepovinné |
| **Príjemcovia dopytov** | viac adries oddeľte čiarkou |
| **Odkaz na zásady spracovania osobných údajov** | pripojí sa k zaškrtávaciemu poľu vo formulári |

Meno odosielateľa pri dopytoch nastavovať netreba: dopyt odchádza pod **názvom
vybraného produktu**, a pri všeobecnom dopyte pod **názvom firmy** z Kontaktov.
Príjemca tak dopyt zaradí ešte pred otvorením.

### Odkaz na zásady

Každý trh môže odkazovať na zásady svojej firmy. Bez odkazu je súhlas stále
povinný, len nie je na čo odkázať — a to je pri zbieraní osobných údajov slabé
miesto. **Odkaz doplňte pre každý jazyk.**

### Overenie

Tlačidlom **Odoslať testovací e-mail** sa pošle správa na adresu, s ktorou ste
prihlásený, a to nastavením pre práve vybraný jazyk. Nastavenia najprv uložte.
Zlé heslo sa takto zistí hneď, nie až na dopyte, ktorý sa niekde stratil.

---

## 9. Čo sa deje na verejnej stránke

Krátko, aby bolo jasné, čo návštevník vidí.

**Jazyk.** Prepínač v hlavičke. Doména určuje jazyk, ktorým sa stránka otvorí.

**Svetlý a tmavý režim.** Tlačidlo so slnkom alebo mesiacom v hlavičke. Kým sa ho
návštevník nedotkne, web sa riadi nastavením jeho zariadenia. Voľba sa pamätá.

**Galéria.** Fotografie sú v páse, ktorý sa posúva. Kliknutím sa fotografia otvorí
na celú obrazovku a dá sa prechádzať tlačidlami dopredu a dozadu.

**Kontaktný formulár.** Meno, e-mail a správa sú povinné, rovnako **súhlas so
spracovaním osobných údajov**. Bez súhlasu sa dopyt neodošle. Odosielateľ dostane
potvrdzovaciu kópiu.

**Ochrana pred zneužitím.** Formulár je chránený pred robotmi a proti príliš
mnohým odoslaniam z jednej adresy. Skutočnému človeku, ktorý odošle dopyt dvakrát,
sa zobrazí, že ide o časové obmedzenie, nie o chybu vo formulári.

---

## 10. Kedy treba programátora

Väčšina vecí sa dá spraviť z administrácie. Tieto nie:

- **pridať alebo odobrať človeka s prístupom** do administrácie,
- **pridať nový produkt** alebo novú sekciu na stránku,
- **pridať piaty jazyk** alebo ďalšiu doménu,
- **zmeniť dobu uchovávania dopytov** (dnes päť rokov) — musí súhlasiť so
  zásadami,
- **preklopiť publikované texty do zdrojového kódu** — nie je to nutné, web funguje
  aj bez toho, ale je to poriadok.

---

## 11. Na čo nezabudnúť pri prevzatí

Vzorové údaje, ktoré treba vymeniť za skutočné:

1. **Kontakty** — vyplniť pre všetky štyri jazyky: názov firmy, adresu, e-mail,
   telefón, identifikačné údaje a odkazy na sociálne siete.
2. **Nastavenia e-mailu** — skutočný SMTP server a **príjemcovia dopytov** pre
   každý trh. Overiť testovacím e-mailom.
3. **Odkaz na zásady spracovania osobných údajov** — pre každý jazyk. Zásady musia
   uvádzať dobu uchovávania **päť rokov**.
4. **Texty** — prejsť v Prekladoch filtrom **iba prázdne**, či niekde niečo
   nechýba.
5. **Obrázky** — doplniť galérie a hlavné obrázky produktov.

---

## 12. Časté úlohy

| chcem… | kde |
| --- | --- |
| zmeniť text na stránke | **Preklady** → skupina → prepísať → **Publikovať** |
| opraviť preklep vo všetkých jazykoch | **Preklady** → hľadať text → prepísať → **Publikovať** |
| pridať fotografiu do galérie | **Galéria** → vybrať súbor → zaškrtnúť galériu → alt text → **Nahrať** |
| vymeniť hlavný obrázok produktu | **Galéria** → nahrať do hero pozície, starý zmazať |
| zmeniť adresu alebo telefón v päte | **Kontakty** → vybrať jazyk → **Uložiť** |
| presmerovať dopyty na inú adresu | **Nastavenia** → vybrať jazyk → *Príjemcovia dopytov* |
| zistiť, či dopyty odchádzajú | **Nastavenia** → **Odoslať testovací e-mail** |
| označiť dopyt za vybavený | **Dopyty** → zaškrtnúť *vybavené* |
| zmazať dopyt na žiadosť zákazníka | **Dopyty** → **Zmazať** |
| zistiť, koľko ľudí prišlo | **Prehľad** → vybrať obdobie |

---

## 13. Keď niečo nefunguje

**Zmenil som text a na webe je stále starý.** Skontrolujte stav vpravo nahor
v Prekladoch. Ak je tam *nepublikovaných*, kliknite na **Publikovať**.

**Dopyty neprichádzajú.** Otvorte **Dopyty** — ak sú tam so štítkom *neodoslané*,
zlyhala pošta a texty sú v bezpečí. Skontrolujte, či je v **Nastaveniach**
zapnuté odosielanie, a spustite testovací e-mail. Ak v Dopytoch nie je nič,
dopyty neprichádzajú vôbec.

**Obrázok sa v galérii neukázal.** Pri hero pozícii sa zobrazuje iba prvý obrázok.
V páse skontrolujte poradie strelkami.

**Nedá sa prihlásiť.** Prístup má len povolený e-mail. Ak je heslo správne,
požiadajte o pridanie na zoznam (časť 10).

**Päta je prázdna.** Ten jazyk nemá vyplnené **Kontakty**.
