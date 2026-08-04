import type { Product, ProductSlug } from "@/types/product";

const IMAGES = {
  t150: {
    src: "/images/products/pudu-t150.webp",
    width: 2560,
    height: 1280,
    hasBackdrop: true,
  },
  t300: { src: "/images/products/pudu-t300.png", width: 5000, height: 3125 },
  t300Safety: {
    src: "/images/products/pudu-t300-safety.webp",
    width: 2400,
    height: 1350,
  },
  t600Upright: {
    src: "/images/products/pudu-t600-upright.png",
    width: 600,
    height: 720,
  },
  t600Underride: {
    src: "/images/products/pudu-t600-underride.png",
    width: 800,
    height: 960,
  },
} as const;

/**
 * Canonical order of the fleet — drives navigation, static params and the
 * previous/next links on product pages.
 */
export const products: Product[] = [
  {
    slug: "pudu-t150",
    heroImage: IMAGES.t150,
    payload: "150 kg",
    runtime: "12 h",
    clearance: "60 cm",
    navigation: "VSLAM + LiDAR",
    charging: "2 h / 90 %",
    specifications: [
      { key: "payload", value: { kind: "measure", amount: 150, unit: "kg" } },
      { key: "runtimeEmpty", value: { kind: "measure", amount: 12, unit: "hours" } },
      { key: "clearance", value: { kind: "measure", amount: 60, unit: "cm" } },
      {
        key: "speed",
        value: { kind: "measure", amount: 1.2, unit: "mps", upTo: true },
      },
      {
        key: "dimensions",
        value: { kind: "dimensions", width: 835, depth: 500, height: 1350 },
      },
      { key: "charging", value: { kind: "charging", hours: 2, percent: 90 } },
    ],
    translations: {
      sk: {
        name: "PUDU T150",
        category: "Ľahká intralogistika",
        headline: "Ľahký náklad. Maximálna plynulosť.",
        shortDescription:
          "Kompaktný priemyselný robot pre diely, komponenty a pravidelné logistické okruhy.",
        description:
          "Kompaktný priemyselný robot pre diely, komponenty a pravidelné logistické okruhy. Vďaka autonómnej navigácii, bezpečnostným vrstvám a možnosti integrácie sa prispôsobí existujúcemu prostrediu bez toho, aby výrobu nútil prispôsobiť sa robotu.",
        imageAlt: "Priemyselný robot PUDU T150 s prepravovaným nákladom",
        features: [
          {
            title: "Rýchle nasadenie",
            description:
              "Mapovanie a základné spustenie bez stavebných úprav alebo komplikovanej infraštruktúry.",
          },
          {
            title: "Presná navigácia",
            description:
              "Kombinácia VSLAM a LiDAR zabezpečuje stabilný pohyb v dynamickom priemyselnom prostredí.",
          },
          {
            title: "Prevádzka 24/7",
            description:
              "Výmena batérie, automatické aj káblové nabíjanie podporujú nepretržitú logistiku.",
          },
        ],
        applications: [
          {
            title: "Zásobovanie výrobných liniek",
            description:
              "Pravidelné doručovanie dielov a komponentov na montážne pracoviská.",
          },
          {
            title: "Interná preprava komponentov",
            description:
              "Opakované okruhy medzi skladom, prípravou materiálu a výrobou.",
          },
          {
            title: "Elektronika a presná výroba",
            description:
              "Šetrný transport citlivých dielov v úzkych a čistých priestoroch.",
          },
          {
            title: "Nemocnice a laboratóriá",
            description:
              "Diskrétny prevoz vzoriek, materiálu a spotrebného tovaru.",
          },
        ],
        seoTitle: "PUDU T150 | Ľahká intralogistika | PUDU Industrial",
        seoDescription:
          "PUDU T150 — kompaktný autonómny robot s nosnosťou 150 kg pre diely, komponenty a pravidelné logistické okruhy. Technické parametre, funkcie a oblasti využitia.",
      },
      cz: {
        name: "PUDU T150",
        category: "Lehká intralogistika",
        headline: "Lehký náklad. Maximální plynulost.",
        shortDescription:
          "Kompaktní průmyslový robot pro díly, komponenty a pravidelné logistické okruhy.",
        description:
          "Kompaktní průmyslový robot pro díly, komponenty a pravidelné logistické okruhy. Díky autonomní navigaci, bezpečnostním vrstvám a možnosti integrace se přizpůsobí existujícímu prostředí, aniž by výrobu nutil přizpůsobovat se robotu.",
        imageAlt: "Průmyslový robot PUDU T150 s přepravovaným nákladem",
        features: [
          {
            title: "Rychlé nasazení",
            description:
              "Mapování a základní spuštění bez stavebních úprav nebo komplikované infrastruktury.",
          },
          {
            title: "Přesná navigace",
            description:
              "Kombinace VSLAM a LiDAR zajišťuje stabilní pohyb v dynamickém průmyslovém prostředí.",
          },
          {
            title: "Provoz 24/7",
            description:
              "Výměna baterie, automatické i kabelové nabíjení podporují nepřetržitou logistiku.",
          },
        ],
        applications: [
          {
            title: "Zásobování výrobních linek",
            description:
              "Pravidelné doručování dílů a komponentů na montážní pracoviště.",
          },
          {
            title: "Interní přeprava komponentů",
            description:
              "Opakované okruhy mezi skladem, přípravou materiálu a výrobou.",
          },
          {
            title: "Elektronika a přesná výroba",
            description:
              "Šetrný transport citlivých dílů v úzkých a čistých prostorech.",
          },
          {
            title: "Nemocnice a laboratoře",
            description: "Diskrétní převoz vzorků, materiálu a spotřebního zboží.",
          },
        ],
        seoTitle: "PUDU T150 | Lehká intralogistika | PUDU Industrial",
        seoDescription:
          "PUDU T150 — kompaktní autonomní robot s nosností 150 kg pro díly, komponenty a pravidelné logistické okruhy. Technické parametry, funkce a oblasti využití.",
      },
      en: {
        name: "PUDU T150",
        category: "Light intralogistics",
        headline: "Light loads. Maximum flow.",
        shortDescription:
          "A compact industrial robot for parts, components and recurring logistics loops.",
        description:
          "A compact industrial robot for parts, components and recurring logistics loops. Autonomous navigation, layered safety and open integration let it adapt to your existing environment instead of forcing your operation to adapt to the robot.",
        imageAlt: "PUDU T150 industrial robot carrying a load",
        features: [
          {
            title: "Fast deployment",
            description:
              "Mapping and initial start-up without construction work or complicated infrastructure.",
          },
          {
            title: "Precise navigation",
            description:
              "VSLAM combined with LiDAR keeps motion stable in a dynamic industrial environment.",
          },
          {
            title: "24/7 operation",
            description:
              "Battery swap plus automatic and cable charging support uninterrupted logistics.",
          },
        ],
        applications: [
          {
            title: "Production line supply",
            description:
              "Regular delivery of parts and components to assembly workstations.",
          },
          {
            title: "Internal component transport",
            description:
              "Repeating loops between the warehouse, material preparation and production.",
          },
          {
            title: "Electronics and precision manufacturing",
            description:
              "Gentle transport of sensitive parts through narrow and clean spaces.",
          },
          {
            title: "Hospitals and laboratories",
            description:
              "Discreet transport of samples, materials and consumables.",
          },
        ],
        seoTitle: "PUDU T150 | Light intralogistics | PUDU Industrial",
        seoDescription:
          "PUDU T150 — a compact autonomous robot with a 150 kg payload for parts, components and recurring logistics loops. Specifications, features and applications.",
      },
    },
  },

  {
    slug: "pudu-t300",
    heroImage: IMAGES.t300,
    galleryImages: [IMAGES.t300Safety],
    payload: "300 kg",
    runtime: "12 h",
    clearance: "60 cm",
    navigation: "VSLAM + LiDAR",
    charging: "2 h / 90 %",
    specifications: [
      { key: "payload", value: { kind: "measure", amount: 300, unit: "kg" } },
      { key: "runtimeEmpty", value: { kind: "measure", amount: 12, unit: "hours" } },
      { key: "runtimeLoaded", value: { kind: "measure", amount: 8, unit: "hours" } },
      {
        key: "speed",
        value: { kind: "measure", amount: 1.2, unit: "mps", upTo: true },
      },
      {
        key: "dimensions",
        value: { kind: "dimensions", width: 835, depth: 500, height: 1350 },
      },
      { key: "charging", value: { kind: "charging", hours: 2, percent: 90 } },
    ],
    translations: {
      sk: {
        name: "PUDU T300",
        category: "Univerzálny AMR",
        headline: "Pohyb, ktorý sa prispôsobí výrobe.",
        shortDescription:
          "Flexibilný autonómny transport pre výrobu, sklady a zásobovanie liniek.",
        description:
          "Flexibilný autonómny transport pre výrobu, sklady a zásobovanie liniek. Vďaka autonómnej navigácii, bezpečnostným vrstvám a možnosti integrácie sa prispôsobí existujúcemu prostrediu bez toho, aby výrobu nútil prispôsobiť sa robotu.",
        imageAlt: "Priemyselný robot PUDU T300 s kartónovým nákladom",
        galleryAlt: "PUDU T300 skenuje okolie v skladovej hale",
        features: [
          {
            title: "Autonómna preprava",
            description:
              "Samostatne doručí materiál na zvolené miesto a dynamicky reaguje na zmeny trasy.",
          },
          {
            title: "Režim nasledovania",
            description:
              "Vizuálne rozpoznávanie umožňuje organizované nasledovanie pracovníka alebo ďalších robotov.",
          },
          {
            title: "Elektrická asistencia",
            description:
              "Pri manuálnom presune pomáha elektrický pohon a znižuje fyzickú námahu obsluhy.",
          },
        ],
        applications: [
          {
            title: "Výroba a montážne linky",
            description:
              "Autonómne zásobovanie pracovísk materiálom podľa taktu výroby.",
          },
          {
            title: "Sklady a distribučné centrá",
            description:
              "Preprava medzi príjmom, skladovými zónami a expedíciou bez obsluhy.",
          },
          {
            title: "Automotive a elektronika",
            description:
              "Stabilný tok komponentov v prostredí s vysokou vyťaženosťou trás.",
          },
          {
            title: "Zmiešaná prevádzka s ľuďmi",
            description:
              "Režim nasledovania a elektrická asistencia pri manuálnych úlohách.",
          },
        ],
        seoTitle: "PUDU T300 | Univerzálny AMR | PUDU Industrial",
        seoDescription:
          "PUDU T300 — univerzálny autonómny robot s nosnosťou 300 kg pre výrobu, sklady a zásobovanie liniek. Technické parametre, funkcie a oblasti využitia.",
      },
      cz: {
        name: "PUDU T300",
        category: "Univerzální AMR",
        headline: "Pohyb, který se přizpůsobí výrobě.",
        shortDescription:
          "Flexibilní autonomní transport pro výrobu, sklady a zásobování linek.",
        description:
          "Flexibilní autonomní transport pro výrobu, sklady a zásobování linek. Díky autonomní navigaci, bezpečnostním vrstvám a možnosti integrace se přizpůsobí existujícímu prostředí, aniž by výrobu nutil přizpůsobovat se robotu.",
        imageAlt: "Průmyslový robot PUDU T300 s kartonovým nákladem",
        galleryAlt: "PUDU T300 skenuje okolí ve skladové hale",
        features: [
          {
            title: "Autonomní přeprava",
            description:
              "Samostatně doručí materiál na zvolené místo a dynamicky reaguje na změny trasy.",
          },
          {
            title: "Režim následování",
            description:
              "Vizuální rozpoznávání umožňuje organizované následování pracovníka nebo dalších robotů.",
          },
          {
            title: "Elektrická asistence",
            description:
              "Při manuálním přesunu pomáhá elektrický pohon a snižuje fyzickou zátěž obsluhy.",
          },
        ],
        applications: [
          {
            title: "Výroba a montážní linky",
            description:
              "Autonomní zásobování pracovišť materiálem podle taktu výroby.",
          },
          {
            title: "Sklady a distribuční centra",
            description:
              "Přeprava mezi příjmem, skladovými zónami a expedicí bez obsluhy.",
          },
          {
            title: "Automotive a elektronika",
            description:
              "Stabilní tok komponentů v prostředí s vysokou vytížeností tras.",
          },
          {
            title: "Smíšený provoz s lidmi",
            description:
              "Režim následování a elektrická asistence při manuálních úlohách.",
          },
        ],
        seoTitle: "PUDU T300 | Univerzální AMR | PUDU Industrial",
        seoDescription:
          "PUDU T300 — univerzální autonomní robot s nosností 300 kg pro výrobu, sklady a zásobování linek. Technické parametry, funkce a oblasti využití.",
      },
      en: {
        name: "PUDU T300",
        category: "Versatile AMR",
        headline: "Movement that adapts to production.",
        shortDescription:
          "Flexible autonomous transport for manufacturing, warehouses and line supply.",
        description:
          "Flexible autonomous transport for manufacturing, warehouses and line supply. Autonomous navigation, layered safety and open integration let it adapt to your existing environment instead of forcing your operation to adapt to the robot.",
        imageAlt: "PUDU T300 industrial robot carrying a cardboard load",
        galleryAlt: "PUDU T300 scanning its surroundings inside a warehouse",
        features: [
          {
            title: "Autonomous transport",
            description:
              "Delivers material to the chosen location on its own and reacts dynamically to route changes.",
          },
          {
            title: "Follow mode",
            description:
              "Visual recognition allows organised following of a worker or of other robots.",
          },
          {
            title: "Powered assistance",
            description:
              "During manual moves the electric drive assists the operator and reduces physical strain.",
          },
        ],
        applications: [
          {
            title: "Manufacturing and assembly lines",
            description:
              "Autonomous material supply to workstations in line with the production cycle.",
          },
          {
            title: "Warehouses and distribution centres",
            description:
              "Unattended transport between goods-in, storage zones and dispatch.",
          },
          {
            title: "Automotive and electronics",
            description:
              "A stable flow of components in environments with heavily used routes.",
          },
          {
            title: "Shared operation with people",
            description:
              "Follow mode and powered assistance for the manual part of the job.",
          },
        ],
        seoTitle: "PUDU T300 | Versatile AMR | PUDU Industrial",
        seoDescription:
          "PUDU T300 — a versatile autonomous robot with a 300 kg payload for manufacturing, warehouses and line supply. Specifications, features and applications.",
      },
    },
  },

  {
    slug: "pudu-t600-upright",
    heroImage: IMAGES.t600Upright,
    payload: "600 kg",
    runtime: "12 h",
    clearance: "70 cm",
    navigation: "VSLAM + LiDAR",
    specifications: [
      { key: "payload", value: { kind: "measure", amount: 600, unit: "kg" } },
      { key: "runtime", value: { kind: "measure", amount: 12, unit: "hours" } },
      { key: "clearance", value: { kind: "measure", amount: 70, unit: "cm" } },
      {
        key: "speed",
        value: { kind: "measure", amount: 1.2, unit: "mps", upTo: true },
      },
      {
        key: "dimensions",
        value: { kind: "dimensions", width: 960, depth: 500, height: 1350 },
      },
      { key: "lift", value: { kind: "measure", amount: 60, unit: "mm" } },
    ],
    translations: {
      sk: {
        name: "PUDU T600 Upright",
        category: "Ťažký autonómny transport",
        headline: "Ťažká práca. Inteligentne.",
        shortDescription:
          "Vysokokapacitná platforma s ergonomickou rukoväťou pre bezpečný presun ťažkých nákladov.",
        description:
          "Vysokokapacitná platforma s ergonomickou rukoväťou pre bezpečný presun ťažkých nákladov. Vďaka autonómnej navigácii, bezpečnostným vrstvám a možnosti integrácie sa prispôsobí existujúcemu prostrediu bez toho, aby výrobu nútil prispôsobiť sa robotu.",
        imageAlt: "Priemyselný robot PUDU T600 Upright s ergonomickou rukoväťou",
        features: [
          {
            title: "Ťažký transport",
            description:
              "Nosnosť 600 kg prináša automatizáciu paliet, vozíkov a objemných výrobných nákladov.",
          },
          {
            title: "Asistencia obsluhe",
            description:
              "Ergonomický ovládač pomáha pracovníkovi jednoducho viesť robot aj s ťažkým nákladom.",
          },
          {
            title: "Otvorená integrácia",
            description:
              "Podpora protokolu VDA5050 a lokálneho nasadenia uľahčuje zapojenie do podnikových systémov.",
          },
        ],
        applications: [
          {
            title: "Ťažké výrobné náklady",
            description:
              "Presun paliet, vozíkov a objemných dielov v rámci celej prevádzky.",
          },
          {
            title: "Medzioperačná logistika",
            description:
              "Automatizácia dlhších trás s vysokou hmotnosťou prepravovaného nákladu.",
          },
          {
            title: "Automotive a strojárstvo",
            description:
              "Opakovaný transport ťažkých komponentov medzi pracoviskami a linkami.",
          },
          {
            title: "Integrácia do podnikových systémov",
            description:
              "Nasadenie v prostredí s protokolom VDA5050 a lokálnym riadením flotily.",
          },
        ],
        seoTitle: "PUDU T600 Upright | Ťažký autonómny transport | PUDU Industrial",
        seoDescription:
          "PUDU T600 Upright — autonómna platforma s nosnosťou 600 kg a ergonomickou rukoväťou pre bezpečný presun ťažkých nákladov. Technické parametre a oblasti využitia.",
      },
      cz: {
        name: "PUDU T600 Upright",
        category: "Těžký autonomní transport",
        headline: "Těžká práce. Inteligentně.",
        shortDescription:
          "Vysokokapacitní platforma s ergonomickou rukojetí pro bezpečný přesun těžkých nákladů.",
        description:
          "Vysokokapacitní platforma s ergonomickou rukojetí pro bezpečný přesun těžkých nákladů. Díky autonomní navigaci, bezpečnostním vrstvám a možnosti integrace se přizpůsobí existujícímu prostředí, aniž by výrobu nutil přizpůsobovat se robotu.",
        imageAlt: "Průmyslový robot PUDU T600 Upright s ergonomickou rukojetí",
        features: [
          {
            title: "Těžký transport",
            description:
              "Nosnost 600 kg přináší automatizaci palet, vozíků a objemných výrobních nákladů.",
          },
          {
            title: "Asistence obsluze",
            description:
              "Ergonomický ovladač pomáhá pracovníkovi snadno vést robota i s těžkým nákladem.",
          },
          {
            title: "Otevřená integrace",
            description:
              "Podpora protokolu VDA5050 a lokálního nasazení usnadňuje zapojení do podnikových systémů.",
          },
        ],
        applications: [
          {
            title: "Těžké výrobní náklady",
            description:
              "Přesun palet, vozíků a objemných dílů v rámci celého provozu.",
          },
          {
            title: "Mezioperační logistika",
            description:
              "Automatizace delších tras s vysokou hmotností přepravovaného nákladu.",
          },
          {
            title: "Automotive a strojírenství",
            description:
              "Opakovaný transport těžkých komponentů mezi pracovišti a linkami.",
          },
          {
            title: "Integrace do podnikových systémů",
            description:
              "Nasazení v prostředí s protokolem VDA5050 a lokálním řízením flotily.",
          },
        ],
        seoTitle: "PUDU T600 Upright | Těžký autonomní transport | PUDU Industrial",
        seoDescription:
          "PUDU T600 Upright — autonomní platforma s nosností 600 kg a ergonomickou rukojetí pro bezpečný přesun těžkých nákladů. Technické parametry a oblasti využití.",
      },
      en: {
        name: "PUDU T600 Upright",
        category: "Heavy-duty autonomous transport",
        headline: "Heavy work, handled intelligently.",
        shortDescription:
          "A high-capacity platform with an ergonomic handle for moving heavy loads safely.",
        description:
          "A high-capacity platform with an ergonomic handle for moving heavy loads safely. Autonomous navigation, layered safety and open integration let it adapt to your existing environment instead of forcing your operation to adapt to the robot.",
        imageAlt: "PUDU T600 Upright industrial robot with an ergonomic handle",
        features: [
          {
            title: "Heavy transport",
            description:
              "A 600 kg payload brings automation to pallets, trolleys and bulky production loads.",
          },
          {
            title: "Operator assistance",
            description:
              "The ergonomic control makes it easy to guide the robot even with a heavy load.",
          },
          {
            title: "Open integration",
            description:
              "VDA5050 support and on-premise deployment simplify the link to enterprise systems.",
          },
        ],
        applications: [
          {
            title: "Heavy production loads",
            description:
              "Moving pallets, trolleys and bulky parts across the whole operation.",
          },
          {
            title: "Inter-process logistics",
            description:
              "Automating longer routes that carry a high load weight.",
          },
          {
            title: "Automotive and mechanical engineering",
            description:
              "Repeated transport of heavy components between workplaces and lines.",
          },
          {
            title: "Enterprise system integration",
            description:
              "Deployment in environments with the VDA5050 protocol and local fleet control.",
          },
        ],
        seoTitle:
          "PUDU T600 Upright | Heavy-duty autonomous transport | PUDU Industrial",
        seoDescription:
          "PUDU T600 Upright — an autonomous platform with a 600 kg payload and an ergonomic handle for moving heavy loads safely. Specifications and applications.",
      },
    },
  },

  {
    slug: "pudu-t600-underride",
    heroImage: IMAGES.t600Underride,
    payload: "600 kg",
    runtime: "12 h",
    clearance: "65 cm",
    navigation: "LiDAR SLAM",
    specifications: [
      { key: "payload", value: { kind: "measure", amount: 600, unit: "kg" } },
      { key: "runtime", value: { kind: "measure", amount: 12, unit: "hours" } },
      { key: "clearance", value: { kind: "measure", amount: 65, unit: "cm" } },
      {
        key: "speed",
        value: { kind: "measure", amount: 1.2, unit: "mps", upTo: true },
      },
      {
        key: "dimensions",
        value: { kind: "dimensions", width: 845, depth: 500, height: 255 },
      },
      { key: "lift", value: { kind: "measure", amount: 60, unit: "mm" } },
    ],
    translations: {
      sk: {
        name: "PUDU T600 Underride",
        category: "Nízky zdvíhací AMR",
        headline: "Pod nákladom. Nad očakávaniami.",
        shortDescription:
          "Nízky autonómny podjazdový robot, ktorý sa zasunie pod regál, zdvihne ho a premiestni.",
        description:
          "Nízky autonómny podjazdový robot, ktorý sa zasunie pod regál, zdvihne ho a premiestni. Vďaka autonómnej navigácii, bezpečnostným vrstvám a možnosti integrácie sa prispôsobí existujúcemu prostrediu bez toho, aby výrobu nútil prispôsobiť sa robotu.",
        imageAlt: "Nízky podjazdový robot PUDU T600 Underride",
        features: [
          {
            title: "Podjazd pod regál",
            description:
              "Nízky profil umožňuje autonómny vjazd pod kompatibilný regál alebo vozík.",
          },
          {
            title: "Zdvih a transport",
            description:
              "Integrovaný zdvih 60 mm bezpečne prevezme náklad a presunie ho na určené miesto.",
          },
          {
            title: "Flotilová logistika",
            description:
              "Rozpoznávanie skupín regálov a koordinácia trás podporujú škálovateľnú automatizáciu skladu.",
          },
        ],
        applications: [
          {
            title: "Presun regálov a vozíkov",
            description:
              "Autonómny podjazd, zdvih a premiestnenie celej prepravnej jednotky.",
          },
          {
            title: "Skladová automatizácia",
            description:
              "Zmena tokov materiálu bez zásahu do existujúcej infraštruktúry.",
          },
          {
            title: "Výroba a medzisklad",
            description:
              "Presun rozpracovanej výroby medzi bunkami, linkami a odkladacími zónami.",
          },
          {
            title: "Flotilová logistika",
            description:
              "Koordinácia viacerých robotov a skupín regálov na jednej ploche.",
          },
        ],
        seoTitle: "PUDU T600 Underride | Nízky zdvíhací AMR | PUDU Industrial",
        seoDescription:
          "PUDU T600 Underride — nízky autonómny robot s nosnosťou 600 kg, ktorý podjazdí regál, zdvihne ho a premiestni. Technické parametre a oblasti využitia.",
      },
      cz: {
        name: "PUDU T600 Underride",
        category: "Nízký zdvihací AMR",
        headline: "Pod nákladem. Nad očekávání.",
        shortDescription:
          "Nízký autonomní podjezdový robot, který zajede pod regál, zvedne ho a přemístí.",
        description:
          "Nízký autonomní podjezdový robot, který zajede pod regál, zvedne ho a přemístí. Díky autonomní navigaci, bezpečnostním vrstvám a možnosti integrace se přizpůsobí existujícímu prostředí, aniž by výrobu nutil přizpůsobovat se robotu.",
        imageAlt: "Nízký podjezdový robot PUDU T600 Underride",
        features: [
          {
            title: "Podjezd pod regál",
            description:
              "Nízký profil umožňuje autonomní vjezd pod kompatibilní regál nebo vozík.",
          },
          {
            title: "Zdvih a transport",
            description:
              "Integrovaný zdvih 60 mm bezpečně převezme náklad a přesune ho na určené místo.",
          },
          {
            title: "Flotilová logistika",
            description:
              "Rozpoznávání skupin regálů a koordinace tras podporují škálovatelnou automatizaci skladu.",
          },
        ],
        applications: [
          {
            title: "Přesun regálů a vozíků",
            description:
              "Autonomní podjezd, zdvih a přemístění celé přepravní jednotky.",
          },
          {
            title: "Skladová automatizace",
            description:
              "Změna toků materiálu bez zásahu do existující infrastruktury.",
          },
          {
            title: "Výroba a mezisklad",
            description:
              "Přesun rozpracované výroby mezi buňkami, linkami a odkládacími zónami.",
          },
          {
            title: "Flotilová logistika",
            description:
              "Koordinace více robotů a skupin regálů na jedné ploše.",
          },
        ],
        seoTitle: "PUDU T600 Underride | Nízký zdvihací AMR | PUDU Industrial",
        seoDescription:
          "PUDU T600 Underride — nízký autonomní robot s nosností 600 kg, který zajede pod regál, zvedne ho a přemístí. Technické parametry a oblasti využití.",
      },
      en: {
        name: "PUDU T600 Underride",
        category: "Low-profile lifting AMR",
        headline: "Under the load. Above expectations.",
        shortDescription:
          "A low-profile autonomous robot that drives under a rack, lifts it and moves it.",
        description:
          "A low-profile autonomous robot that drives under a rack, lifts it and moves it. Autonomous navigation, layered safety and open integration let it adapt to your existing environment instead of forcing your operation to adapt to the robot.",
        imageAlt: "PUDU T600 Underride low-profile autonomous robot",
        features: [
          {
            title: "Drives under the rack",
            description:
              "The low profile allows autonomous entry underneath a compatible rack or trolley.",
          },
          {
            title: "Lift and transport",
            description:
              "The integrated 60 mm lift picks the load up safely and moves it to the target location.",
          },
          {
            title: "Fleet logistics",
            description:
              "Rack-group recognition and route coordination support scalable warehouse automation.",
          },
        ],
        applications: [
          {
            title: "Moving racks and trolleys",
            description:
              "Autonomous entry, lift and relocation of a complete transport unit.",
          },
          {
            title: "Warehouse automation",
            description:
              "Reshaping material flows without touching the existing infrastructure.",
          },
          {
            title: "Production and buffer storage",
            description:
              "Moving work in progress between cells, lines and staging areas.",
          },
          {
            title: "Fleet logistics",
            description:
              "Coordinating several robots and rack groups across a single floor.",
          },
        ],
        seoTitle: "PUDU T600 Underride | Low-profile lifting AMR | PUDU Industrial",
        seoDescription:
          "PUDU T600 Underride — a low-profile autonomous robot with a 600 kg payload that drives under a rack, lifts it and moves it. Specifications and applications.",
      },
    },
  },
];

/** Order used by the product grid on the home page (as in the original design). */
export const homeProductOrder: ProductSlug[] = [
  "pudu-t300",
  "pudu-t150",
  "pudu-t600-upright",
  "pudu-t600-underride",
];
