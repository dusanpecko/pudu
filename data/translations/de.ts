import type { Translation } from "@/types/translation";

export const de: Translation = {
  meta: {
    siteName: "4IGV | PUDU Industrial",
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
    galleryOpen: "Bild im Vollbild ansehen",
    galleryClose: "Schließen",
    galleryPrevious: "Vorheriges Bild",
    galleryNext: "Nächstes Bild",
    galleryCounter: "{index} von {total}",
    socialLinks: "Soziale Netzwerke",
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
    payload: "Max. praglast",
    runtime: "Total laufzeit",
    runtimeEmpty: "Laufzeit ohne Last",
    runtimeLoaded: "Laufzeit bei voller Last",
    clearance: "Mindestdurchfahrtsbreite",
    clearanceShort: "Durchfahrt",
    speed: "Max. geschwindigkeit",
    dimensions: "Abmessungen",
    charging: "Ladezeit",
    lift: "Max. hubhöhe",
    navigation: "Navigation",
  },
  home: {
    hero: {
      eyebrow: "Industrierobotik der neuen Generation",
      titleLine1: "Maximieren,",
      titleLine2: "Sie Ihre Logistikleistung.",
      description:
        "Die autonomen mobilen Industrieroboter AMR T-Series (Order 2 Person) für die Automatisierung der Intralogistik verwandeln den Materialtransport in einen präzisen, sicheren und unterbrechungsfreien Fluss vom Ursprungs- zum Verbrauchsort und gewährleisten so maximale effizienz.",
      exploreProducts: "Entdecken Sie unsere Flotte",
      contactUs: "Beratung anfordern",
      statModels: "AMR T-Series Modelle",
      statPayload: "Traglastbereich",
      statUptime: "bereit für den Dauerbetrieb",
      hudStatus: "SYSTEM ONLINE",
      hudRoute: "AUTONOME ROUTE / 04",
    },
    ticker: [
      "AUTONOME SLAM NAVIGATION",
      "SICHERE BEWEGUNG",
      "INTELLIGENTE FLOTTE",
      "DAUERBETRIEB",
    ],
    products: {
      titleLine1: "Eine Flotte.",
      titleLine2: "Verschiedene Optionen.",
      description:
        "Wählen Sie das AMR-Modell, das am besten zu Ihren Anforderungen passt. Alle Modelle sind für den industriellen Praxiseinsatz und eine einfache Skalierbarkeit ausgelegt.",
    },
    technology: {
      titleLine1: "Flexibilität ist",
      titleLine2: "ein Erfolgsgarant.",
      description:
        "Die autonomen mobilen Industrieroboter der AMR-Reihe zeichnen sich durch Benutzerfreundlichkeit aus und ermöglichen die sofortige Routeneinrichtung sowie den Materialtransport. Sie können Hindernissen ausweichen und Materialien an den gewünschten Zielort befördern. Ein Farbdisplay visualisiert Informationen, während das System Anweisungen des Bedieners über Sprachansagen oder Musik kommuniziert.",
      items: [
        {
          label: "01 / NAVIGATION",
          title: "Präzision in Bewegung",
          description:
            "VSLAM und LiDAR SLAM sorgen für eine stabile Lokalisierung — ohne Leitband und ohne größere Eingriffe in den Betrieb.",
        },
        {
          label: "02 / SICHERHEIT",
          title: "360°- Reichweite",
          description:
            "Sensoren, Kameras, Kollisionsschutz und Nothalt halten den gemeinsamen Raum für Menschen und Maschinen sicher.",
        },
        {
          label: "03 / INTEGRATION",
          title: "Vernetzte Produktion",
          description:
            "Aufzüge, automatische Tore, Peripheriegeräte und das ERP-System des Unternehmens integrieren autonome mobile Roboter (AMRs) in den gesamten Logistikfluss und passen sich an die Kundenanforderungen an.",
        },
      ],
    },
    solutions: {
      eyebrow: "Von einem Roboter zur ganzen Flotte",
      title: "Automatisierung, die mit Ihnen wächst.",
      description:
        "Beginnen Sie mit einer einzigen Route, einer Lastart und einem Roboter. Ergänzen Sie anschließend weitere Aufgaben, Routen, Roboter oder Schlepper. Planen Sie neue Routen und Wege zu Hallen, Fertigungslinien und Anlagen, ohne die Produktion zu unterbrechen. Unsere Roboter passen sich Ihren Anforderungen an. Ihre Investition, Ihre schnelle Amortisation.",
      imageAlt: "AMR T600 Underride im holografischen Panel",
      items: [
        "Versorgung von Fertigungs- und Produktionslinien, Materialhandling und Transport",
        "Lager- und Verteilzentren, Einzelhandel",
        "Automotive und Elektronik",
        "Krankenhäuser, Labore, Gesundheitsbranche",
      ],
    },
    gallery: {
      titleLine1: "Unsere Roboter",
      titleLine2: "im realen Einsatz.",
      description:
        "Aufnahmen aus Kundeneinsätzen — Fertigung, Lager und Linienversorgung.",
    },
  },
  product: {
    payload: "Traglast",
    runtime: "Laufzeit",
    navigation: "Navigation",
    charging: "Ladezeit",
    learnMore: "Mehr erfahren",
    featuredBadge: "Empfehlung",
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
      "Typische Szenarien, in denen dieses AMR den größten Nutzen bringt.",
    galleryTitle: "Raumwahrnehmung im realen Betrieb",
    galleryDescription:
      "Das Abtasten der Umgebung hält den mobilen Roboter auf sicherem Abstand zu Personen und Peripheriegeräten und gewährleistet so maximale Sicherheit beim Materialtransport.",
    hudStatus: "AMR ONLINE",
    backToProducts: "Zurück zu allen Produkten",
    previousModel: "Vorheriges Modell",
    nextModel: "Nächstes Modell",
    otherModels: "Weitere Modelle",
    ctaTitle: "Lieber einmal sehen als hundertmal hören.",
    ctaDescription:
      "Vereinbaren Sie mit uns einen Termin für eine Vorführung und die Erstellung eines Angebots für Ihre Pilotstrecke direkt bei Ihnen im Unternehmen.",
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
          "Von einer einzelnen Route bis zum koordinierten Einsatz mehrerer AMR roboter, Arbeitsplätze und Unternehmenssysteme.",
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
