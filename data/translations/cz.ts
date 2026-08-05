import type { Translation } from "@/types/translation";

export const cz: Translation = {
  meta: {
    siteName: "PUDU Industrial",
    homeTitle: "PUDU Industrial | Autonomní logistika a průmyslové roboty",
    homeDescription:
      "Autonomní mobilní roboty PUDU T150, T300 a T600 pro výrobu, sklady a intralogistiku. Přesná navigace, bezpečný pohyb a nasazení, které roste s vámi.",
    keywordsLabel:
      "autonomní roboty, AMR, intralogistika, průmyslová automatizace",
  },
  a11y: {
    skipToContent: "Přeskočit na obsah",
    mainNavigation: "Hlavní navigace",
    footerNavigation: "Navigace v zápatí",
    languageSwitcher: "Volba jazyka",
    currentLanguage: "Aktuální jazyk",
    switchTo: "Přepnout na jazyk",
    productsSubmenu: "Podmenu produktů",
    heroVisual: "Vizualizace robota s holografickým rozhraním",
    decorative: "Dekorativní prvek",
    currentPage: "Aktuální stránka",
  },
  navigation: {
    home: "Domů",
    products: "Produkty",
    allProducts: "Všechny produkty",
    technology: "Technologie",
    solutions: "Řešení",
    contact: "Kontakt",
    language: "Jazyk",
    openMenu: "Otevřít menu",
    closeMenu: "Zavřít menu",
    requestDemo: "Požádat o ukázku",
  },
  units: {
    kg: "kg",
    hours: "hodin",
    hoursShort: "h",
    cm: "cm",
    mm: "mm",
    mps: "m/s",
    percent: "%",
    upTo: "do",
    chargingTemplate: "{hours} h na {percent} %",
  },
  specs: {
    payload: "Nosnost",
    runtime: "Výdrž",
    runtimeEmpty: "Výdrž bez nákladu",
    runtimeLoaded: "Výdrž s plným nákladem",
    clearance: "Minimální průchod",
    clearanceShort: "Průchod",
    speed: "Rychlost",
    dimensions: "Rozměry",
    charging: "Nabíjení",
    lift: "Zdvih",
    navigation: "Navigace",
  },
  home: {
    hero: {
      eyebrow: "Průmyslová robotika nové generace",
      titleLine1: "Logistika,",
      titleLine2: "která myslí.",
      description:
        "Autonomní mobilní roboty PUDU mění pohyb materiálu na přesný, bezpečný a nepřerušovaný tok. Od lehkých komponentů až po 600kilogramové náklady.",
      exploreProducts: "Objevit flotilu",
      contactUs: "Navrhnout řešení",
      statModels: "modely v nabídce",
      statPayload: "rozsah nosnosti",
      statUptime: "připraveno k provozu",
      hudStatus: "SYSTÉM ONLINE",
      hudRoute: "AUTONOMNÍ TRASA / 04",
    },
    ticker: [
      "AUTONOMNÍ NAVIGACE",
      "BEZPEČNÝ POHYB",
      "INTELIGENTNÍ FLOTILA",
      "NEPŘETRŽITÝ PROVOZ",
    ],
    products: {
      titleLine1: "Jedna flotila.",
      titleLine2: "Čtyři schopnosti.",
      description:
        "Vyberte robota podle hmotnosti nákladu, způsobu manipulace a dostupného prostoru. Všechny modely jsou navržené pro reálný průmyslový provoz a snadné škálování.",
    },
    technology: {
      titleLine1: "Technologie,",
      titleLine2: "která nepřekáží.",
      description:
        "Roboty vnímají prostor, vyhýbají se překážkám, komunikují se systémy budovy a přirozeně spolupracují s lidmi.",
      items: [
        {
          label: "01 / NAVIGACE",
          title: "Přesnost v pohybu",
          description:
            "VSLAM a LiDAR SLAM vytvářejí stabilní lokalizaci bez vodicí pásky nebo rozsáhlých zásahů do provozu.",
        },
        {
          label: "02 / BEZPEČNOST",
          title: "360° vnímání",
          description:
            "Senzory, kamery, ochrana proti kolizi a nouzové zastavení vytvářejí bezpečný prostor pro lidi i stroje.",
        },
        {
          label: "03 / INTEGRACE",
          title: "Propojená výroba",
          description:
            "Výtahy, automatické brány, pagery, PUDU Link a podniková rozhraní spojují roboty s celým logistickým tokem.",
        },
      ],
    },
    solutions: {
      eyebrow: "Od jednoho robota k celé flotile",
      title: "Automatizace, která roste s vámi.",
      description:
        "Začněte jednou trasou, jedním typem nákladu a jedním robotem. Postupně přidávejte další úlohy, regály, výrobní linky a zařízení bez změny celé koncepce.",
      imageAlt: "PUDU T600 Underride v holografickém panelu",
      items: [
        "Výroba a zásobování linek",
        "Sklady a distribuční centra",
        "Automotive a elektronika",
        "Nemocnice a laboratoře",
      ],
    },
  },
  product: {
    payload: "Nosnost",
    runtime: "Výdrž",
    navigation: "Navigace",
    charging: "Nabíjení",
    learnMore: "Zjistit více",
    requestOffer: "Vyžádat nabídku",
    specifications: "Technické parametry",
    features: "Hlavní funkce",
    applications: "Oblasti využití",
    storyEyebrow: "Navržený pro skutečný provoz",
    featuresTitleLine1: "Tři vrstvy",
    featuresTitleLine2: "inteligence.",
    featuresDescription:
      "Každá funkce je navržená tak, aby zjednodušila každodenní manipulaci a vytvořila předvídatelný logistický tok.",
    applicationsTitle: "Oblasti využití.",
    applicationsDescription:
      "Typické scénáře, ve kterých model přináší největší přínos.",
    galleryTitle: "Vnímání prostoru v reálném provozu",
    galleryDescription:
      "Skenování okolí v reálném čase udržuje robota v bezpečné vzdálenosti od lidí, regálů i vozíků.",
    hudStatus: "AMR ONLINE",
    backToProducts: "Zpět na všechny produkty",
    previousModel: "Předchozí model",
    nextModel: "Další model",
    otherModels: "Další modely",
    ctaTitle: "Vidět robota je lepší než o něm číst.",
    ctaDescription:
      "Sjednejte si ukázku a návrh pilotní trasy ve vašem provozu.",
    ctaButton: "Sjednat ukázku",
    sharedFeatures: [
      {
        label: "BEZPEČNOST",
        title: "Vnímá okolí",
        description:
          "Víceúrovňová detekce překážek pomáhá robotu bezpečně pracovat ve společném prostoru s lidmi.",
      },
      {
        label: "PROVOZ",
        title: "Pracuje nepřetržitě",
        description:
          "Automatické nabíjení a promyšlený energetický management podporují celodenní logistické scénáře.",
      },
      {
        label: "ŠKÁLOVÁNÍ",
        title: "Roste do flotily",
        description:
          "Od jedné trasy ke koordinovanému nasazení více robotů, pracovišť a podnikových systémů.",
      },
    ],
  },
  contact: {
    eyebrow: "Budoucnost začíná první trasou",
    title: "Pojďme automatizovat váš provoz.",
    description: "Ukázka robota · Analýza provozu · Návrh nasazení",
    name: "Jméno",
    company: "Firma",
    email: "E-mail",
    phone: "Telefon",
    product: "Produkt",
    message: "Zpráva",
    submit: "Odeslat dotaz",
    success: "Děkujeme. Váš dotaz byl zaznamenán.",
    successDetail: "Ozveme se vám s návrhem ukázky a pilotní trasy.",
    reset: "Odeslat další dotaz",
    optional: "nepovinné",
    required: "povinné",
    generalInquiry: "Obecný dotaz",
    note:
      "Formulář je v této verzi demonstrační — údaje se neodesílají na server.",
    placeholders: {
      name: "Jméno a příjmení",
      company: "Název firmy",
      email: "vas@email.cz",
      phone: "+420 900 000 000",
      message: "Popište provoz, typ nákladu a plánovanou trasu.",
    },
    errors: {
      name: "Zadejte své jméno.",
      email: "Zadejte e-mailovou adresu.",
      emailInvalid: "Zadejte platnou e-mailovou adresu.",
      message: "Napište krátkou zprávu.",
      summary: "Zkontrolujte prosím vyznačená pole.",
    },
  },
  footer: {
    copyright: "© 2026 PUDU Industrial — koncept webové prezentace",
    tagline: "Autonomní logistika · Inteligentní výroba · Budoucnost pohybu",
  },
  notFound: {
    title: "Stránka nebyla nalezena",
    description:
      "Trasa neexistuje nebo byla přesměrována. Vraťte se na úvod a pokračujte odtud.",
    backHome: "Zpět na úvod",
  },
};
