import type { SpecKey, UnitKey } from "@/types/product";

/** Labels of technical parameters. */
const specs: Record<SpecKey | "clearanceShort", string> = {
  payload: "Max. nosnosť do",
  runtime: "Celková výdrž",
  runtimeEmpty: "Výdrž batérie bez nákladu",
  runtimeLoaded: "Výdrž batérie s plným nákladom",
  clearance: "Minimálny priechod uličky",
  clearanceShort: "Priechod uličky",
  speed: "Max. rýchlosť",
  dimensions: "Rozmery",
  charging: "Nabíjanie",
  lift: "Max. výška zdvihu",
  navigation: "Navigácia",
};

/** Units and value templates. `{hours}` / `{percent}` are replaced at render time. */
const units: Record<UnitKey, string> & { upTo: string; chargingTemplate: string } = {
  kg: "kg",
  hours: "hodín",
  hoursShort: "h",
  cm: "cm",
  mm: "mm",
  mps: "m/s",
  percent: "%",
  upTo: "do",
  chargingTemplate: "{hours} h na {percent} %",
};

export const sk = {
  meta: {
    siteName: "4IGV | PUDU Industrial",
    homeTitle:
      "Robotické vozíky AMR | Autonómna logistika a priemyselné roboty v praxi.",
    homeDescription:
      "Autonómne robotické vozíky rady O2P, T-series, AMR T150, T300, T600 a MP2000 pre vaše potreby transportu materiálu. Presná navigácia, bezpečná preprava a nasadenie s cieľom plánovať a riadiť tok vašej logistiky ktorá rastie s vami.",
    keywordsLabel:
      "robotické vozíkyAMR, intralogistika, priemyselná a logistická automatizácia.",
  },
  a11y: {
    skipToContent: "Preskočiť na obsah",
    mainNavigation: "Hlavná navigácia",
    footerNavigation: "Navigácia v pätičke",
    languageSwitcher: "Voľba jazyka",
    currentLanguage: "Aktuálny jazyk",
    switchTo: "Prepnúť na jazyk",
    productsSubmenu: "Podmenu produktov",
    heroVisual: "Vizualizácia robota s holografickým rozhraním",
    decorative: "Dekoratívny prvok",
    currentPage: "Aktuálna stránka",
    galleryOpen: "Zobraziť obrázok na celú obrazovku",
    galleryClose: "Zavrieť",
    galleryPrevious: "Predchádzajúci obrázok",
    galleryNext: "Nasledujúci obrázok",
    galleryCounter: "{index} z {total}",
    socialLinks: "Sociálne siete",
    themeToggle: "Prepnúť vzhľad",
  },
  navigation: {
    home: "Domov",
    products: "Produkty",
    allProducts: "Všetky produkty",
    technology: "Technológia",
    solutions: "Riešenia",
    contact: "Kontakt",
    language: "Jazyk",
    openMenu: "Otvoriť menu",
    closeMenu: "Zatvoriť menu",
    requestDemo: "Požiadať o ukážku",
  },
  units,
  specs,
  home: {
    hero: {
      eyebrow: "Priemyselná robotika novej generácie",
      titleLine1: "Maximalizujte,",
      titleLine2: "svoj logistický výkon.",
      description:
        "Priemyselné autonómne mobilné roboty AMR T-series pre automatizáciu intralogistiky menia pohyb materiálu na presný, bezpečný a nepretržitý tok z miesta pôvodu do miesta spotreby tak, aby bola dosiahnutá maximálna efektivita.",
      exploreProducts: "Objavte našu flotilu",
      contactUs: "Požiadať o konzultáciu",
      statModels: "modely AMR T-Series",
      statPayload: "nosnosť",
      statUptime: "pripravené na prevádzku",
      hudStatus: "SYSTÉM ONLINE",
      hudRoute: "AUTONÓMNA TRASA / 04",
    },
    ticker: [
      "AUTONÓMNA NAVIGÁCIA SLAM",
      "BEZPEČNÝ POHYB",
      "INTELIGENTNÁ FLOTILA",
      "NEPRETRŽITÁ PREVÁDZKA",
    ],
    products: {
      titleLine1: "Jedna flotila.",
      titleLine2: "Rozličné aplikácie.",
      description:
        "Zvoľte si model autonómneho mobilného robota AMR podľa vašej predstavy. Všetky modely sú navrhnuté pre reálnu priemyselnú prevádzku a jednoduché škálovanie.",
    },
    technology: {
      titleLine1: "Byť flexibilný,",
      titleLine2: "je garancia úspechu.",
      description:
        "Priemyselné autonómne mobilné roboty AMR sú uživateľsky priateľské pre okamžité naištalovanie trasy a na přepravu materiálu. Majú vlastnosti vyhýbať sa nažiadúcim prekážkam a dostať materiál do potrebného miesta destinácie. Náš farebný display znázorňuje a komunikuje všetky požiadavky operátora na spôsob hlasových pokynov alebo zvuku.",
      items: [
        {
          label: "01 / NAVIGÁCIA",
          title: "Presnosť v pohybe",
          description:
            "VSLAM a LiDAR SLAM vytvárajú stabilnú lokalizáciu bez potreby vodiacej pásky alebo rozsiahlych zásahov do prevádzky.",
        },
        {
          label: "02 / BEZPEČNOSŤ",
          title: "360° rozhranie",
          description:
            "Senzory, kamery, ochrana proti kolízii a núdzové zastavenie vytvárajú bezpečný priestor pre ľudí aj zariadenia.",
        },
        {
          label: "03 / INTEGRÁCIA",
          title: "Prepojená výroba",
          description:
            "Výťahy, automatické brány, periférne zariadenia a podnikový ERP systém spájajú autonómne mobilné roboty AMR s celým logistickým tokom a prispôsobujú sa požiadavkám zákazníka.",
        },
      ],
    },
    solutions: {
      eyebrow: "Od jedného robota po celú flotilu",
      title: "Automatizácia, ktorá rastie s vami.",
      description:
        "Začnite jednou trasou, jedným typom nákladu s jedným robotom. Následne pridávajte ďalšie úlohy, ďalšie trasy, ďalšie roboty nebo ťahače. Naplánujte nové trasy, prejazdy do hál, k výrobným linkám a zariadeniam bez obmedzení výroby. Naše roboty sa prispôsobia vaším požiadavkám. Vaša invistícia, vaša rýchla návratnosť.",
      imageAlt: "AMR T600 podbehový robot v holografickom paneli",
      items: [
        "Výroba a zásobovanie liniek, preprava materiálu",
        "Sklady, distribučné centrá, obchody",
        "Automotive a elektronika",
        "Nemocnice, laboratóriá, zdravotnícky priemysel",
      ],
    },
    gallery: {
      titleLine1: "Naše roboty",
      titleLine2: "v reálnej prevádzke.",
      description:
        "Zábery z nasadení u zákazníkov — výroba, sklady a zásobovanie liniek.",
    },
  },
  product: {
    payload: "Nosnosť",
    runtime: "Výdrž",
    navigation: "Navigácia",
    charging: "Nabíjanie",
    learnMore: "Zistiť viac",
    featuredBadge: "Odporúčame",
    requestOffer: "Vyžiadať ponuku",
    specifications: "Technické parametre",
    features: "Hlavné funkcie",
    applications: "Oblasti využitia",
    storyEyebrow: "Navrhnutý pre skutočnú prevádzku",
    featuresTitleLine1: "Tri vrstvy",
    featuresTitleLine2: "inteligencia.",
    featuresDescription:
      "Každá funkcia je navrhnutá tak, aby zjednodušila každodennú manipuláciu a vytvorila predvídateľný logistický tok.",
    applicationsTitle: "Oblasti využitia.",
    applicationsDescription:
      "Typické scenáre, v ktorých AMR prináša najväčší prínos.",
    galleryTitle: "Vnímanie priestoru v reálnej prevádzke",
    galleryDescription:
      "Skenovanie prostredia v priestore udržiava mobilný robot v bezpečnej vzdialenosti od ľudí a periférnych zariadení tak aby zaistil maximálny bezpečnosť prepravy materiálu.",
    hudStatus: "AMR ONLINE",
    backToProducts: "Späť na všetky produkty",
    previousModel: "Predchádzajúci model",
    nextModel: "Ďalší model",
    otherModels: "Ďalšie modely",
    ctaTitle: "Lepšie raz vidieť ako stokrát počuť.",
    ctaDescription:
      "Dohodnite si s nami ukážku a návrh Vašej pilotnej trasy vo vašich priestoroch firmy.",
    ctaButton: "Dohodnite sa ukážku",
    sharedFeatures: [
      {
        label: "BEZPEČNOSŤ",
        title: "Vníma okolie",
        description:
          "Viacúrovňová detekcia prekážok pomáha robotu bezpečne pracovať v spoločnom priestore s ľuďmi a okolím.",
      },
      {
        label: "PREVÁDZKA",
        title: "Pracuje nepretržite",
        description:
          "Automatické nabíjanie a premyslený energetický manažment podporujú celodenné logistické výkony.",
      },
      {
        label: "ŠKÁLOVANIE",
        title: "Rastie do flotily",
        description:
          "Od jednej trasy po koordinované nasadenie viacerých AMR robotov, pracovísk a podnikových systémov.",
      },
    ],
  },
  contact: {
    eyebrow: "Budúcnosť začína prvou trasou",
    title:
      "Navrhneme vašu prevádzku pre prepravu materilálu s našimi autonómnymi robotmi AMR O2P.",
    description: "Ukážka robota · Analýza prevádzky · Návrh pre nasadenie",
    name: "Meno",
    company: "Firma",
    email: "E-mail",
    phone: "Telefón",
    product: "Produkt",
    message: "Správa",
    submit: "Odoslať dopyt",
    success: "Ďakujeme. Váš dopyt bol zaznamenaný.",
    successDetail: "Ozveme sa vám s návrhom pre ukážku AMR.",
    reset: "Odoslať ďalší dopyt",
    optional: "nepovinné",
    consent: "Súhlasím so spracovaním osobných údajov.",
    consentLink: "Zásady spracovania osobných údajov",
    copySubject: "Kópia vášho dopytu",
    copyIntro:
      "Ďakujeme za váš dopyt. Nižšie je kópia toho, čo ste nám poslali — ozveme sa vám čo najskôr.",
    required: "povinné",
    generalInquiry: "Všeobecný dopyt",
    placeholders: {
      name: "Meno a priezvisko",
      company: "Názov firmy",
      email: "vas@email.sk",
      phone: "+421 900 000 000",
      message: "Opíšte prevádzku, typ nákladu a plánovanú trasu.",
    },
    errors: {
      name: "Zadajte svoje meno.",
      email: "Zadajte e-mailovú adresu.",
      emailInvalid: "Zadajte platnú e-mailovú adresu.",
      message: "Napíšte krátku správu.",
      summary: "Skontrolujte prosím vyznačené polia.",
      tooMany: "Príliš mnoho pokusov. Skúste to prosím o chvíľu.",
      consent:
        "Bez súhlasu so spracovaním osobných údajov dopyt nevieme prijať.",
    },
  },
  footer: {
    copyright: "© 2026 PUDU Industrial Slovensko — koncept webovej prezentácie",
    tagline: "Autonómna logistika · Inteligentná preprava · Budúcnosť pohybu",
  },
  notFound: {
    title: "Stránka sa nenašla",
    description:
      "Trasa neexistuje alebo bola presmerovaná. Vráťte sa na úvod a pokračujte odtiaľ.",
    backHome: "Späť na úvod",
  },
};
