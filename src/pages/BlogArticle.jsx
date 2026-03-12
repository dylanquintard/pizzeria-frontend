import { Link, Navigate, useParams } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { getBlogArticleBySlug } from "../seo/blogContent";

export default function BlogArticle() {
  const params = useParams();
  const article = getBlogArticleBySlug(params.slug);

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const pathname = `/blog/${article.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    mainEntityOfPage: pathname,
    author: {
      "@type": "Organization",
      name: "Pizza Truck",
    },
    publisher: {
      "@type": "Organization",
      name: "Pizza Truck",
    },
  };

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={`${article.title} | Blog Pizza Truck`}
        description={article.description}
        pathname={pathname}
        jsonLd={articleJsonLd}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">Article</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          {article.title}
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">{article.description}</p>
      </header>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">Contenu en preparation</h2>
        <p className="mt-3 text-sm leading-7 text-stone-300">
          Cette page article est volontairement concise pour le moment.
        </p>
        <p className="mt-2 text-sm leading-7 text-stone-300">
          Tu pourras fournir un contenu editorial propre ensuite, puis on l'integrera ici sans changer la structure SEO.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/blog"
          className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          Retour au blog
        </Link>
        <Link
          to="/menu"
          className="rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
        >
          Voir le menu
        </Link>
      </div>

      <SeoInternalLinks />
    </div>
  );
}

