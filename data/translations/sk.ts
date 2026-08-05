import type { SpecKey, UnitKey } from "@/types/product";

/** Labels of technical parameters. */
const specs: Record<SpecKey | "clearanceShort", string> = {
  payload: "Nosnosť",
  runtime: "Výdrž",
  runtimeEmpty: "Výdrž bez nákladu",
  runtimeLoaded: "Výdrž s plným nákladom",
  clearance: "Minimálny priechod",
  clearanceShort: "Priechod",
  speed: "Rýchlosť",
  dimensions: "Rozmery",
  charging: "Nabíjanie",
  lift: "Zdvih",
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
    siteName: "PUDU Industrial",
    homeTitle: "PUDU Industrial | Autonómna logistika a priemyselné roboty",
    homeDescription:
      "Autonómne mobilné roboty PUDU T150, T300 a T600 pre výrobu, sklady a intralogistiku. Presná navigácia, bezpečný pohyb a nasadenie, ktoré rastie s vami.",
    keywordsLabel:
      "autonómne roboty, AMR, intralogistika, priemyselná automatizácia",
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
      titleLine1: "Logistika,",
      titleLine2: "ktorá myslí.",
      description:
        "Autonómne mobilné roboty PUDU premieňajú pohyb materiálu na presný, bezpečný a nepretržitý tok. Od ľahkých komponentov až po 600-kilogramové náklady.",
      exploreProducts: "Objaviť flotilu",
      contactUs: "Navrhnúť riešenie",
      statModels: "modely v ponuke",
      statPayload: "rozsah nosnosti",
      statUptime: "pripravené na prevádzku",
      hudStatus: "SYSTÉM ONLINE",
      hudRoute: "AUTONÓMNA TRASA / 04",
    },
    ticker: [
      "AUTONÓMNA NAVIGÁCIA",
      "BEZPEČNÝ POHYB",
      "INTELIGENTNÁ FLOTA",
      "NEPRETRŽITÁ PREVÁDZKA",
    ],
    products: {
      titleLine1: "Jedna flotila.",
      titleLine2: "Štyri schopnosti.",
      description:
        "Vyberte robot podľa hmotnosti, spôsobu manipulácie a priestoru. Všetky modely sú navrhnuté pre reálnu priemyselnú prevádzku a jednoduché škálovanie.",
    },
    technology: {
      titleLine1: "Technológia,",
      titleLine2: "ktorá neprekáža.",
      description:
        "Roboty vnímajú priestor, vyhýbajú sa prekážkam, komunikujú so systémami budovy a prirodzene spolupracujú s ľuďmi.",
      items: [
        {
          label: "01 / NAVIGÁCIA",
          title: "Presnosť v pohybe",
          description:
            "VSLAM a LiDAR SLAM vytvárajú stabilnú lokalizáciu bez potreby vodiacej pásky alebo rozsiahlych zásahov do prevádzky.",
        },
        {
          label: "02 / BEZPEČNOSŤ",
          title: "360° vnímanie",
          description:
            "Senzory, kamery, ochrana proti kolízii a núdzové zastavenie vytvárajú bezpečný priestor pre ľudí aj stroje.",
        },
        {
          label: "03 / INTEGRÁCIA",
          title: "Prepojená výroba",
          description:
            "Výťahy, automatické brány, pagery, PUDU Link a podnikové rozhrania spájajú roboty s celým logistickým tokom.",
        },
      ],
    },
    solutions: {
      eyebrow: "Od jedného robota po celú flotilu",
      title: "Automatizácia, ktorá rastie s vami.",
      description:
        "Začnite jednou trasou, jedným typom nákladu a jedným robotom. Následne pridávajte ďalšie úlohy, regály, výrobné linky a zariadenia bez zmeny celej koncepcie.",
      imageAlt: "PUDU T600 Underride v holografickom paneli",
      items: [
        "Výroba a zásobovanie liniek",
        "Sklady a distribučné centrá",
        "Automotive a elektronika",
        "Nemocnice a laboratóriá",
      ],
    },
  },
  product: {
    payload: "Nosnosť",
    runtime: "Výdrž",
    navigation: "Navigácia",
    charging: "Nabíjanie",
    learnMore: "Zistiť viac",
    requestOffer: "Vyžiadať ponuku",
    specifications: "Technické parametre",
    features: "Hlavné funkcie",
    applications: "Oblasti využitia",
    storyEyebrow: "Navrhnutý pre skutočnú prevádzku",
    featuresTitleLine1: "Tri vrstvy",
    featuresTitleLine2: "inteligencie.",
    featuresDescription:
      "Každá funkcia je navrhnutá tak, aby zjednodušila každodennú manipuláciu a vytvorila predvídateľný logistický tok.",
    applicationsTitle: "Oblasti využitia.",
    applicationsDescription:
      "Typické scenáre, v ktorých model prináša najväčší prínos.",
    galleryTitle: "Vnímanie priestoru v reálnej prevádzke",
    galleryDescription:
      "Skenovanie okolia v reálnom čase udržiava robot v bezpečnej vzdialenosti od ľudí, regálov aj vozíkov.",
    hudStatus: "AMR ONLINE",
    backToProducts: "Späť na všetky produkty",
    previousModel: "Predchádzajúci model",
    nextModel: "Ďalší model",
    otherModels: "Ďalšie modely",
    ctaTitle: "Uvidieť robota je lepšie než o ňom čítať.",
    ctaDescription:
      "Dohodnite si ukážku a návrh pilotnej trasy vo vašej prevádzke.",
    ctaButton: "Dohodnúť ukážku",
    sharedFeatures: [
      {
        label: "BEZPEČNOSŤ",
        title: "Vníma okolie",
        description:
          "Viacúrovňová detekcia prekážok pomáha robotu bezpečne pracovať v spoločnom priestore s ľuďmi.",
      },
      {
        label: "PREVÁDZKA",
        title: "Pracuje nepretržite",
        description:
          "Automatické nabíjanie a premyslený energetický manažment podporujú celodenné logistické scenáre.",
      },
      {
        label: "ŠKÁLOVANIE",
        title: "Rastie do flotily",
        description:
          "Od jednej trasy po koordinované nasadenie viacerých robotov, pracovísk a podnikových systémov.",
      },
    ],
  },
  contact: {
    eyebrow: "Budúcnosť začína prvou trasou",
    title: "Poďme automatizovať vašu prevádzku.",
    description: "Ukážka robota · Analýza prevádzky · Návrh nasadenia",
    name: "Meno",
    company: "Firma",
    email: "E-mail",
    phone: "Telefón",
    product: "Produkt",
    message: "Správa",
    submit: "Odoslať dopyt",
    success: "Ďakujeme. Váš dopyt bol zaznamenaný.",
    successDetail: "Ozveme sa vám s návrhom ukážky a pilotnej trasy.",
    reset: "Odoslať ďalší dopyt",
    optional: "nepovinné",
    required: "povinné",
    generalInquiry: "Všeobecný dopyt",
    note:
      "Formulár je v tejto verzii demonštračný — údaje sa neodosielajú na server.",
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
    },
  },
  footer: {
    copyright: "© 2026 PUDU Industrial Slovensko — koncept webovej prezentácie",
    tagline: "Autonómna logistika · Inteligentná výroba · Budúcnosť pohybu",
  },
  notFound: {
    title: "Stránka sa nenašla",
    description:
      "Trasa neexistuje alebo bola presmerovaná. Vráťte sa na úvod a pokračujte odtiaľ.",
    backHome: "Späť na úvod",
  },
};
