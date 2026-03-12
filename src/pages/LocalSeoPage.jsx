import { Link } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import { LOCAL_PAGE_CONTENT } from "../seo/localLandingContent";

export default function LocalSeoPage({ cityKey }) {
  const content = LOCAL_PAGE_CONTENT[cityKey] || LOCAL_PAGE_CONTENT.moselle;

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={content.title}
        description={content.description}
        pathname={content.pathname}
        jsonLd={buildBaseFoodEstablishmentJsonLd({
          pagePath: content.pathname,
          pageName: content.title,
          description: content.description,
        })}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">Page locale</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">{content.h1}</h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">{content.intro}</p>
      </header>

      {Array.isArray(content.sections) &&
        content.sections.map((section) => (
          <section key={section.heading} className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-7 text-stone-300">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

      <section className="glass-panel p-6">
        <h2 className="text-lg font-bold text-white">Commander une pizza</h2>
        <p className="mt-2 text-sm text-stone-300">
          Consulte le menu complet et choisis ton creneau de retrait.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/menu"
            className="rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
          >
            Voir le menu
          </Link>
          <Link
            to="/planing"
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Voir la tournee
          </Link>
        </div>
      </section>

      <SeoInternalLinks />
    </div>
  );
}
