import type { Translation } from "@/types/translation";

export const en: Translation = {
  meta: {
    siteName: "PUDU Industrial",
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
    payload: "Payload",
    runtime: "Runtime",
    runtimeEmpty: "Runtime unloaded",
    runtimeLoaded: "Runtime fully loaded",
    clearance: "Minimum aisle width",
    clearanceShort: "Aisle width",
    speed: "Speed",
    dimensions: "Dimensions",
    charging: "Charging",
    lift: "Lift",
    navigation: "Navigation",
  },
  home: {
    hero: {
      eyebrow: "Next-generation industrial robotics",
      titleLine1: "Logistics",
      titleLine2: "that thinks.",
      description:
        "PUDU autonomous mobile robots turn material movement into a precise, safe and uninterrupted flow — from light components to 600-kilogram loads.",
      exploreProducts: "Explore the fleet",
      contactUs: "Design a solution",
      statModels: "models available",
      statPayload: "payload range",
      statUptime: "ready for operation",
      hudStatus: "SYSTEM ONLINE",
      hudRoute: "AUTONOMOUS ROUTE / 04",
    },
    ticker: [
      "AUTONOMOUS NAVIGATION",
      "SAFE MOTION",
      "INTELLIGENT FLEET",
      "CONTINUOUS OPERATION",
    ],
    products: {
      titleLine1: "One fleet.",
      titleLine2: "Four capabilities.",
      description:
        "Choose a robot by load weight, handling method and available space. Every model is built for real industrial operation and straightforward scaling.",
    },
    technology: {
      titleLine1: "Technology",
      titleLine2: "that stays out of the way.",
      description:
        "The robots sense their surroundings, avoid obstacles, talk to building systems and work naturally alongside people.",
      items: [
        {
          label: "01 / NAVIGATION",
          title: "Precision in motion",
          description:
            "VSLAM and LiDAR SLAM deliver stable localisation without guide tape or major changes to your operation.",
        },
        {
          label: "02 / SAFETY",
          title: "360° awareness",
          description:
            "Sensors, cameras, collision protection and emergency stop keep the shared space safe for people and machines.",
        },
        {
          label: "03 / INTEGRATION",
          title: "Connected production",
          description:
            "Lifts, automatic doors, pagers, PUDU Link and enterprise interfaces connect the robots to your entire logistics flow.",
        },
      ],
    },
    solutions: {
      eyebrow: "From a single robot to an entire fleet",
      title: "Automation that grows with you.",
      description:
        "Start with one route, one load type and one robot. Then add tasks, racks, production lines and equipment without rethinking the whole concept.",
      imageAlt: "PUDU T600 Underride inside a holographic panel",
      items: [
        "Manufacturing and line supply",
        "Warehouses and distribution centres",
        "Automotive and electronics",
        "Hospitals and laboratories",
      ],
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
      "Typical scenarios where this model delivers the most value.",
    galleryTitle: "Spatial awareness in real operations",
    galleryDescription:
      "Real-time scanning of the surroundings keeps the robot at a safe distance from people, racks and trolleys.",
    hudStatus: "AMR ONLINE",
    backToProducts: "Back to all products",
    previousModel: "Previous model",
    nextModel: "Next model",
    otherModels: "Other models",
    ctaTitle: "Seeing the robot beats reading about it.",
    ctaDescription:
      "Book a demo and a pilot-route proposal for your own operation.",
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
          "Automatic charging and careful energy management support all-day logistics scenarios.",
      },
      {
        label: "SCALING",
        title: "Grows into a fleet",
        description:
          "From a single route to a coordinated deployment across robots, workplaces and enterprise systems.",
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
    note:
      "In this version the form is a demonstration — no data is sent to a server.",
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
