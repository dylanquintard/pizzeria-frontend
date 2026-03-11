import { Link, useParams } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import {
  DEFAULT_TOUR_CITIES,
  buildDynamicCityContent,
  getCityPath,
  slugifyCity,
} from "../seo/localLandingContent";

function toDisplayCity(citySlug) {
  const normalized = String(citySlug || "")
    .replace(/-/g, " ")
    .trim();

  if (!normalized) return "Moselle";
  return normalized
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export default function CitySeoPage() {
  const params = useParams();
  const citySlug = slugifyCity(params.city);
  const cityDisplay = toDisplayCity(citySlug);
  const content = buildDynamicCityContent(cityDisplay);

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
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">Page ville dynamique</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">{content.h1}</h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">{content.intro}</p>
      </header>

      {content.sections.map((section) => (
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
        <h2 className="text-lg font-bold text-white">Autres villes de la tournee</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEFAULT_TOUR_CITIES.map((city) => (
            <Link
              key={city}
              to={getCityPath(city)}
              className="rounded-full border border-white/25 px-3 py-1 text-xs text-stone-200 transition hover:border-saffron/70 hover:text-saffron"
            >
              {city}
            </Link>
          ))}
        </div>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-lg font-bold text-white">Commander</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/menu"
            className="rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
          >
            Voir le menu
          </Link>
          <Link
            to="/tournee-camion"
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

