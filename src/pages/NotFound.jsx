import { Link } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";

export default function NotFound() {
  return (
    <div className="section-shell space-y-6 pb-20 pt-12">
      <SeoHead
        title="Page non trouvee | Pizza Truck"
        description="La page demandee est introuvable."
        pathname="/404"
        robots="noindex,nofollow"
      />

      <p className="text-xs uppercase tracking-[0.25em] text-saffron">404</p>
      <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
        Page non trouvee
      </h1>
      <p className="max-w-2xl text-sm text-stone-300 sm:text-base">
        Le contenu demande n'existe pas ou n'est plus disponible.
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/"
          className="rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
        >
          Retour a l'accueil
        </Link>
        <Link
          to="/planing"
          className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          Voir les horaires d'ouvertures
        </Link>
      </div>
    </div>
  );
}
