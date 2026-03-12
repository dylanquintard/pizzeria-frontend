import { Link } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import { buildDynamicCityFaq, LOCAL_PAGE_CONTENT } from "../seo/localLandingContent";

function buildFixedLocalFaq(cityLabel) {
  return [
    {
      question: `Le camion est-il present en permanence a ${cityLabel} ?`,
      answer:
        "Non. Le camion pizza n'est pas installe en permanence dans cette ville. Les passages dependent du planning actif.",
    },
    {
      question: "Ou voir les prochains passages du camion ?",
      answer:
        "Consultez la page Horaires & deplacements du camion pour voir les emplacements, jours et horaires mis a jour.",
    },
    {
      question: "Comment recuperer ma commande ?",
      answer:
        "Vous commandez en ligne puis vous recuperez votre pizza sur un point de passage actif du camion.",
    },
  ];
}

export default function LocalSeoPage({ cityKey }) {
  const content = LOCAL_PAGE_CONTENT[cityKey] || LOCAL_PAGE_CONTENT.moselle;
  const cityLabel = cityKey === "moselle" ? "Moselle" : cityKey === "metz" ? "Metz" : "Thionville";
  const isFixedLocalPage = ["thionville", "metz", "moselle"].includes(cityKey);
  const faq = isFixedLocalPage ? buildFixedLocalFaq(cityLabel) : buildDynamicCityFaq(cityLabel);

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

      {Array.isArray(faq) && faq.length > 0 && (
        <section className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white">Questions frequentes</h2>
          {isFixedLocalPage && (
            <p className="mt-2 text-sm font-semibold text-saffron">
              Le camion n&apos;est pas disponible en permanence dans cette ville.{" "}
              <Link to="/planing" className="underline decoration-saffron underline-offset-2">
                Horaires & deplacements du camion
              </Link>
            </p>
          )}
          <div className="mt-4 space-y-4">
            {faq.map((item, index) => (
              <article key={`faq-${index}`} className="rounded-xl border border-white/15 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-white">{item.question}</h3>
                <p className="mt-2 text-sm text-stone-300">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="glass-panel p-6">
        <h2 className="text-lg font-bold text-white">Commander votre pizza</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/menu"
            className="rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
          >
            Voir le menu des pizzas
          </Link>
          <Link
            to="/planing"
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Consulter les horaires d'ouvertures du camion pizza
          </Link>
        </div>
      </section>

      <SeoInternalLinks />
    </div>
  );
}
