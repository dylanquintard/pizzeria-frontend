export const DEFAULT_TOUR_CITIES = ["Thionville", "Metz"];

const SPECIAL_CITY_PATHS = {
  thionville: "/pizza-napolitaine-thionville",
  metz: "/pizza-napolitaine-metz",
  moselle: "/food-truck-pizza-moselle",
};

export function slugifyCity(city) {
  return String(city || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCityPath(city) {
  const slug = slugifyCity(city);
  if (!slug) return "/food-truck-pizza-moselle";
  return SPECIAL_CITY_PATHS[slug] || `/pizza-${slug}`;
}

export const SEO_KEYWORDS_SENTENCES = [
  "pizza napolitaine artisanale",
  "pizza napolitaine feu de bois",
  "camion pizza napolitaine",
  "pizza italienne traditionnelle",
  "pizza a emporter",
  "camion pizza thionville",
  "pizza artisanale moselle",
  "pizza napolitaine metz",
  "pizza feu de bois thionville",
  "pizza produits italiens",
];

export const LOCAL_PAGE_CONTENT = {
  thionville: {
    pathname: "/pizza-napolitaine-thionville",
    title: "Pizza napolitaine proche de Thionville | Camion pizza artisanal",
    description:
      "Pizza napolitaine artisanale proche de Thionville: cuisson bois-gaz, produits italiens selectionnes et retrait rapide au camion.",
    h1: "Pizza napolitaine artisanale autour de Thionville",
    intro:
      "Vous cherchez une pizza napolitaine proche de Thionville ? Notre camion pizza propose une carte artisanale, avec une pate travaillee dans l'esprit napolitain et des ingredients italiens reconnus.",
    sections: [
      {
        heading: "Une pizza inspiree de Naples",
        paragraphs: [
          "La base repose sur une fermentation en deux temps et une execution minute au camion pour garder texture, legerete et regularite.",
          "Nous utilisons notamment farine Nuvola Super, tomates San Marzano, mozzarella fior di latte, parmigiano reggiano et charcuteries italiennes.",
        ],
      },
      {
        heading: "Camion pizza dans la region",
        paragraphs: [
          "Le camion se deplace sur plusieurs points de passage autour de Thionville selon le planning de la semaine.",
          "Les adresses et horaires evoluent selon la tournee, avec un fonctionnement simple: commande puis retrait direct au camion.",
        ],
      },
      {
        heading: "Commande simple, retrait rapide",
        paragraphs: [
          "Le service est 100% a emporter pour garder une organisation fluide sur les creneaux.",
          "Vous pouvez commander en ligne ou sur place selon disponibilite, puis recuperer une pizza chaude prete a deguster.",
        ],
      },
    ],
  },
  metz: {
    pathname: "/pizza-napolitaine-metz",
    title: "Pizza napolitaine proche de Metz | Camion pizza artisanal",
    description:
      "Pizza napolitaine artisanale proche de Metz: camion pizza, produits italiens, cuisson bois-gaz et retrait rapide.",
    h1: "Pizza napolitaine artisanale autour de Metz",
    intro:
      "Autour de Metz, notre camion pizza propose des recettes napolitaines travaillees avec des produits italiens et une cuisson maitrisee au four bois-gaz.",
    sections: [
      {
        heading: "Une pizza inspiree de la tradition napolitaine",
        paragraphs: [
          "La pate est preparee pour offrir une base souple, une corniche aerienne et un bon equilibre en bouche.",
          "Les ingredients sont choisis pour leur regularite: farine Nuvola Super, tomates San Marzano, mozzarella fior di latte, parmigiano reggiano et charcuteries italiennes.",
        ],
      },
      {
        heading: "Camion pizza autour de Metz",
        paragraphs: [
          "Notre camion pizza se deplace dans differents secteurs proches de Metz et du nord mosellan.",
          "Chaque semaine, la tournee precise les points de retrait et les horaires disponibles.",
        ],
      },
      {
        heading: "Retrait rapide et pizzas fraiches",
        paragraphs: [
          "Les pizzas sont preparees a la commande pour conserver qualite et temperature au moment du service.",
          "Le retrait se fait directement au camion avec peu d'attente, sur creneau clair.",
        ],
      },
    ],
  },
  moselle: {
    pathname: "/food-truck-pizza-moselle",
    title: "Food truck pizza en Moselle | Pizza napolitaine artisanale",
    description:
      "Food truck pizza en Moselle: pizzas napolitaines artisanales, produits italiens, cuisson bois-gaz et retrait rapide.",
    h1: "Food truck pizza en Moselle",
    intro:
      "Notre camion pizza napolitaine couvre plusieurs communes de Moselle avec une offre artisanale, des ingredients italiens et un service de retrait efficace.",
    sections: [
      {
        heading: "Une tournee locale dans le nord mosellan",
        paragraphs: [
          "La tournee passe par differents points autour de Thionville, Metz et des villes voisines selon la semaine.",
          "Les emplacements et horaires sont mis a jour regulierement pour faciliter la commande a emporter.",
        ],
      },
      {
        heading: "Une carte claire, orientee qualite",
        paragraphs: [
          "Chaque pizza est preparee a la commande avec une base d'ingredients italiens selectionnes.",
          "Le format camion permet de garder un service fluide, une cuisson reguliere et un retrait rapide.",
        ],
      },
      {
        heading: "Un service simple pour commander",
        paragraphs: [
          "Commande en ligne ou sur place selon disponibilite, puis retrait dans le creneau choisi.",
          "L'objectif reste le meme: une pizza chaude, bien executee, et peu d'attente.",
        ],
      },
    ],
  },
};

function hashText(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function withCity(text, city) {
  return String(text || "").replaceAll("{city}", city);
}

const PIZZA_VARIANTS = [
  "pizza napolitaine artisanale",
  "pizza italienne traditionnelle",
  "pizza feu de bois artisanale",
  "pizza napolitaine au feu de bois",
];

const TRUCK_VARIANTS = [
  "camion pizza",
  "food truck pizza",
  "camion pizza napolitain",
  "camion pizza artisanal",
];

const PLANNING_VARIANTS = [
  "tournee",
  "emplacements",
  "points de retrait",
  "planning",
];

function pickVariant(variants, seed, offset = 0) {
  return variants[(seed + offset) % variants.length];
}

export function buildDynamicCityContent(cityValue, options = {}) {
  const city = String(cityValue || "").trim() || "Moselle";
  const slug = slugifyCity(city) || "moselle";
  const seed = hashText(slug);
  const pizzaLabel = pickVariant(PIZZA_VARIANTS, seed, 0);
  const truckLabel = pickVariant(TRUCK_VARIANTS, seed, 1);
  const planningLabel = pickVariant(PLANNING_VARIANTS, seed, 2);
  const locationHighlights = Array.isArray(options.locationHighlights)
    ? options.locationHighlights.filter(Boolean).slice(0, 3)
    : [];

  const introParagraphs = [
    `Vous cherchez une pizza napolitaine a ${city} ?`,
    `Notre ${truckLabel} propose des pizzas artisanales preparees selon la tradition napolitaine avec une pate maison et des produits italiens selectionnes.`,
    `La cuisson est realisee dans un four a bois et gaz afin d'obtenir une pizza a la fois moelleuse, legere et croustillante.`,
    `La ${planningLabel} du camion pizza passe regulierement a ${city} selon les emplacements disponibles.`,
  ];

  const sections = [
    {
      heading: "Une pizza napolitaine preparee avec des produits italiens",
      paragraphs: [
        "Chaque pizza est preparee avec des ingredients selectionnes pour leur qualite.",
        `Nous utilisons notamment farine Nuvola Super, tomates San Marzano, mozzarella fior di latte, parmigiano reggiano et charcuteries italiennes pour construire une ${pizzaLabel} reguliere.`,
        "La pate est travaillee selon la methode napolitaine traditionnelle afin d'obtenir une pizza legere et digeste.",
      ],
    },
    {
      heading: withCity("Camion pizza a {city}", city),
      paragraphs: [
        `Notre ${truckLabel} se deplace dans plusieurs villes du nord de la Moselle.`,
        `La ${planningLabel} passe regulierement a ${city} avec differents points de retrait selon le planning hebdomadaire.`,
        "Les emplacements peuvent varier mais le principe reste le meme: des pizzas artisanales preparees sur place avec tres peu d'attente.",
      ],
    },
    {
      heading: "Retrait rapide et pizza a emporter",
      paragraphs: [
        "Les pizzas sont disponibles uniquement a emporter.",
        "Chaque pizza est preparee a la commande et cuite dans le four afin de garantir une qualite constante.",
        `Le retrait se fait directement au camion lors de la ${planningLabel} a ${city}.`,
      ],
    },
  ];

  return {
    pathname: `/pizza-${slug}`,
    title: `Pizza napolitaine a ${city} | Camion pizza artisanal`,
    description: `${pizzaLabel} a ${city}, ${truckLabel}, cuisson au four a bois et gaz, retrait rapide sur les points de passage.`,
    h1: `Pizza napolitaine artisanale a ${city}`,
    intro: introParagraphs.join(" "),
    introParagraphs,
    sections,
    locationHighlights,
  };
}
