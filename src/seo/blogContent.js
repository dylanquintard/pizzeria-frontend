export const BLOG_ARTICLES = [
  {
    slug: "pourquoi-la-pizza-napolitaine-est-differente",
    title: "Pourquoi la pizza napolitaine est differente",
    description:
      "Comprendre ce qui distingue une pizza napolitaine artisanale: pate, cuisson, ingredients et texture.",
  },
  {
    slug: "la-cuisson-au-feu-de-bois",
    title: "La cuisson au feu de bois",
    description:
      "Decouvrez pourquoi la cuisson au feu de bois apporte une texture legere et un gout typique a la pizza.",
  },
  {
    slug: "les-ingredients-italiens-authentiques",
    title: "Les ingredients italiens authentiques",
    description:
      "Tour d'horizon des ingredients italiens utilises pour une pizza napolitaine artisanale.",
  },
  {
    slug: "la-farine-nuvola-super",
    title: "La farine Nuvola Super",
    description:
      "Pourquoi la farine Nuvola Super est appreciee pour obtenir une pate napolitaine alveolee.",
  },
  {
    slug: "tomates-san-marzano",
    title: "Tomates San Marzano",
    description:
      "Ce qu'apportent les tomates San Marzano dans la sauce d'une pizza napolitaine.",
  },
];

export function getBlogArticleBySlug(slug) {
  return BLOG_ARTICLES.find((article) => article.slug === slug) || null;
}

