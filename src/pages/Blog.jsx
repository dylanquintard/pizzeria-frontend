import { Link } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { BLOG_ARTICLES } from "../seo/blogContent";

export default function Blog() {
  const title = "Blog pizza napolitaine | Pizza Truck";
  const description =
    "Blog Pizza Truck: guides complets sur la pizza napolitaine, la cuisson, les ingredients italiens et le savoir faire artisanal.";

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead title={title} description={description} pathname="/blog" />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">Blog</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          Blog pizza napolitaine
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          Retrouvez nos articles sur la pizza napolitaine artisanale, la cuisson au feu de bois, les produits italiens
          et les choix techniques qui font la qualite d une pizza.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {BLOG_ARTICLES.map((article) => (
          <article key={article.slug} className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white">{article.title}</h2>
            <p className="mt-2 text-sm text-stone-300">{article.excerpt || article.description}</p>
            <Link
              to={`/blog/${article.slug}`}
              className="mt-4 inline-flex rounded-full border border-saffron/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
            >
              Lire l'article
            </Link>
          </article>
        ))}
      </section>

      <SeoInternalLinks />
    </div>
  );
}
