import ContactPanel from "../components/contact/ContactPanel";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
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
          Pour toute question sur la commande ou les horaires d'ouvertures, contacte-nous directement.
        </p>
      </header>

      <ContactPanel />

      <SeoInternalLinks />
    </div>
  );
}
