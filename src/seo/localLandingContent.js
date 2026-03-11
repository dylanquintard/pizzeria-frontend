export const DEFAULT_TOUR_CITIES = [
  "Thionville",
  "Yutz",
  "Terville",
  "Florange",
  "Hayange",
  "Amneville",
  "Metz",
];

const SPECIAL_CITY_PATHS = {
  thionville: "/pizza-napolitaine-thionville",
  metz: "/pizza-napolitaine-metz",
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
    title: "Pizza napolitaine a Thionville | Camion pizza artisanal",
    description:
      "Pizza napolitaine artisanale a Thionville: camion pizza artisanal, cuisson au feu de bois et gaz, retrait rapide.",
    h1: "Pizza napolitaine artisanale a Thionville",
    intro:
      "Vous cherchez une pizza napolitaine a Thionville ? Notre camion pizza propose des pizzas artisanales preparees selon la tradition italienne avec des produits authentiques et une pate travaillee dans l'esprit napolitain.",
    sections: [
      {
        heading: "Une pizza napolitaine authentique",
        paragraphs: [
          "Nos pizzas sont realisees avec des ingredients italiens selectionnes : farine Nuvola Super, tomates San Marzano, mozzarella fior di latte, parmigiano reggiano, jambon de Parme et prosciutto italien.",
          "Chaque pizza est cuite au four a bois et gaz pour obtenir une cuisson rapide et une pate legere et savoureuse.",
        ],
      },
      {
        heading: "Camion pizza autour de Thionville",
        paragraphs: [
          "Notre camion pizza se deplace dans differents quartiers et villes autour de Thionville.",
          "Les points de retrait changent selon la tournee hebdomadaire du camion pizza. Le retrait se fait directement au camion avec tres peu d'attente.",
        ],
      },
      {
        heading: "Une pizza artisanale a emporter",
        paragraphs: [
          "Le service est uniquement a emporter.",
          "Vous pouvez commander votre pizza directement sur place ou en ligne selon les creneaux disponibles. L'objectif est de proposer un service rapide et une pizza chaude prete a etre degustee.",
        ],
      },
    ],
  },
  metz: {
    pathname: "/pizza-napolitaine-metz",
    title: "Pizza napolitaine a Metz | Camion pizza artisanal",
    description:
      "Pizza napolitaine artisanale autour de Metz, camion pizza artisanal, cuisson au feu de bois et retrait au camion.",
    h1: "Pizza napolitaine artisanale autour de Metz",
    intro:
      "Notre camion pizza propose des pizzas napolitaines artisanales autour de Metz. Chaque pizza est preparee avec des ingredients italiens authentiques et cuite dans un four a bois et gaz pour garantir une qualite constante.",
    sections: [
      {
        heading: "Une pizza inspiree de la tradition napolitaine",
        paragraphs: [
          "La pate est travaillee selon la methode napolitaine classique.",
          "Les ingredients sont selectionnes pour leur qualite : farine Nuvola Super, tomates San Marzano, mozzarella fior di latte, parmigiano reggiano et charcuteries italiennes.",
        ],
      },
      {
        heading: "Camion pizza autour de Metz",
        paragraphs: [
          "Notre camion pizza se deplace dans plusieurs zones autour de Metz et dans le nord de la Moselle.",
          "Les emplacements changent selon la tournee hebdomadaire.",
        ],
      },
      {
        heading: "Retrait rapide et pizzas fraiches",
        paragraphs: [
          "Les pizzas sont preparees a la commande et cuites au four a bois et gaz.",
          "Le retrait se fait directement au camion avec tres peu d'attente.",
        ],
      },
    ],
  },
  moselle: {
    pathname: "/food-truck-pizza-moselle",
    title: "Food truck pizza Moselle | Pizza napolitaine artisanale",
    description:
      "Food truck pizza en Moselle: pizza napolitaine artisanale, cuisson au feu de bois, produits italiens et retrait rapide.",
    h1: "Food truck pizza en Moselle",
    intro:
      "Notre camion pizza napolitaine dessert le nord de la Moselle avec des pizzas artisanales, une cuisson au feu de bois et un retrait rapide.",
    sections: [
      {
        heading: "Une offre locale pour la Moselle",
        paragraphs: [
          "Nous couvrons plusieurs communes autour de Thionville, Metz et des villes voisines selon la tournee.",
          "La carte est pensee pour la qualite, la regularite et la rapidite du service.",
        ],
      },
      {
        heading: "Pizza italienne traditionnelle a emporter",
        paragraphs: [
          "Chaque pizza est preparee a la commande avec des ingredients italiens reconnus.",
          "Le service est organise autour du retrait au camion pour limiter l'attente.",
        ],
      },
    ],
  },
};

export function buildDynamicCityContent(cityValue) {
  const city = String(cityValue || "").trim() || "Moselle";
  const slug = slugifyCity(city) || "moselle";

  return {
    pathname: `/pizza-${slug}`,
    title: `Pizza napolitaine a ${city} | Camion pizza artisanal`,
    description: `Camion pizza napolitaine a ${city}, produits italiens, cuisson au feu de bois et gaz, pizza a emporter.`,
    h1: `Pizza napolitaine a ${city}`,
    intro: `Retrouvez notre camion pizza napolitaine a ${city} selon la tournee hebdomadaire. Pizzas artisanales, cuisson feu de bois et retrait rapide.`,
    sections: [
      {
        heading: `Camion pizza a ${city}`,
        paragraphs: [
          `Notre camion pizza napolitaine se deplace autour de ${city} avec des points de retrait mis a jour regulierement.`,
          "Le planning de tournee permet de savoir quand commander et ou retirer votre pizza a emporter.",
        ],
      },
      {
        heading: "Pizza italienne traditionnelle",
        paragraphs: [
          "Nos pizzas sont preparees avec des produits italiens selectionnes: farine Nuvola Super, tomates San Marzano, mozzarella fior di latte et parmigiano reggiano.",
          "La cuisson au four a bois et gaz garantit une pizza napolitaine legere, alveolee et croustillante.",
        ],
      },
      {
        heading: "Retrait rapide au camion",
        paragraphs: [
          "Les pizzas sont preparees a la commande pour conserver une qualite constante.",
          "Service uniquement a emporter, avec un retrait fluide directement au camion pizza.",
        ],
      },
    ],
  };
}

