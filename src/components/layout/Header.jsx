import { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";

function CartItemRow({ item, onRemove, tr }) {
  const lineTotal = (Number(item.unitPrice || 0) * Number(item.quantity || 0)).toFixed(2);

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">{item.pizza?.name}</p>
          <p className="text-xs text-stone-600">{tr("Qte", "Qty")}: {item.quantity}</p>
          {item.addedIngredients?.length > 0 && (
            <p className="text-[11px] text-emerald-700">+ {item.addedIngredients.map((ing) => ing.name).join(", ")}</p>
          )}
          {item.removedIngredients?.length > 0 && (
            <p className="text-[11px] text-amber-700">- {item.removedIngredients.map((ing) => ing.name).join(", ")}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="shrink-0 rounded-md border border-stone-300 px-2 py-1 text-[11px] font-semibold text-stone-700 transition hover:bg-stone-200"
        >
          {tr("Retirer", "Remove")}
        </button>
      </div>
      <p className="mt-2 text-right text-xs font-bold text-stone-800">{lineTotal} EUR</p>
    </div>
  );
}

export default function Header() {
  const location = useLocation();
  const { token, user, logout } = useContext(AuthContext);
  const { cartItems, cartTotal, itemCount, removeItem, clearCart, loading } = useContext(CartContext);
  const { language, setLanguage, tr } = useLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const cartRef = useRef(null);
  const profileRef = useRef(null);
  const totalItems = Number(itemCount || 0);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminUser = user?.role === "ADMIN";
  const onePageLinks = [
    { id: "menu", label: tr("Le Menu", "Menu") },
    { id: "galerie", label: tr("Galerie", "Gallery") },
    { id: "emplacements", label: tr("Emplacements & horaires d'ouverture", "Locations & opening hours") },
    { id: "paiements", label: tr("Moyens de paiement acceptes", "Accepted payment methods") },
    { id: "services", label: tr("Nos services", "Our services") },
    { id: "contact", label: tr("Nous contacter", "Contact us") },
  ];
  const adminMenuLinks = isAdminUser
    ? [
        { to: "/admin/orders", label: tr("Commandes", "Orders") },
        { to: "/admin/users", label: tr("Clients", "Users") },
        { to: "/admin/pizzas", label: tr("Pizzas", "Pizzas") },
        { to: "/admin/ingredients", label: tr("Ingredients", "Ingredients") },
        { to: "/admin/categories", label: tr("Categories", "Categories") },
        { to: "/admin/locations", label: tr("Emplacements", "Locations") },
        { to: "/admin/timeslots", label: tr("Creneaux", "Timeslots") },
        { to: "/admin/gallery", label: tr("Galerie", "Gallery") },
      ]
    : [];

  const navHref = (id) => (location.pathname === "/" ? `#${id}` : `/#${id}`);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setCartOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileAdminOpen(false);
    setCartOpen(false);
    setProfileOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-saffron/20 bg-charcoal/90 backdrop-blur-xl">
      <div className="section-shell">
        <div className="flex min-h-[84px] items-center justify-between gap-3 py-2">
          <Link to="/" className="shrink-0">
            <img
              src="/logo.png"
              alt="Pizza Truck"
              className="block w-auto object-contain"
              style={{ height: "72px", width: "auto", maxWidth: "none" }}
            />
          </Link>

          <nav className="hidden xl:flex items-center gap-4 text-[13px] font-medium text-stone-200">
            {onePageLinks.map((item) => (
              <a
                key={item.id}
                href={navHref(item.id)}
                className="whitespace-nowrap rounded-full px-3 py-1.5 transition hover:bg-saffron/10 hover:text-saffron"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center rounded-full border border-white/20 bg-white/5 p-0.5">
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                  language === "fr" ? "bg-saffron text-charcoal" : "text-stone-200 hover:bg-white/10"
                }`}
                aria-label={tr("Francais", "French")}
                title={tr("Francais", "French")}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                  language === "en" ? "bg-saffron text-charcoal" : "text-stone-200 hover:bg-white/10"
                }`}
                aria-label="English"
                title="English"
              >
                EN
              </button>
            </div>

            {token && user?.role === "ADMIN" && (
              <Link
                to="/admin/orders"
                className="hidden lg:inline-flex rounded-full border border-emerald-400/50 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
              >
                Admin
              </Link>
            )}

            {token ? (
              <Link
                to="/order"
                className="hidden md:inline-flex rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal shadow-fire transition hover:bg-amber-300"
              >
                {tr("Commander", "Order")}
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex rounded-full border border-saffron/70 px-4 py-2 text-xs font-bold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
              >
                {tr("Se connecter", "Sign in")}
              </Link>
            )}

            {token && !isAdminRoute && (
              <div ref={cartRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen((prev) => !prev);
                    setProfileOpen(false);
                  }}
                  title={tr("Panier", "Cart")}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-saffron/35 bg-white/5 transition hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-7 w-7">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14h9.45c.75 0 1.41-.41 1.75-1.03L21 7H6.21l-.94-2H2v2h2l3.6 7.59-1.35 2.44C5.52 17.37 6.48 19 8 19h12v-2H8l1.16-2z" />
                  </svg>
                  <span className="absolute -right-1.5 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                    {totalItems}
                  </span>
                </button>

                {cartOpen && (
                  <div className="absolute right-0 mt-3 w-[340px] max-w-[90vw] rounded-2xl border border-stone-200 bg-white p-3 text-stone-900 shadow-2xl">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide">{tr("Panier", "Cart")}</p>
                      <span className="chip">{totalItems}</span>
                    </div>

                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                      {loading && <p className="text-xs text-stone-500">{tr("Chargement...", "Loading...")}</p>}
                      {!loading && cartItems.length === 0 && <p className="text-xs text-stone-500">{tr("Votre panier est vide", "Your cart is empty")}</p>}
                      {cartItems.map((item) => (
                        <CartItemRow key={item.id} item={item} onRemove={removeItem} tr={tr} />
                      ))}
                    </div>

                    {!loading && cartItems.length > 0 && (
                      <div className="mt-3 border-t border-stone-200 pt-3">
                        <p className="mb-2 text-sm font-semibold">
                          {tr("Total", "Total")}: <span className="text-ember">{Number(cartTotal).toFixed(2)} EUR</span>
                        </p>
                        <div className="flex gap-2">
                          <Link
                            to="/order"
                            className="flex-1 rounded-lg bg-charcoal px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-stone-700"
                          >
                            {tr("Finaliser", "Checkout")}
                          </Link>
                          <button
                            type="button"
                            onClick={clearCart}
                            className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                          >
                            {tr("Vider", "Clear")}
                          </button>
                        </div>
                      </div>
                    )}

                    {!loading && cartItems.length === 0 && (
                      <div className="mt-3 border-t border-stone-200 pt-3">
                        <Link
                          to="/order"
                          className="block w-full rounded-lg bg-charcoal px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-stone-700"
                        >
                          {tr("Commander", "Order")}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {token && !isAdminRoute && !isAdminUser && (
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((prev) => !prev);
                    setCartOpen(false);
                  }}
                  title={tr("Espace client", "Account")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-saffron/35 bg-white/5 transition hover:bg-white/10"
                  aria-expanded={profileOpen}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-7 w-7">
                    <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-[260px] max-w-[90vw] rounded-2xl border border-stone-200 bg-white p-3 text-stone-900 shadow-2xl">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">{tr("Espace client", "Account")}</p>
                    <div className="grid gap-1">
                      <Link
                        to="/profile"
                        className="rounded-md px-3 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-100"
                      >
                        {tr("Informations personnelles", "Personal information")}
                      </Link>
                      <Link
                        to="/userorders"
                        className="rounded-md px-3 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-100"
                      >
                        {tr("Mes commandes", "My orders")}
                      </Link>
                      <button
                        type="button"
                        onClick={logout}
                        className="rounded-md px-3 py-2 text-left text-sm font-semibold text-ember transition hover:bg-rose-50"
                      >
                        {tr("Deconnexion", "Sign out")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="xl:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-saffron/35 bg-white/5 text-white transition hover:bg-white/10"
              aria-expanded={mobileOpen}
              aria-label={tr("Ouvrir le menu", "Open menu")}
            >
              {mobileOpen ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="pb-4 xl:hidden">
            <div className="glass-panel p-3">
              <div className="grid gap-1.5 text-sm text-stone-100">
                <div className="mb-1 inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 p-0.5">
                  <button
                    type="button"
                    onClick={() => setLanguage("fr")}
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                      language === "fr" ? "bg-saffron text-charcoal" : "text-stone-200 hover:bg-white/10"
                    }`}
                    aria-label={tr("Francais", "French")}
                    title={tr("Francais", "French")}
                  >
                    FR
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                      language === "en" ? "bg-saffron text-charcoal" : "text-stone-200 hover:bg-white/10"
                    }`}
                    aria-label="English"
                    title="English"
                  >
                    EN
                  </button>
                </div>

                {!isAdminRoute && onePageLinks.map((item) => (
                  <a key={item.id} href={navHref(item.id)} className="rounded-md px-3 py-2 transition hover:bg-white/10">
                    {item.label}
                  </a>
                ))}

                {isAdminRoute && (
                  <Link to="/" className="rounded-md px-3 py-2 transition hover:bg-white/10">
                    {tr("Accueil", "Home")}
                  </Link>
                )}

                {token ? (
                  <Link
                    to="/order"
                    className="mt-1 rounded-md bg-saffron px-3 py-2 text-center text-sm font-semibold text-charcoal"
                  >
                    {tr("Commander", "Order")}
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="mt-1 rounded-md border border-saffron/70 px-3 py-2 text-center text-sm font-semibold text-saffron"
                  >
                    {tr("Se connecter", "Sign in")}
                  </Link>
                )}

                {token && (
                  <Link to="/profile" className="rounded-md px-3 py-2 text-sm transition hover:bg-white/10">
                    {tr("Informations personnelles", "Personal information")}
                  </Link>
                )}

                {token && !isAdminUser && (
                  <Link to="/userorders" className="rounded-md px-3 py-2 text-sm transition hover:bg-white/10">
                    {tr("Mes commandes", "My orders")}
                  </Link>
                )}

                {token && user?.role === "ADMIN" && (
                  <div className="mt-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-2">
                    <button
                      type="button"
                      onClick={() => setMobileAdminOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                      aria-expanded={mobileAdminOpen}
                    >
                      <span>{tr("Administration", "Administration")}</span>
                      <span className="text-xs">{mobileAdminOpen ? "▲" : "▼"}</span>
                    </button>
                    {mobileAdminOpen && (
                      <div className="mt-1 grid gap-1">
                        {adminMenuLinks.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className="rounded-md px-3 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {token && (
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-md border border-white/20 px-3 py-2 text-left text-sm"
                  >
                    {tr("Deconnexion", "Sign out")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
