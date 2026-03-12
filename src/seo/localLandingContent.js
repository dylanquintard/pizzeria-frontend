export const DEFAULT_TOUR_CITIES = ["Thionville", "Metz"];

const SPECIAL_CITY_PATHS = {
  thionville: "/pizza-napolitaine-thionville",
  metz: "/pizza-napolitaine-metz",
  moselle: "/food-truck-pizza-moselle",
};

export const FIXED_LOCAL_CITY_SLUGS = Object.freeze(Object.keys(SPECIAL_CITY_PATHS));

export function slugifyCity(city) {
  return String(city || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getFixedCityPathBySlug(citySlug) {
  return SPECIAL_CITY_PATHS[slugifyCity(citySlug)] || "";
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
          "Les adresses et horaires evoluent selon la horaires d'ouvertures, avec un fonctionnement simple: commande puis retrait direct au camion.",
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
          "Chaque semaine, la horaires d'ouvertures precise les points de retrait et les horaires disponibles.",
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
        heading: "Une horaires d'ouvertures locale dans le nord mosellan",
        paragraphs: [
          "La horaires d'ouvertures passe par differents points autour de Thionville, Metz et des villes voisines selon la semaine.",
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

function withCity(text, city) {
  return String(text || "").replaceAll("{city}", city);
}

function hashToIndex(value, modulo) {
  if (!modulo || modulo <= 0) return 0;

  let hash = 0;
  const source = String(value || "");
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 2147483647;
  }

  return Math.abs(hash) % modulo;
}

const DYNAMIC_CITY_VARIANTS = [
  {
    title: "Pizza napolitaine a {city} | Camion pizza artisanal",
    h1: "Pizza napolitaine artisanale a {city}",
    description:
      "Pizza napolitaine artisanale a {city}, cuisson au four a bois et gaz, produits italiens selectionnes et retrait rapide.",
    intro: [
      "Vous cherchez une pizza napolitaine a {city} ?",
      "Notre camion pizza propose des pizzas artisanales preparees selon la tradition napolitaine avec une pate maison et des produits italiens selectionnes.",
      "Chaque pizza est cuite dans un four a bois et gaz afin d'obtenir une cuisson rapide et une pate legere et moelleuse.",
      "Le camion pizza passe regulierement a {city} selon la horaires d'ouvertures et les emplacements disponibles.",
    ],
    sections: [
      {
        heading: "Une pizza napolitaine preparee avec des produits italiens",
        paragraphs: [
          "Nos pizzas sont preparees avec des ingredients selectionnes pour leur qualite :",
          "farine Nuvola Super",
          "tomates San Marzano",
          "mozzarella fior di latte",
          "parmigiano reggiano",
          "charcuteries italiennes.",
          "La pate est travaillee selon la methode napolitaine traditionnelle afin d'obtenir une pizza legere et digeste.",
        ],
      },
      {
        heading: "Camion pizza a {city}",
        paragraphs: [
          "Le camion pizza propose regulierement des pizzas napolitaines artisanales a {city}.",
          "Les emplacements changent selon la horaires d'ouvertures hebdomadaire et les points de retrait disponibles.",
          "Chaque pizza est preparee sur place afin de garantir une qualite constante.",
        ],
      },
      {
        heading: "Pizza a emporter a {city}",
        paragraphs: [
          "Les pizzas sont disponibles uniquement a emporter directement au camion pizza.",
          "Chaque pizza est preparee a la commande et cuite dans le four afin de garantir une pizza chaude et savoureuse.",
        ],
      },
    ],
  },
  {
    title: "Pizza artisanale a {city} | Camion pizza napolitain",
    h1: "Pizza italienne artisanale a {city}",
    description:
      "Pizza artisanale a {city}, pate maison, produits italiens et cuisson au four a bois et gaz.",
    intro: [
      "Le camion pizza propose des pizzas napolitaines artisanales a {city}.",
      "Chaque pizza est preparee avec une pate maison et des produits italiens selectionnes pour leur qualite.",
      "La cuisson dans un four a bois et gaz permet d'obtenir une pizza a la fois moelleuse et croustillante.",
    ],
    sections: [
      {
        heading: "Une pizza inspiree de la tradition napolitaine",
        paragraphs: [
          "La pate est travaillee selon la methode napolitaine classique.",
          "Les ingredients utilises sont simples mais reconnus pour leur qualite :",
          "tomates San Marzano",
          "mozzarella fior di latte",
          "parmigiano reggiano",
          "huile d'olive.",
        ],
      },
      {
        heading: "Le camion pizza a {city}",
        paragraphs: [
          "Le camion pizza passe a {city} selon la horaires d'ouvertures hebdomadaire.",
          "Les points de retrait peuvent varier mais l'objectif reste le meme : proposer une pizza artisanale preparee sur place.",
        ],
      },
      {
        heading: "Une pizza a emporter preparee a la commande",
        paragraphs: [
          "Chaque pizza est preparee au moment de la commande afin de garantir une qualite constante.",
          "Le service est uniquement a emporter directement au camion pizza.",
        ],
      },
    ],
  },
  {
    title: "Pizza feu de bois a {city} | Camion pizza",
    h1: "Pizza feu de bois artisanale a {city}",
    description:
      "Pizza feu de bois a {city} avec ingredients italiens et retrait au camion pizza.",
    intro: [
      "Notre camion pizza propose des pizzas napolitaines artisanales a {city}.",
      "La cuisson au four a bois et gaz permet d'obtenir une pizza savoureuse avec une pate legere et un bord croustillant.",
      "Chaque pizza est preparee sur place avec des ingredients italiens.",
    ],
    sections: [
      {
        heading: "Des ingredients italiens selectionnes",
        paragraphs: [
          "La qualite d'une pizza repose sur les produits utilises.",
          "Nous utilisons notamment :",
          "farine Nuvola Super",
          "tomates San Marzano",
          "mozzarella fior di latte",
          "parmigiano reggiano.",
        ],
      },
      {
        heading: "Camion pizza en horaires d'ouvertures a {city}",
        paragraphs: [
          "Le camion pizza se deplace a {city} selon la horaires d'ouvertures et les emplacements definis dans le planning.",
          "Les pizzas sont preparees directement au camion afin de garantir leur fraicheur.",
        ],
      },
      {
        heading: "Retrait pizza a {city}",
        paragraphs: [
          "Les pizzas sont disponibles uniquement a emporter.",
          "Le retrait se fait directement au camion lors du passage a {city}.",
        ],
      },
    ],
  },
  {
    title: "Camion pizza a {city} | Pizza napolitaine artisanale",
    h1: "Camion pizza napolitaine a {city}",
    description:
      "Camion pizza a {city}: pizzas napolitaines artisanales, ingredients italiens et cuisson bois-gaz.",
    intro: [
      "Le camion pizza propose des pizzas napolitaines artisanales a {city} selon la horaires d'ouvertures hebdomadaire.",
      "Chaque pizza est preparee avec une pate maison et des ingredients italiens selectionnes.",
      "La cuisson se fait dans un four a bois et gaz.",
    ],
    sections: [
      {
        heading: "Une pizza napolitaine authentique",
        paragraphs: [
          "La pizza napolitaine est connue pour sa pate legere et sa cuisson rapide.",
          "Elle est preparee avec des ingredients simples et de qualite :",
          "tomates San Marzano",
          "mozzarella fior di latte",
          "parmigiano reggiano.",
        ],
      },
      {
        heading: "Horaires d'ouvertures du camion pizza a {city}",
        paragraphs: [
          "Le camion pizza passe a {city} selon les emplacements prevus dans la horaires d'ouvertures.",
          "Les horaires et emplacements peuvent etre consultes sur la page horaires d'ouvertures.",
        ],
      },
      {
        heading: "Pizza artisanale a emporter",
        paragraphs: [
          "Chaque pizza est preparee a la commande afin de garantir une cuisson parfaite.",
          "Le service est uniquement a emporter.",
        ],
      },
    ],
  },
  {
    title: "Pizza napolitaine traditionnelle a {city} | Camion pizza",
    h1: "Pizza napolitaine traditionnelle a {city}",
    description:
      "Pizza napolitaine traditionnelle a {city}, preparation artisanale et cuisson au four a bois et gaz.",
    intro: [
      "Vous cherchez une pizza napolitaine traditionnelle a {city} ?",
      "Le camion pizza propose des pizzas preparees avec une pate artisanale et des ingredients italiens.",
      "La cuisson dans un four a bois et gaz permet d'obtenir une pizza savoureuse.",
    ],
    sections: [
      {
        heading: "Une pizza artisanale preparee avec soin",
        paragraphs: [
          "Chaque pizza est preparee avec des ingredients italiens reconnus pour leur qualite :",
          "farine Nuvola Super",
          "tomates San Marzano",
          "mozzarella fior di latte",
          "parmigiano reggiano.",
        ],
      },
      {
        heading: "Le camion pizza a {city}",
        paragraphs: [
          "Le camion pizza se deplace a {city} selon les emplacements de la horaires d'ouvertures.",
          "Les pizzas sont preparees sur place afin de garantir leur fraicheur.",
        ],
      },
      {
        heading: "Pizza a emporter",
        paragraphs: [
          "Les pizzas sont disponibles uniquement a emporter directement au camion.",
        ],
      },
    ],
  },
];

const DYNAMIC_NEARBY_VARIANTS = [
  {
    heading: "Villes proches et emplacements autour de {city}",
    lead: "Voici quelques points de retrait actifs a {city} et aux alentours.",
    footer: "Consultez la page horaires d'ouvertures pour verifier les prochains passages.",
  },
  {
    heading: "Prochains passages proches de {city}",
    lead: "Les emplacements suivants proviennent du planning admin actuellement publie.",
    footer: "Les jours et horaires peuvent evoluer selon la horaires d'ouvertures.",
  },
  {
    heading: "Points de retrait disponibles a {city}",
    lead: "Retrouvez ci-dessous des exemples d'emplacements ou le camion peut passer.",
    footer: "Pour la version complete, consultez la page horaires d'ouvertures du camion pizza.",
  },
  {
    heading: "Emplacements actuellement visibles pour {city}",
    lead: "Ces adresses sont mises a jour automatiquement depuis la configuration admin.",
    footer: "Pensez a verifier la horaires d'ouvertures avant de vous deplacer.",
  },
  {
    heading: "Retrait pizza autour de {city}",
    lead: "Selection de points de retrait disponibles selon les derniers creneaux ouverts.",
    footer: "Tous les details de passage restent centralises sur la page horaires d'ouvertures.",
  },
];

const DYNAMIC_FAQ_VARIANTS = [
  [
    {
      question: "Ou trouver le camion pizza a {city} ?",
      answer:
        "Le camion pizza propose regulierement des emplacements a {city} selon la horaires d'ouvertures hebdomadaire. Les prochains passages et horaires sont indiques sur la page horaires d'ouvertures du site.",
    },
    {
      question: "Les pizzas sont-elles disponibles sur place ?",
      answer: "Les pizzas sont disponibles uniquement a emporter directement au camion pizza.",
    },
    {
      question: "Quel type de pizza proposez-vous a {city} ?",
      answer:
        "Nous proposons des pizzas napolitaines artisanales preparees avec des ingredients italiens et une cuisson au four a bois et gaz.",
    },
  ],
  [
    {
      question: "Le camion pizza passe-t-il a {city} chaque semaine ?",
      answer:
        "Le passage du camion pizza a {city} depend de la horaires d'ouvertures et des emplacements disponibles. Les horaires et jours de passage sont indiques dans la page horaires d'ouvertures.",
    },
    {
      question: "Peut-on commander une pizza a l'avance ?",
      answer:
        "Selon les creneaux disponibles, il est possible de commander votre pizza et de venir la recuperer directement au camion.",
    },
    {
      question: "Les pizzas sont-elles faites maison ?",
      answer:
        "Oui. La pate est preparee maison et les pizzas sont realisees avec des ingredients italiens selectionnes.",
    },
  ],
  [
    {
      question: "Ou acheter une pizza napolitaine a {city} ?",
      answer:
        "Le camion pizza propose des pizzas napolitaines artisanales a {city} selon les emplacements de la horaires d'ouvertures.",
    },
    {
      question: "Comment fonctionne le retrait des pizzas ?",
      answer:
        "Les pizzas sont preparees a la commande et disponibles a emporter directement au camion pizza.",
    },
    {
      question: "Quels ingredients utilisez-vous ?",
      answer:
        "Les pizzas sont preparees avec des ingredients italiens comme la mozzarella fior di latte, les tomates San Marzano et la farine Nuvola.",
    },
  ],
  [
    {
      question: "Quand trouver le camion pizza a {city} ?",
      answer:
        "Le camion pizza passe regulierement a {city} selon la horaires d'ouvertures hebdomadaire. Consultez la page horaires d'ouvertures pour connaitre les prochains passages.",
    },
    {
      question: "Les pizzas sont-elles cuites au feu de bois ?",
      answer:
        "Les pizzas sont cuites dans un four a bois et gaz afin d'obtenir une cuisson rapide et une pate legere.",
    },
    {
      question: "Le service est-il uniquement a emporter ?",
      answer: "Oui, les pizzas sont proposees uniquement a emporter directement au camion pizza.",
    },
  ],
  [
    {
      question: "Le camion pizza propose-t-il des pizzas napolitaines a {city} ?",
      answer:
        "Oui, le camion pizza propose regulierement des pizzas napolitaines artisanales a {city} selon les emplacements disponibles.",
    },
    {
      question: "Combien de temps faut-il attendre pour une pizza ?",
      answer:
        "Les pizzas sont preparees a la commande et la cuisson est generalement tres rapide grace au four a haute temperature.",
    },
    {
      question: "Quels types de pizzas sont disponibles ?",
      answer:
        "Le menu propose differentes pizzas napolitaines avec des ingredients italiens selectionnes.",
    },
  ],
];

export function buildDynamicCityFaq(cityValue) {
  const city = String(cityValue || "").trim() || "Moselle";
  const slug = slugifyCity(city) || "moselle";
  const faqVariantIndex = hashToIndex(`${slug}-faq`, DYNAMIC_FAQ_VARIANTS.length);
  const faqVariant = DYNAMIC_FAQ_VARIANTS[faqVariantIndex];

  return faqVariant.map((item) => ({
    question: withCity(item.question, city),
    answer: withCity(item.answer, city),
  }));
}

export function buildDynamicCityContent(cityValue, options = {}) {
  const city = String(cityValue || "").trim() || "Moselle";
  const slug = slugifyCity(city) || "moselle";
  const variantIndex = hashToIndex(slug, DYNAMIC_CITY_VARIANTS.length);
  const nearbyVariantIndex = hashToIndex(`${slug}-nearby`, DYNAMIC_NEARBY_VARIANTS.length);
  const variant = DYNAMIC_CITY_VARIANTS[variantIndex];
  const nearbyVariant = DYNAMIC_NEARBY_VARIANTS[nearbyVariantIndex];
  const locationHighlights = Array.isArray(options.locationHighlights)
    ? options.locationHighlights.filter(Boolean).slice(0, 3)
    : [];
  const introParagraphs = variant.intro.map((paragraph) => withCity(paragraph, city));
  const sections = variant.sections.map((section) => ({
    heading: withCity(section.heading, city),
    paragraphs: section.paragraphs.map((paragraph) => withCity(paragraph, city)),
  }));
  const faq = buildDynamicCityFaq(city);

  return {
    pathname: `/pizza-${slug}`,
    title: withCity(variant.title, city),
    description: withCity(variant.description, city),
    h1: withCity(variant.h1, city),
    intro: introParagraphs.join(" "),
    introParagraphs,
    sections,
    faq,
    nearbySection: {
      heading: withCity(nearbyVariant.heading, city),
      lead: withCity(nearbyVariant.lead, city),
      footer: withCity(nearbyVariant.footer, city),
    },
    locationHighlights,
  };
}

