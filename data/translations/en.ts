import type { Translation } from "@/types/translation";

export const en: Translation = {
  meta: {
    siteName: "4IGV | PUDU Industrial",
    homeTitle: "PUDU Industrial | Autonomous logistics and industrial robots",
    homeDescription:
      "PUDU T150, T300 and T600 autonomous mobile robots for manufacturing, warehousing and intralogistics. Precise navigation, safe motion and a deployment that grows with you.",
    keywordsLabel:
      "autonomous mobile robots, AMR, intralogistics, industrial automation",
  },
  a11y: {
    skipToContent: "Skip to content",
    mainNavigation: "Main navigation",
    footerNavigation: "Footer navigation",
    languageSwitcher: "Language selection",
    currentLanguage: "Current language",
    switchTo: "Switch language to",
    productsSubmenu: "Products submenu",
    heroVisual: "Robot visualisation with a holographic interface",
    decorative: "Decorative element",
    currentPage: "Current page",
    galleryOpen: "View image full screen",
    galleryClose: "Close",
    galleryPrevious: "Previous image",
    galleryNext: "Next image",
    galleryCounter: "{index} of {total}",
    socialLinks: "Social networks",
  },
  navigation: {
    home: "Home",
    products: "Products",
    allProducts: "All products",
    technology: "Technology",
    solutions: "Solutions",
    contact: "Contact",
    language: "Language",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    requestDemo: "Request a demo",
  },
  units: {
    kg: "kg",
    hours: "hours",
    hoursShort: "h",
    cm: "cm",
    mm: "mm",
    mps: "m/s",
    percent: "%",
    upTo: "up to",
    chargingTemplate: "{hours} h to {percent}%",
  },
  specs: {
    payload: "Max.payload up to",
    runtime: "Total runtime",
    runtimeEmpty: "Runtime unloaded",
    runtimeLoaded: "Runtime fully loaded",
    clearance: "Minimum aisle width",
    clearanceShort: "Aisle width",
    speed: "Max. speed",
    dimensions: "Dimensions",
    charging: "Charging",
    lift: "Max. station height",
    navigation: "Navigation",
  },
  home: {
    hero: {
      eyebrow: "Next-generation industrial robotics",
      titleLine1: "Maximize,",
      titleLine2: "your logistics performance.",
      description:
        "Industrial autonomous mobile robots AMR T-series (Order 2 Person) for intralogistics automation transform material movement into a precise, safe, and uninterrupted flow from the point of origin to the point of consumption, ensuring maximum efficiency.",
      exploreProducts: "Discover our fleet",
      contactUs: "Request a consultation",
      statModels: "AMR T-Series models",
      statPayload: "payload range",
      statUptime: "ready for operation",
      hudStatus: "SYSTEM ONLINE",
      hudRoute: "AUTONOMOUS ROUTE / 04",
    },
    ticker: [
      "AUTONOMOUS SLAM NAVIGATION",
      "SAFE MOTION",
      "INTELLIGENT FLEET",
      "CONTINUOUS OPERATION",
    ],
    products: {
      titleLine1: "One fleet.",
      titleLine2: "Various aplications.",
      description:
        "Choose the AMR model that best suits your needs. All models are designed for real-world industrial operations and easy scalability.",
    },
    technology: {
      titleLine1: "Being flexible,",
      titleLine2: "is a guarantee of success.",
      description:
        "The AMR industrial autonomous mobile robots are user-friendly, allowing for immediate route setup and material transport. They are capable of avoiding obstacles and delivering materials to the required destination. The color display visualizes information, while the system communicates operator requests via voice prompts or music.",
      items: [
        {
          label: "01 / NAVIGATION",
          title: "Precision in motion",
          description:
            "VSLAM and LiDAR SLAM deliver stable localisation without guide tape or major changes to your operation.",
        },
        {
          label: "02 / SAFETY",
          title: "360° range",
          description:
            "Sensors, cameras, collision protection and emergency stop keep the shared space safe for people and machines.",
        },
        {
          label: "03 / INTEGRATION",
          title: "Connected production",
          description:
            "Elevators, automatic gates, peripheral equipment, and the enterprise ERP system integrate autonomous mobile robots (AMRs) into the entire logistics flow and adapt to customer requirements.",
        },
      ],
    },
    solutions: {
      eyebrow: "From a single robot to an entire fleet",
      title: "Automation that grows with you.",
      description:
        "Start with a single route, one type of load, and one robot. Then, add more tasks, routes, robots, or tow tractors. Plan new routes and paths to halls, production lines, and equipment without disrupting production. Our robots adapt to your requirements. Your investment, your quick return.",
      imageAlt: "AMR T600 Underride inside a holographic panel",
      items: [
        "Manufacturing and production line supply, material handling and transport",
        "Warehouses and distribution centres, retails",
        "Automotive and electronics",
        "Hospitals, laboratories, healthcare industry",
      ],
    },
    gallery: {
      titleLine1: "Our robots",
      titleLine2: "in real operation.",
      description:
        "Shots from customer deployments — manufacturing, warehousing and line supply.",
    },
  },
  product: {
    payload: "Payload",
    runtime: "Runtime",
    navigation: "Navigation",
    charging: "Charging",
    learnMore: "Learn more",
    featuredBadge: "Recommended",
    requestOffer: "Request a quote",
    specifications: "Technical specifications",
    features: "Key features",
    applications: "Applications",
    storyEyebrow: "Built for real operations",
    featuresTitleLine1: "Three layers",
    featuresTitleLine2: "of intelligence.",
    featuresDescription:
      "Every function is designed to simplify daily handling and create a predictable logistics flow.",
    applicationsTitle: "Applications.",
    applicationsDescription:
      "Typical scenarios where this AMR delivers the most value.",
    galleryTitle: "Spatial awareness in real operations",
    galleryDescription:
      "Scanning the surrounding environment keeps the mobile robot at a safe distance from people and peripheral equipment, ensuring maximum safety during material transport.",
    hudStatus: "AMR ONLINE",
    backToProducts: "Back to all products",
    previousModel: "Previous model",
    nextModel: "Next model",
    otherModels: "Other models",
    ctaTitle: "Better to see once than hear a hundred times.",
    ctaDescription:
      "Schedule a demonstration and a proposal for your pilot route at your company premises with us.",
    ctaButton: "Book a demo",
    sharedFeatures: [
      {
        label: "SAFETY",
        title: "Senses its surroundings",
        description:
          "Multi-layer obstacle detection lets the robot work safely in shared space with people.",
      },
      {
        label: "OPERATION",
        title: "Runs around the clock",
        description:
          "Automatic charging and careful energy management support all-day logistics efficiency.",
      },
      {
        label: "SCALING",
        title: "Grows into a fleet",
        description:
          "From a single route to a coordinated deployment across AMR robots, workplaces and enterprise systems.",
      },
    ],
  },
  contact: {
    eyebrow: "The future starts with the first route",
    title: "Let's automate your operation.",
    description: "Robot demo · Operations analysis · Deployment proposal",
    name: "Name",
    company: "Company",
    email: "Email",
    phone: "Phone",
    product: "Product",
    message: "Message",
    submit: "Send enquiry",
    success: "Thank you. Your enquiry has been recorded.",
    successDetail:
      "We will get back to you with a demo and pilot-route proposal.",
    reset: "Send another enquiry",
    optional: "optional",
    required: "required",
    generalInquiry: "General enquiry",
    placeholders: {
      name: "Full name",
      company: "Company name",
      email: "you@company.com",
      phone: "+421 900 000 000",
      message: "Describe your operation, load type and planned route.",
    },
    errors: {
      name: "Please enter your name.",
      email: "Please enter your email address.",
      emailInvalid: "Please enter a valid email address.",
      message: "Please write a short message.",
      summary: "Please check the highlighted fields.",
    },
  },
  footer: {
    copyright: "© 2026 PUDU Industrial — website presentation concept",
    tagline:
      "Autonomous logistics · Intelligent manufacturing · The future of movement",
  },
  notFound: {
    title: "Page not found",
    description:
      "This route does not exist or has been redirected. Go back to the start and continue from there.",
    backHome: "Back to the home page",
  },
};
