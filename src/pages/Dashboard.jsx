import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const adminLinks = [
  { to: "/admin/orders", labelFr: "Commandes", labelEn: "Orders" },
  { to: "/admin/menu", labelFr: "Menu", labelEn: "Menu" },
  { to: "/admin/locations", labelFr: "Adresses", labelEn: "Addresses" },
  { to: "/admin/timeslots", labelFr: "Horaires", labelEn: "Schedules" },
  { to: "/admin/print", labelFr: "Camions & Impressions", labelEn: "Trucks & Printing" },
  { to: "/admin/tickets", labelFr: "Tickets", labelEn: "Tickets" },
  { to: "/admin/users", labelFr: "Clients", labelEn: "Users" },
  { to: "/admin/gallery", labelFr: "Galerie", labelEn: "Gallery" },
];

export default function Dashboard({ children }) {
  const { user } = useContext(AuthContext);
  const { tr } = useLanguage();
  const safeAdminLinks = adminLinks.filter(
    (item) => item && typeof item.to === "string" && item.to
  );

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

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden rounded-2xl border border-white/10 bg-white/5 p-4 lg:block">
          <nav className="space-y-2">
            {safeAdminLinks.map((item) => (
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
