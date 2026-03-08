import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const adminLinks = [
  { to: "/admin/orders", labelFr: "Commandes", labelEn: "Orders" },
  { to: "/admin/users", labelFr: "Clients", labelEn: "Users" },
  { to: "/admin/pizzas", labelFr: "Pizzas", labelEn: "Pizzas" },
  { to: "/admin/ingredients", labelFr: "Ingredients", labelEn: "Ingredients" },
  { to: "/admin/categories", labelFr: "Categories", labelEn: "Categories" },
  { to: "/admin/locations", labelFr: "Emplacements", labelEn: "Locations" },
  { to: "/admin/timeslots", labelFr: "Creneaux", labelEn: "Timeslots" },
  { to: "/admin/gallery", labelFr: "Galerie", labelEn: "Gallery" },
];

export default function Dashboard({ children }) {
  const { user } = useContext(AuthContext);
  const { tr } = useLanguage();

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="section-shell">
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
          {tr("Acces refuse: administrateur uniquement.", "Access denied: admin only.")}
        </p>
      </div>
    );
  }

  return (
    <div className="section-shell mx-auto max-w-6xl pb-10">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.25em] text-saffron">{tr("Administration", "Administration")}</p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-white sm:text-4xl">{tr("Tableau de bord", "Dashboard")}</h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-3 xl:sticky xl:top-24">
          <nav className="flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
            {adminLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition xl:block ${
                    isActive
                      ? "bg-saffron text-charcoal"
                      : "text-stone-200 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span>{tr(item.labelFr, item.labelEn)}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <section className="admin-card min-w-0">{children}</section>
      </div>
    </div>
  );
}
