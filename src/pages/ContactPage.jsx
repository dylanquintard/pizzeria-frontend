import { Link } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { INSTAGRAM_URL } from "../config/env";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";

export default function ContactPage() {
  const title = "Contact | Camion pizza napolitaine en Moselle";
  const description =
    "Contactez Pizza Truck en Moselle. Informations de contact, Instagram et formulaire pour vos demandes.";

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={title}
        description={description}
        pathname="/contact"
        jsonLd={buildBaseFoodEstablishmentJsonLd({
          pagePath: "/contact",
          pageName: title,
          description,
        })}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">Contact</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          Nous contacter
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          Pour toute question sur la commande, la tournee ou les horaires, contacte-nous directement.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white">Instagram</h2>
          <p className="mt-2 text-sm text-stone-300">Suivez les actualites de la tournee et des services en cours.</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full border border-saffron/60 px-4 py-2 text-xs font-semibold text-saffron transition hover:bg-saffron/10"
          >
            Ouvrir Instagram
          </a>
        </article>

        <article className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white">Formulaire</h2>
          <p className="mt-2 text-sm text-stone-300">
            Le formulaire de contact est disponible sur la page d'accueil.
          </p>
          <Link
            to="/#contact"
            className="mt-4 inline-flex rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Aller au formulaire
          </Link>
        </article>
      </section>

      <SeoInternalLinks />
    </div>
  );
}

