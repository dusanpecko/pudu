import type { Translation } from "@/types/translation";

export const de: Translation = {
  meta: {
    siteName: "PUDU Industrial",
    homeTitle: "PUDU Industrial | Autonome Logistik und Industrieroboter",
    homeDescription:
      "Autonome mobile Roboter PUDU T150, T300 und T600 für Produktion, Lager und Intralogistik. Präzise Navigation, sichere Bewegung und ein Einsatz, der mit Ihnen wächst.",
    keywordsLabel:
      "autonome mobile Roboter, AMR, Intralogistik, Industrieautomatisierung",
  },
  a11y: {
    skipToContent: "Zum Inhalt springen",
    mainNavigation: "Hauptnavigation",
    footerNavigation: "Navigation im Fußbereich",
    languageSwitcher: "Sprachauswahl",
    currentLanguage: "Aktuelle Sprache",
    switchTo: "Sprache wechseln zu",
    productsSubmenu: "Untermenü Produkte",
    heroVisual: "Roboter-Visualisierung mit holografischer Oberfläche",
    decorative: "Dekoratives Element",
    currentPage: "Aktuelle Seite",
  },
  navigation: {
    home: "Startseite",
    products: "Produkte",
    allProducts: "Alle Produkte",
    technology: "Technologie",
    solutions: "Lösungen",
    contact: "Kontakt",
    language: "Sprache",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    requestDemo: "Demo anfragen",
  },
  units: {
    kg: "kg",
    hours: "Stunden",
    hoursShort: "h",
    cm: "cm",
    mm: "mm",
    mps: "m/s",
    percent: "%",
    upTo: "bis zu",
    chargingTemplate: "{hours} h auf {percent} %",
  },
  specs: {
    payload: "Traglast",
    runtime: "Laufzeit",
    runtimeEmpty: "Laufzeit ohne Last",
    runtimeLoaded: "Laufzeit bei voller Last",
    clearance: "Mindestdurchfahrtsbreite",
    clearanceShort: "Durchfahrt",
    speed: "Geschwindigkeit",
    dimensions: "Abmessungen",
    charging: "Ladezeit",
    lift: "Hubhöhe",
    navigation: "Navigation",
  },
  home: {
    hero: {
      eyebrow: "Industrierobotik der neuen Generation",
      titleLine1: "Logistik,",
      titleLine2: "die denkt.",
      description:
        "Autonome mobile Roboter von PUDU verwandeln den Materialfluss in einen präzisen, sicheren und unterbrechungsfreien Ablauf — von leichten Bauteilen bis zu Lasten von 600 Kilogramm.",
      exploreProducts: "Flotte entdecken",
      contactUs: "Lösung entwerfen",
      statModels: "Modelle im Programm",
      statPayload: "Traglastbereich",
      statUptime: "bereit für den Dauerbetrieb",
      hudStatus: "SYSTEM ONLINE",
      hudRoute: "AUTONOME ROUTE / 04",
    },
    ticker: [
      "AUTONOME NAVIGATION",
      "SICHERE BEWEGUNG",
      "INTELLIGENTE FLOTTE",
      "DAUERBETRIEB",
    ],
    products: {
      titleLine1: "Eine Flotte.",
      titleLine2: "Vier Fähigkeiten.",
      description:
        "Wählen Sie den Roboter nach Lastgewicht, Handhabung und verfügbarem Platz. Jedes Modell ist für den realen Industriebetrieb und einfache Skalierung ausgelegt.",
    },
    technology: {
      titleLine1: "Technologie,",
      titleLine2: "die nicht im Weg steht.",
      description:
        "Die Roboter erfassen ihre Umgebung, weichen Hindernissen aus, kommunizieren mit der Gebäudetechnik und arbeiten selbstverständlich mit Menschen zusammen.",
      items: [
        {
          label: "01 / NAVIGATION",
          title: "Präzision in Bewegung",
          description:
            "VSLAM und LiDAR SLAM sorgen für eine stabile Lokalisierung — ohne Leitband und ohne größere Eingriffe in den Betrieb.",
        },
        {
          label: "02 / SICHERHEIT",
          title: "360°-Wahrnehmung",
          description:
            "Sensoren, Kameras, Kollisionsschutz und Nothalt halten den gemeinsamen Raum für Menschen und Maschinen sicher.",
        },
        {
          label: "03 / INTEGRATION",
          title: "Vernetzte Produktion",
          description:
            "Aufzüge, automatische Tore, Pager, PUDU Link und Unternehmensschnittstellen verbinden die Roboter mit Ihrem gesamten Logistikfluss.",
        },
      ],
    },
    solutions: {
      eyebrow: "Von einem Roboter zur ganzen Flotte",
      title: "Automatisierung, die mit Ihnen wächst.",
      description:
        "Beginnen Sie mit einer Route, einer Lastart und einem Roboter. Danach kommen weitere Aufgaben, Regale, Produktionslinien und Anlagen hinzu — ohne das gesamte Konzept zu ändern.",
      imageAlt: "PUDU T600 Underride im holografischen Panel",
      items: [
        "Produktion und Linienversorgung",
        "Lager und Distributionszentren",
        "Automotive und Elektronik",
        "Krankenhäuser und Labore",
      ],
    },
  },
  product: {
    payload: "Traglast",
    runtime: "Laufzeit",
    navigation: "Navigation",
    charging: "Ladezeit",
    learnMore: "Mehr erfahren",
    requestOffer: "Angebot anfragen",
    specifications: "Technische Daten",
    features: "Hauptfunktionen",
    applications: "Einsatzbereiche",
    storyEyebrow: "Für den realen Betrieb entwickelt",
    featuresTitleLine1: "Drei Ebenen",
    featuresTitleLine2: "der Intelligenz.",
    featuresDescription:
      "Jede Funktion ist darauf ausgelegt, die tägliche Handhabung zu vereinfachen und einen vorhersehbaren Logistikfluss zu schaffen.",
    applicationsTitle: "Einsatzbereiche.",
    applicationsDescription:
      "Typische Szenarien, in denen dieses Modell den größten Nutzen bringt.",
    galleryTitle: "Raumwahrnehmung im realen Betrieb",
    galleryDescription:
      "Das Scannen der Umgebung in Echtzeit hält den Roboter auf sicherem Abstand zu Menschen, Regalen und Wagen.",
    hudStatus: "AMR ONLINE",
    backToProducts: "Zurück zu allen Produkten",
    previousModel: "Vorheriges Modell",
    nextModel: "Nächstes Modell",
    otherModels: "Weitere Modelle",
    ctaTitle: "Den Roboter zu sehen ist besser, als über ihn zu lesen.",
    ctaDescription:
      "Vereinbaren Sie eine Demo und einen Vorschlag für eine Pilotroute in Ihrem Betrieb.",
    ctaButton: "Demo vereinbaren",
    sharedFeatures: [
      {
        label: "SICHERHEIT",
        title: "Erfasst die Umgebung",
        description:
          "Mehrstufige Hindernisserkennung lässt den Roboter sicher im gemeinsamen Raum mit Menschen arbeiten.",
      },
      {
        label: "BETRIEB",
        title: "Arbeitet rund um die Uhr",
        description:
          "Automatisches Laden und durchdachtes Energiemanagement tragen ganztägige Logistikszenarien.",
      },
      {
        label: "SKALIERUNG",
        title: "Wächst zur Flotte",
        description:
          "Von einer einzelnen Route bis zum koordinierten Einsatz mehrerer Roboter, Arbeitsplätze und Unternehmenssysteme.",
      },
    ],
  },
  contact: {
    eyebrow: "Die Zukunft beginnt mit der ersten Route",
    title: "Automatisieren wir Ihren Betrieb.",
    description: "Roboter-Demo · Betriebsanalyse · Einsatzkonzept",
    name: "Name",
    company: "Firma",
    email: "E-Mail",
    phone: "Telefon",
    product: "Produkt",
    message: "Nachricht",
    submit: "Anfrage senden",
    success: "Danke. Ihre Anfrage wurde erfasst.",
    successDetail:
      "Wir melden uns mit einem Vorschlag für eine Demo und eine Pilotroute.",
    reset: "Weitere Anfrage senden",
    optional: "optional",
    required: "erforderlich",
    generalInquiry: "Allgemeine Anfrage",
    note:
      "In dieser Version ist das Formular eine Demonstration — es werden keine Daten an einen Server gesendet.",
    placeholders: {
      name: "Vor- und Nachname",
      company: "Firmenname",
      email: "ihr@firma.de",
      phone: "+49 30 000000",
      message:
        "Beschreiben Sie Ihren Betrieb, die Lastart und die geplante Route.",
    },
    errors: {
      name: "Bitte geben Sie Ihren Namen ein.",
      email: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
      emailInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      message: "Bitte schreiben Sie eine kurze Nachricht.",
      summary: "Bitte prüfen Sie die markierten Felder.",
    },
  },
  footer: {
    copyright: "© 2026 PUDU Industrial — Konzept einer Website-Präsentation",
    tagline:
      "Autonome Logistik · Intelligente Produktion · Die Zukunft der Bewegung",
  },
  notFound: {
    title: "Seite nicht gefunden",
    description:
      "Diese Route existiert nicht oder wurde umgeleitet. Kehren Sie zum Start zurück und fahren Sie von dort fort.",
    backHome: "Zurück zur Startseite",
  },
};
