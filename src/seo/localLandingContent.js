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

const DYNAMIC_PAGE_VARIANTS = [
  {
    title: "Pizza napolitaine a {city} | Camion pizza artisanal",
    description:
      "Camion pizza napolitaine a {city}, produits italiens selectionnes, cuisson au feu de bois et retrait rapide.",
    h1: "Pizza napolitaine artisanale a {city}",
    intro:
      "Notre pizza-location a {city} propose une pizza napolitaine artisanale, avec pate tradition italienne et cuisson maitrisee.",
    sections: [
      {
        heading: "Une base napolitaine pour {city}",
        paragraphs: [
          "La pate est travaillee avec une fermentation lente pour obtenir une texture legere et un gout equilibre.",
          "Les recettes sont pensees pour un service mobile rapide, sans compromis sur la qualite.",
        ],
      },
      {
        heading: "Ingredients italiens authentiques",
        paragraphs: [
          "Farine Nuvola Super, tomates San Marzano, mozzarella fior di latte et parmigiano reggiano composent notre base.",
          "Chaque pizza est preparee a la commande puis cuite minute au camion.",
        ],
      },
      {
        heading: "Retrait au camion a {city}",
        paragraphs: [
          "Le retrait se fait directement au point de passage du camion pizza.",
          "Commande simple, creneau clair et tres peu d'attente au moment du retrait.",
        ],
      },
    ],
    keywordLine:
      "pizza napolitaine artisanale | camion pizza napolitaine | pizza a emporter",
  },
  {
    title: "Pizza feu de bois a {city} | Pizza-location",
    description:
      "Pizza feu de bois a {city} en camion pizza: recettes artisanales, ingredients italiens et retrait rapide.",
    h1: "Pizza feu de bois a {city}",
    intro:
      "A {city}, notre pizza-location mise sur une cuisson vive au four a bois et gaz pour une pizza napolitaine croustillante et aerienne.",
    sections: [
      {
        heading: "Cuisson bois et gaz",
        paragraphs: [
          "La cuisson combine intensite et regularite pour sortir chaque pizza au bon moment.",
          "Le resultat: une corniche alveolee, une base souple et des saveurs nettes.",
        ],
      },
      {
        heading: "Carte courte et lisible",
        paragraphs: [
          "Nous privilegions une carte concise, facile a choisir et executee avec constance.",
          "Le format camion pizza permet d'etre efficace sur les creneaux de retrait.",
        ],
      },
      {
        heading: "Commander a {city}",
        paragraphs: [
          "Les commandes se font en ligne ou directement au camion selon les disponibilites.",
          "Le service reste 100% a emporter pour garantir fluidite et rapidite.",
        ],
      },
    ],
    keywordLine: "pizza napolitaine feu de bois | pizza feu de bois thionville | pizza artisanale moselle",
  },
  {
    title: "Camion pizza a {city} | Pizza napolitaine italienne",
    description:
      "Camion pizza a {city}: pizza napolitaine italienne, produits d'Italie et retrait au point de passage.",
    h1: "Camion pizza napolitaine a {city}",
    intro:
      "Notre camion pizza se deplace autour de {city} avec une offre napolitaine artisanale et un parcours de commande rapide.",
    sections: [
      {
        heading: "Recettes italiennes a emporter",
        paragraphs: [
          "Nos recettes s'appuient sur des produits italiens reputes pour leur regularite et leur saveur.",
          "Le service a emporter permet de conserver une experience simple et fiable.",
        ],
      },
      {
        heading: "Organisation par tournee",
        paragraphs: [
          "Les emplacements evoluent selon la semaine et les jours d'ouverture du camion.",
          "Chaque point de retrait est affiche avec adresse et horaire pour faciliter la commande.",
        ],
      },
      {
        heading: "Qualite constante a {city}",
        paragraphs: [
          "Preparation minute, cuisson rapide et process stable: l'objectif est une pizza chaude, prete a deguster.",
          "Le camion pizza reste concentre sur la regularite du service.",
        ],
      },
    ],
    keywordLine: "camion pizza napolitaine | pizza italienne traditionnelle | pizza produits italiens",
  },
  {
    title: "Pizza italienne a {city} | Food truck pizza",
    description:
      "Pizza italienne a {city} par food truck: pate napolitaine, cuisson minute et retrait rapide.",
    h1: "Pizza italienne traditionnelle a {city}",
    intro:
      "Notre food truck pizza intervient a {city} avec une approche artisanale inspiree de la tradition napolitaine.",
    sections: [
      {
        heading: "Savoir-faire napolitain",
        paragraphs: [
          "La pate est preparee pour conserver une bonne digestibilite et un gout net.",
          "La cuisson au four permet d'obtenir une texture reguliere sur l'ensemble de la carte.",
        ],
      },
      {
        heading: "Produits d'Italie selectionnes",
        paragraphs: [
          "Tomates San Marzano, mozzarella fior di latte, parmigiano reggiano et charcuteries italiennes.",
          "Chaque ingredient est choisi pour renforcer l'identite pizza napolitaine.",
        ],
      },
      {
        heading: "Retrait sans friction a {city}",
        paragraphs: [
          "Le retrait au camion limite l'attente et simplifie l'experience client.",
          "Les creneaux sont adaptes pour garder un flux de commandes stable.",
        ],
      },
    ],
    keywordLine: "pizza italienne traditionnelle | pizza napolitaine metz | pizza a emporter",
  },
  {
    title: "Pizza artisanale a {city} | Retrait rapide camion",
    description:
      "Pizza artisanale a {city}: camion pizza, cuisson feu de bois et retrait rapide sur les points de tournee.",
    h1: "Pizza artisanale en camion a {city}",
    intro:
      "La pizza-location a {city} combine artisanat, ingredients italiens et organisation efficace pour la commande a emporter.",
    sections: [
      {
        heading: "Carte artisanale et execution rapide",
        paragraphs: [
          "Notre carte est construite pour aller a l'essentiel: qualite, lisibilite, regularite.",
          "Les pizzas sont preparees a la commande afin de garder une qualite constante.",
        ],
      },
      {
        heading: "Tournee hebdomadaire",
        paragraphs: [
          "Le camion pizza couvre differents points autour de {city} selon le planning.",
          "Les horaires et adresses sont mis a jour pour aider les clients a planifier leur retrait.",
        ],
      },
      {
        heading: "Experience client",
        paragraphs: [
          "Objectif: une commande simple et un retrait rapide au camion.",
          "Le service reste 100% a emporter pour maintenir une cadence fluide.",
        ],
      },
    ],
    keywordLine: "pizza artisanale moselle | camion pizza thionville | pizza napolitaine artisanale",
  },
  {
    title: "Pizza-location {city} | Pizza napolitaine en Moselle",
    description:
      "Page pizza-location {city}: pizza napolitaine en Moselle, ingredients italiens et cuisson bois-gaz.",
    h1: "Pizza-location a {city}",
    intro:
      "Cette page locale presente notre service pizza-location a {city}, avec un contenu SEO adapte et des informations de tournee.",
    sections: [
      {
        heading: "Pourquoi choisir notre pizza-location",
        paragraphs: [
          "Une methode napolitaine claire, des produits italiens et une cuisson maitrisee.",
          "Le format camion pizza permet de servir vite et bien sur les zones de passage.",
        ],
      },
      {
        heading: "Disponibilite locale a {city}",
        paragraphs: [
          "Les points de retrait sont relies au planning de tournee et peuvent evoluer selon la semaine.",
          "Vous retrouvez facilement le camion via la page tournee.",
        ],
      },
      {
        heading: "Commande et retrait",
        paragraphs: [
          "Commande en ligne puis retrait au camion dans le creneau choisi.",
          "Service concu pour minimiser l'attente et garantir une pizza chaude.",
        ],
      },
    ],
    keywordLine: "pizza-location | pizza napolitaine artisanale | camion pizza napolitaine",
  },
];

export function buildDynamicCityContent(cityValue, options = {}) {
  const city = String(cityValue || "").trim() || "Moselle";
  const slug = slugifyCity(city) || "moselle";
  const variant = DYNAMIC_PAGE_VARIANTS[hashText(slug) % DYNAMIC_PAGE_VARIANTS.length];
  const locationHighlights = Array.isArray(options.locationHighlights)
    ? options.locationHighlights.filter(Boolean).slice(0, 3)
    : [];

  const sections = variant.sections.map((section, index) => {
    const paragraphs = section.paragraphs.map((paragraph) => withCity(paragraph, city));
    if (index === 0 && locationHighlights.length > 0) {
      paragraphs.push(`Exemples d'emplacements actifs: ${locationHighlights.join(", ")}.`);
    }
    return {
      heading: withCity(section.heading, city),
      paragraphs,
    };
  });

  return {
    pathname: `/pizza-${slug}`,
    title: withCity(variant.title, city),
    description: withCity(variant.description, city),
    h1: withCity(variant.h1, city),
    intro: withCity(variant.intro, city),
    sections,
    keywordLine: variant.keywordLine,
  };
}

