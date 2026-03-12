import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getLocations } from "../../api/location.api";
import { getCityPath } from "../../seo/localLandingContent";

const SEO_LINKS = [
  { to: "/", label: "Accueil" },
  { to: "/menu", label: "Menu" },
  { to: "/planing", label: "Horaires d'ouvertures camion" },
  { to: "/blog", label: "Blog" },
  { to: "/a-propos", label: "A propos" },
  { to: "/contact", label: "Contact" },
  { to: "/pizza-napolitaine-thionville", label: "Pizza Thionville" },
  { to: "/pizza-napolitaine-metz", label: "Pizza Metz" },
  { to: "/food-truck-pizza-moselle", label: "Pizza Moselle" },
];

export default function SeoInternalLinks() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    let cancelled = false;

    getLocations({ active: true })
      .then((data) => {
        if (!cancelled) {
          setLocations(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocations([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const links = useMemo(() => {
    const dynamicLinks = locations
      .map((location) => String(location?.name || location?.city || "").trim())
      .filter(Boolean)
      .map((name) => ({
        to: getCityPath(name),
        label: `Pizza ${name}`,
      }));

    const merged = new Map();

    for (const link of [...SEO_LINKS, ...dynamicLinks]) {
      if (!link?.to || !link?.label) continue;
      if (!merged.has(link.to)) {
        merged.set(link.to, link);
      }
    }

    return [...merged.values()];
  }, [locations]);

  return (
    <nav aria-label="Liens internes SEO" className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-saffron">Pages utiles</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
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
