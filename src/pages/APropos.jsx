import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";

export default function APropos() {
  const title = "A propos | Pizza Truck artisanal en Moselle";
  const description =
    "Decouvrez l'histoire de Pizza Truck: pizza napolitaine artisanale, cuisson au feu de bois et service mobile autour de Thionville et Metz.";

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={title}
        description={description}
        pathname="/a-propos"
        jsonLd={buildBaseFoodEstablishmentJsonLd({
          pagePath: "/a-propos",
          pageName: title,
          description,
        })}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">A propos</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          Une pizzeria mobile artisanale
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          Notre objectif est simple: proposer une pizza napolitaine reguliere, rapide a retirer et facile a commander.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white">Pate maison</h2>
          <p className="mt-2 text-sm text-stone-300">
            Une fermentation traditionnelle en 2 phases, pour une texture et un gout 100% italien.
          </p>
        </article>
        <article className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white">Produits italiens</h2>
          <p className="mt-2 text-sm text-stone-300">
            Une selection de produits d'Italie pour une carte pleine de saveurs mediterraneennes.
          </p>
        </article>
        <article className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white">Service efficace</h2>
          <p className="mt-2 text-sm text-stone-300">
            Commande en ligne, creneaux de retrait, et peu d'attente.
          </p>
        </article>
      </section>

      <section className="glass-panel p-6">
        <h2 className="font-display text-3xl uppercase tracking-wide text-white">Questions frequentes</h2>
        <div className="mt-4 space-y-4">
          <article>
            <h3 className="text-base font-semibold text-white">Ou trouver le camion pizza cette semaine ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Consultez les horaires d'ouvertures du camion pizza pour connaitre les prochains emplacements.
            </p>
          </article>
          <article>
            <h3 className="text-base font-semibold text-white">Le service est-il sur place ou a emporter ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Les pizzas sont disponibles uniquement a emporter directement au camion.
            </p>
          </article>
        </div>
      </section>

      <SeoInternalLinks />
    </div>
  );
}
