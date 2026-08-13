# Domény, DNS a e-mailové zabezpečenie

Stav overený 14. 8. 2026 priamo v DNS.

---

## X.1 Doménová konfigurácia

Všetky štyri domény smerujú na hosting Vercel rovnakou dvojicou záznamov:
koreňová doména cez `A` záznam, `www` poddoména cez `CNAME` na Vercel.
TLS certifikáty sa vydávajú a obnovujú automaticky.

| Doména | Typ | Záznam | Hodnota | Výsledná adresa |
| --- | --- | --- | --- | --- |
| pududotoho.sk | A | @ | 216.150.1.1 | https://www.pududotoho.sk/sk |
| | CNAME | www | 9332691dbd45fcff.vercel-dns-016.com | |
| pududotoho.cz | A | @ | 216.150.1.1 | https://www.pududotoho.cz/cz |
| | CNAME | www | 9332691dbd45fcff.vercel-dns-016.com | |
| puduindustrial.com | A | @ | 216.150.1.1 | https://www.puduindustrial.com/en |
| | CNAME | www | 9332691dbd45fcff.vercel-dns-016.com | |
| puduindustrial.de | A | @ | 216.150.1.1 | https://www.puduindustrial.de/de |
| | CNAME | www | 9332691dbd45fcff.vercel-dns-016.com | |

Návštevník, ktorý zadá adresu bez `www` alebo bez `https`, prejde reťazcom
presmerovaní až na jazyk svojho trhu — napríklad `http://pududotoho.sk`
skončí na `https://www.pududotoho.sk/sk`. Ostatné existujúce DNS záznamy
(najmä pre poštu) zostali nezmenené.

> **Na overenie:** hodnoty vyššie boli overené 14. 8. 2026 a zodpovedajú
> skutočnosti. Vercel však občas mení odporúčanú IP adresu — pri budúcich
> zmenách DNS si ju overte v nastaveniach projektu.

---

## X.2 TLS (HTTPS) certifikáty

Certifikáty pre všetky štyri domény vydáva a automaticky obnovuje Vercel.
Web je dostupný výhradne cez HTTPS; požiadavka na HTTP sa presmeruje na
zabezpečené spojenie. Na strane objednávateľa netreba nič spravovať.

---

## X.3 Stav e-mailového zabezpečenia — nález a odporúčanie

> **Toto nie je súčasť dodaného diela.** Ide o nález zistený pri nastavovaní
> odosielania pošty (SMTP) a o odporúčanie na doriešenie. E-mailové
> zabezpečenie domén je samostatná úloha; uvádza sa tu, pretože jeden
> z nálezov by inak ticho zastavil dopyty z českého trhu.

### Ktoré domény sa týkajú pošty

Web neodosiela poštu z domén PUDU. Dopyty a potvrdenia odchádzajú z domén
oboch firiem, ktoré za trhmi stoja:

| Trh | Odosielacia doména | Poštová služba |
| --- | --- | --- |
| Slovensko, medzinárodný, Nemecko | systechgroup.eu | Microsoft 365 |
| Česko | 4igv.cz | Microsoft 365 |

E-mailové zabezpečenie sa preto posudzuje pri týchto dvoch doménach, nie pri
doménach PUDU.

### Čo je nastavené

| Záznam | systechgroup.eu | 4igv.cz |
| --- | --- | --- |
| **MX** — kam chodí prijatá pošta | ✅ Microsoft 365 | ✅ Microsoft 365 |
| **SPF** — kto smie odosielať | ✅ vrátane odosielacieho servera webu | ⚠️ **iba Microsoft 365** |
| **DKIM** — podpis odoslanej pošty | ✅ | ✅ |
| **DMARC** — čo s neoverenou poštou | ⚠️ iba sleduje, a bez hlásení | ⚠️ iba sleduje, a bez hlásení |
| **MTA-STS** — vynútené šifrovanie | ❌ chýba | ❌ chýba |
| **TLS-RPT** — hlásenia o šifrovaní | ❌ chýba | ❌ chýba |
| **BIMI** — logo v schránke | ❌ chýba | ❌ chýba |

Základ je teda v poriadku: obe domény majú MX, SPF aj DKIM. Nálezy nižšie sa
týkajú toho, čo chýba nad ním — a jedného rozdielu medzi doménami, ktorý má
praktický dopad.

### Nález 1 — český trh: pošta z webu neprejde kontrolou

**Toto treba vyriešiť skôr, než sa nastaví odosielanie pre český trh.**

SPF domény `4igv.cz` povoľuje odosielanie **výhradne cez Microsoft 365** a končí
tvrdým zákazom (`-all`). To znamená: čokoľvek, čo sa pokúsi odoslať v mene
`4igv.cz` odinakiaľ, prijímajúci server **odmietne** — nie zaradí do spamu,
ale odmietne.

Slovenské nastavenie odosiela cez samostatný poštový server firmy, ktorý má
v SPF domény `systechgroup.eu` výslovné povolenie. Pri `4igv.cz` obdobné
povolenie nie je. Ak sa teda pre český trh nastaví rovnaký typ servera,
**dopyty z českého webu neodídu** — a zákazník ani firma sa o tom nedozvedia,
lebo web zlyhanie zaznamená, ale odosielateľ ho nevidí.

Dve riešenia, obe jednoduché:

- **odosielať pre český trh priamo cez Microsoft 365** (server, ktorý SPF už
  povoľuje), alebo
- **doplniť adresu použitého poštového servera do SPF domény `4igv.cz`** ešte
  pred nastavením.

### Nález 2 — DMARC len sleduje a nikomu nehlási

Obe domény majú DMARC v režime `p=none`, teda „len sleduj, nič nerob".
Nemajú však vyplnenú adresu na zasielanie hlásení (`rua`), takže sledovanie
nikam nechodí — nikto sa nedozvie, či sa niekto vydáva za doménu, ani či
legitímna pošta prechádza kontrolami.

V praxi to znamená, že doménu možno zneužiť na podvrhnutú poštu (faktúry,
požiadavky na platbu v mene firmy) a nič to nezachytí.

Odporúčaný postup je overený a bezpečný: doplniť `rua`, niekoľko týždňov
sledovať hlásenia, a keď je isté, že legitímna pošta prechádza, sprísniť
politiku na `quarantine` a napokon `reject`.

### Nález 3 — domény PUDU sa dajú zneužiť na podvrhnutú poštu

Domény `pududotoho.sk`, `pududotoho.cz`, `puduindustrial.com`
a `puduindustrial.de` majú MX aj SPF, ale **nemajú DMARC**. Poštu z nich web
neodosiela, takže na dopyty to nemá vplyv — ale ktokoľvek sa v ich mene môže
pokúsiť posielať e-maily a nič to nenahlási.

Ak sa niekedy zvažuje odosielanie z adresy na doméne PUDU (napríklad
`info@pududotoho.sk`), platí to isté upozornenie ako v náleze 1: odosielací
server treba najprv doplniť do SPF tej domény.

### Odporúčané poradie priorít

| Priorita | Úloha | Prečo |
| --- | --- | --- |
| **1 — pred spustením CZ** | Zosúladiť odosielanie pre `4igv.cz` so SPF | Inak dopyty z českého trhu neodídu vôbec. |
| **2 — krátkodobo** | Doplniť `rua` do DMARC oboch odosielacích domén | Bez hlásení nikto nevidí, čo sa s poštou deje. |
| **3 — po overení** | Sprísniť DMARC na `quarantine`, potom `reject` | Uzavrie doménu pred zneužitím na podvrhnutú poštu. |
| **4** | DMARC pre štyri domény PUDU | Bránia sa tým pred zneužitím aj domény, z ktorých sa neodosiela. |
| **5** | MTA-STS + TLS-RPT | Vynúti šifrovaný prenos pošty a dá o ňom spätnú väzbu. |
| **6 — čerešnička** | BIMI | Logo firmy v schránke príjemcu. Vyžaduje DMARC na `quarantine` alebo `reject`, takže má zmysel až po kroku 3. |

### Odporúčaný ďalší krok

E-mailové zabezpečenie odporúčam doriešiť ako samostatnú úlohu — v poradí
podľa tabuľky vyššie, vrátane overenia, že dopyty a potvrdzovacie e-maily
z webu prechádzajú kontrolami na oboch trhoch. Rozsah a cenu možno dohodnúť
samostatne.

**Krok 1 odporúčam urobiť pred spustením českého trhu**, nie po ňom.
