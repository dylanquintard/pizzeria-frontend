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

const DYNAMIC_PAGE_VARIANTS = [
  {
    title: "Camion pizza autour de {city} | Pizza napolitaine artisanale",
    description:
      "Pizza napolitaine artisanale autour de {city}, ingredients italiens et cuisson bois-gaz avec retrait rapide.",
    h1: "Pizza napolitaine artisanale autour de {city}",
    intro:
      "Autour de {city}, notre camion pizza propose une offre napolitaine artisanale avec une execution rapide et reguliere.",
    sections: [
      {
        heading: "Une base napolitaine maitrisee",
        paragraphs: [
          "La pate est preparee avec une fermentation en deux temps pour garder legerete, souplesse et gout.",
          "La cuisson minute au camion permet de servir chaud tout en conservant une qualite constante.",
        ],
      },
      {
        heading: "Ingredients italiens authentiques",
        paragraphs: [
          "Farine Nuvola Super, tomates San Marzano, mozzarella fior di latte et parmigiano reggiano structurent notre base produit.",
          "Nous completions la carte avec des charcuteries italiennes selectionnees selon les recettes.",
        ],
      },
      {
        heading: "Commander proche de {city}",
        paragraphs: [
          "Le retrait se fait sur les points de passage annonces dans la tournee hebdomadaire.",
          "Commande en ligne ou sur place, puis retrait dans le creneau choisi avec peu d'attente.",
        ],
      },
    ],
  },
  {
    title: "Pizza feu de bois proche de {city} | Camion pizza",
    description:
      "Pizza feu de bois proche de {city}: recettes napolitaines artisanales, service camion et retrait rapide.",
    h1: "Pizza feu de bois autour de {city}",
    intro:
      "Autour de {city}, nous misons sur une cuisson vive au four bois-gaz pour une pizza napolitaine equilibree.",
    sections: [
      {
        heading: "Cuisson bois et gaz",
        paragraphs: [
          "La cuisson combine intensite et precision pour sortir chaque pizza au bon moment.",
          "Le resultat vise une corniche alveolee, une base souple et des saveurs nettes.",
        ],
      },
      {
        heading: "Carte concise, execution stable",
        paragraphs: [
          "Nous privilegions une carte courte, facile a choisir et executee avec constance sur le service mobile.",
          "Le format camion permet de rester efficace sur les creneaux de retrait.",
        ],
      },
      {
        heading: "Retrait autour de {city}",
        paragraphs: [
          "Les commandes se font en ligne ou directement au camion selon disponibilite.",
          "Le service est organise en 100% a emporter pour garantir fluidite et rapidite.",
        ],
      },
    ],
  },
  {
    title: "Retrait pizza autour de {city} | Camion napolitain",
    description:
      "Retrait pizza autour de {city}: camion napolitain, produits italiens et cuisson rapide.",
    h1: "Retrait pizza autour de {city}",
    intro:
      "Notre camion pizza circule autour de {city} avec un parcours de commande simple et des pizzas preparees minute.",
    sections: [
      {
        heading: "Recettes italiennes bien executees",
        paragraphs: [
          "Nos recettes s'appuient sur des ingredients italiens connus pour leur regularite et leur saveur.",
          "La preparation minute permet de garder une pizza chaude au moment du retrait.",
        ],
      },
      {
        heading: "Organisation par planning hebdomadaire",
        paragraphs: [
          "Les emplacements evoluent selon les jours d'ouverture et la tournee de la semaine.",
          "Chaque point de retrait est affiche avec adresse et horaire pour faciliter l'organisation.",
        ],
      },
      {
        heading: "Un service clair autour de {city}",
        paragraphs: [
          "Objectif: commande simple, retrait clair, et qualite stable a chaque passage du camion.",
          "Le service reste concentre sur l'essentiel: bonne pizza, bon creneau, peu d'attente.",
        ],
      },
    ],
  },
  {
    title: "Pizza italienne proche de {city} | Food truck pizza",
    description:
      "Pizza italienne proche de {city} par food truck: pate napolitaine, cuisson minute et retrait rapide.",
    h1: "Pizza italienne traditionnelle a {city}",
    intro:
      "Notre food truck {city} se deplace jusqu'a chez vous ! Goutez nos pizzas inspirees de la cuisine italienne.",
    sections: [
      {
        heading: "Savoir-faire napolitain applique au service mobile",
        paragraphs: [
          "La pate est preparee pour conserver digestibilite, gout et regularite de texture.",
          "La cuisson au four bois-gaz permet une execution stable sur l'ensemble de la carte.",
        ],
      },
      {
        heading: "Produits d'Italie selectionnes",
        paragraphs: [
          "Tomates San Marzano, mozzarella fior di latte, parmigiano reggiano et charcuteries italiennes.",
          "Chaque ingredient est choisi pour renforcer le profil napolitain sans alourdir les recettes.",
        ],
      },
      {
        heading: "Retrait sans friction autour de {city}",
        paragraphs: [
          "Le retrait au camion limite l'attente et simplifie l'experience client.",
          "Les creneaux sont adaptes pour garder un flux de commandes regulier.",
        ],
      },
    ],
  },
  {
    title: "Camion pizza en tournee vers {city} | Pizza artisanale",
    description:
      "Camion pizza en tournee vers {city}: pizzas artisanales, cuisson feu de bois-gaz et retrait rapide.",
    h1: "Camion pizza en tournee autour de {city}",
    intro:
      "Autour de {city}, la tournee du camion pizza combine artisanat, ingredients italiens et organisation efficace.",
    sections: [
      {
        heading: "Carte artisanale et execution precise",
        paragraphs: [
          "Notre carte est construite pour aller a l'essentiel: qualite, lisibilite et regularite.",
          "Les pizzas sont preparees a la commande pour conserver une qualite constante.",
        ],
      },
      {
        heading: "Tournee hebdomadaire",
        paragraphs: [
          "Le camion couvre differents points autour de {city} selon le planning de la semaine.",
          "Les horaires et adresses sont mis a jour pour aider a planifier le retrait.",
        ],
      },
      {
        heading: "Experience client au retrait",
        paragraphs: [
          "Objectif: commande simple, retrait rapide, pizza chaude.",
          "Le service reste 100% a emporter pour maintenir une cadence fluide.",
        ],
      },
    ],
  },
  {
    title: "Pizza a emporter autour de {city} | Camion pizza mosellan",
    description:
      "Pizza a emporter autour de {city}: camion pizza mosellan, ingredients italiens et cuisson bois-gaz.",
    h1: "Pizza a emporter autour de {city}",
    intro:
      "Cette page locale presente notre service de camion pizza autour de {city}, avec infos utiles pour la commande et la tournee.",
    sections: [
      {
        heading: "Pourquoi choisir notre camion pizza",
        paragraphs: [
          "Une methode napolitaine claire, des produits italiens et une cuisson maitrisee.",
          "Le format camion permet de servir vite et bien sur les zones de passage.",
        ],
      },
      {
        heading: "Disponibilite locale autour de {city}",
        paragraphs: [
          "Les points de retrait sont relies au planning de tournee et peuvent evoluer selon la semaine.",
          "Vous retrouvez le camion facilement via la page tournee du site.",
        ],
      },
      {
        heading: "Commande et retrait",
        paragraphs: [
          "Commande en ligne puis retrait au camion dans le creneau choisi.",
          "Service concu pour minimiser l'attente et garantir une pizza chaude a la remise.",
        ],
      },
    ],
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
  };
}
