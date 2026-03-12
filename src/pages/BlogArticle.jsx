import { Link, Navigate, useParams } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { SITE_URL } from "../config/env";
import { getBlogArticleBySlug } from "../seo/blogContent";

export default function BlogArticle() {
  const params = useParams();
  const article = getBlogArticleBySlug(params.slug);

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const pathname = `/blog/${article.slug}`;
  const articleUrl = `${SITE_URL}${pathname}`;
  const articleImage = article.image || "/pizza-background-1920.webp";
  const publishedAt = article.publishedAt || "2026-03-01";
  const updatedAt = article.updatedAt || publishedAt;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: articleUrl,
    image: articleImage.startsWith("http") ? articleImage : `${SITE_URL}${articleImage}`,
    datePublished: publishedAt,
    dateModified: updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    author: {
      "@type": "Organization",
      name: "Pizza Truck",
    },
    publisher: {
      "@type": "Organization",
      name: "Pizza Truck",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.webp`,
      },
    },
  };

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={`${article.title} | Blog Pizza Truck`}
        description={article.description}
        pathname={pathname}
        image={articleImage}
        ogType="article"
        jsonLd={articleJsonLd}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">Article</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          {article.title}
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">{article.description}</p>
      </header>

      {Array.isArray(article.intro) && article.intro.length > 0 && (
        <section className="glass-panel p-6">
          {article.intro.map((paragraph, index) => (
            <p key={`intro-${index}`} className="text-sm leading-7 text-stone-300">
              {paragraph}
            </p>
          ))}
        </section>
      )}

      {Array.isArray(article.sections) &&
        article.sections.map((section, sectionIndex) => (
          <section key={`${section.heading}-${sectionIndex}`} className="glass-panel p-6">
            <h2 className="text-2xl font-bold text-white">{section.heading}</h2>

            {Array.isArray(section.blocks) &&
              section.blocks.map((block, blockIndex) => (
                <div key={`${section.heading}-block-${blockIndex}`} className="mt-5">
                  {block.subheading ? (
                    <h3 className="text-lg font-semibold text-white">{block.subheading}</h3>
                  ) : null}

                  {Array.isArray(block.paragraphs) &&
                    block.paragraphs.map((paragraph, paragraphIndex) => (
                      <p
                        key={`${section.heading}-paragraph-${blockIndex}-${paragraphIndex}`}
                        className="mt-3 text-sm leading-7 text-stone-300"
                      >
                        {paragraph}
                      </p>
                    ))}

                  {Array.isArray(block.list) && block.list.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-stone-300">
                      {block.list.map((item) => (
                        <li key={`${section.heading}-${blockIndex}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
          </section>
        ))}

      {Array.isArray(article.conclusion) && article.conclusion.length > 0 && (
        <section className="glass-panel p-6">
          <h2 className="text-2xl font-bold text-white">Conclusion</h2>
          {article.conclusion.map((paragraph, index) => (
            <p key={`conclusion-${index}`} className="mt-3 text-sm leading-7 text-stone-300">
              {paragraph}
            </p>
          ))}
        </section>
      )}

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
        <Link
          to="/planing"
          className="rounded-full border border-saffron/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
        >
          Voir les horaires d'ouvertures
        </Link>
      </div>

      <SeoInternalLinks />
    </div>
  );
}
