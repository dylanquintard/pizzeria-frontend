import { Link } from "react-router-dom";

const SEO_LINKS = [
  { to: "/", label: "Accueil" },
  { to: "/menu", label: "Menu" },
  { to: "/tournee-camion", label: "Tournee camion" },
  { to: "/blog", label: "Blog" },
  { to: "/a-propos", label: "A propos" },
  { to: "/contact", label: "Contact" },
  { to: "/pizza-napolitaine-thionville", label: "Pizza napolitaine Thionville" },
  { to: "/pizza-napolitaine-metz", label: "Pizza napolitaine Metz" },
  { to: "/food-truck-pizza-moselle", label: "Food truck pizza Moselle" },
  { to: "/pizza-yutz", label: "Pizza Yutz" },
  { to: "/pizza-florange", label: "Pizza Florange" },
];

export default function SeoInternalLinks() {
  return (
    <nav aria-label="Liens internes SEO" className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-saffron">Pages utiles</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SEO_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
