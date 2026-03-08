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
    <div className="section-shell pb-12">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-saffron">{tr("Administration", "Administration")}</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white">{tr("Tableau de bord", "Dashboard")}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <nav className="space-y-2">
            {adminLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
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

        <section className="admin-card">{children}</section>
      </div>
    </div>
  );
}
