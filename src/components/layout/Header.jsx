import { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { BRAND_LOGO_URL } from "../../config/env";

function CartItemRow({ item, onRemove, tr }) {
  const lineTotal = (Number(item.unitPrice || 0) * Number(item.quantity || 0)).toFixed(2);

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">{item.product?.name}</p>
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

function LanguageSelect({ language, setLanguage, tr, className = "", isLight = false }) {
  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{tr("Langue", "Language")}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className={`h-7 min-w-[56px] appearance-none rounded-full border pl-2.5 pr-6 text-[10px] font-semibold uppercase leading-none tracking-[0.12em] transition focus:border-saffron focus:outline-none ${
          isLight ? "border-stone-300 bg-white text-stone-800" : "border-white/20 bg-white/5 text-stone-100"
        }`}
        aria-label={tr("Langue", "Language")}
      >
        <option value="fr">FR</option>
        <option value="en">EN</option>
      </select>
      <span className={`pointer-events-none absolute right-2 ${isLight ? "text-stone-600" : "text-stone-300"}`}>
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}

function ThemeToggle({ isLight, onToggle, tr, className = "" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-7 w-[56px] items-center rounded-full border border-stone-400 bg-stone-400/70 px-1 transition ${className}`}
      aria-label={tr("Changer le theme", "Toggle theme")}
      title={isLight ? tr("Passer en mode sombre", "Switch to dark mode") : tr("Passer en mode clair", "Switch to light mode")}
    >
      <span
        className={`absolute left-1 inline-flex h-5 w-5 items-center justify-center rounded-full shadow-sm transition-transform ${
          isLight
            ? "translate-x-7 bg-white"
            : "translate-x-0 bg-charcoal"
        }`}
      />
      <span className="sr-only">
        {isLight ? tr("Mode sombre", "Dark mode") : tr("Mode clair", "Light mode")}
      </span>
    </button>
  );
}

export default function Header() {
  const location = useLocation();
  const { token, user, logout } = useContext(AuthContext);
  const { cartItems, cartTotal, itemCount, removeItem, clearCart, loading } = useContext(CartContext);
  const { language, setLanguage, tr } = useLanguage();
  const { theme, toggleTheme, setTheme } = useTheme();
  const isLightTheme = theme === "light";
  const iconColorClass = isLightTheme ? "text-stone-900" : "text-white";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasLogoError, setHasLogoError] = useState(false);
  const cartRef = useRef(null);
  const profileRef = useRef(null);
  const totalItems = Number(itemCount || 0);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminUser = user?.role === "ADMIN";
  const seoPageLinks = [
    { to: "/", label: tr("Accueil", "Home") },
    { to: "/menu", label: tr("Menu", "Menu") },
    { to: "/planing", label: tr("Horaires d'ouvertures", "Opening hours") },
    { to: "/a-propos", label: tr("A propos", "About") },
    { to: "/contact", label: tr("Contact", "Contact") },
  ];
  const adminMenuLinks = isAdminUser
      ? [
        { to: "/admin/orders", label: tr("Commandes", "Orders") },
        { to: "/admin/menu", label: tr("Menu", "Menu") },
        { to: "/admin/locations", label: tr("Adresses", "Addresses") },
        { to: "/admin/timeslots", label: tr("Horaires", "Schedules") },
        { to: "/admin/print", label: tr("Camions & Impressions", "Trucks & Printing") },
        { to: "/admin/tickets", label: tr("Tickets", "Tickets") },
        { to: "/admin/users", label: tr("Clients", "Users") },
        { to: "/admin/gallery", label: tr("Galerie", "Gallery") },
      ]
    : [];
  const safeAdminMenuLinks = adminMenuLinks.filter(
    (item) => item && typeof item.to === "string" && item.to
  );

  const closeMobileMenus = () => {
    setMobileOpen(false);
    setMobileAdminOpen(false);
  };

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

  useEffect(() => {
    if (isAdminRoute && theme !== "dark") {
      setTheme("dark");
    }
  }, [isAdminRoute, setTheme, theme]);

  return (
    <header className="app-header fixed inset-x-0 top-0 z-50 border-b border-saffron/20 bg-charcoal/90 backdrop-blur-xl">
      <div className="section-shell">
        <div className="flex min-h-[84px] items-center justify-between gap-3 py-2">
          <Link to="/" className="shrink-0 rounded-full border border-saffron/30 bg-white/5 px-4 py-2">
            {BRAND_LOGO_URL && !hasLogoError ? (
              <img
                src={BRAND_LOGO_URL}
                alt="Pizza Truck"
                className="block h-10 w-auto object-contain"
                loading="eager"
                decoding="async"
                onError={() => setHasLogoError(true)}
              />
            ) : (
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-saffron">Pizza Truck</span>
            )}
          </Link>

          <nav className="hidden xl:flex items-center gap-2 text-[13px] font-medium text-stone-200">
            {seoPageLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="whitespace-nowrap rounded-full px-3 py-1.5 transition hover:bg-saffron/10 hover:text-saffron"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSelect language={language} setLanguage={setLanguage} tr={tr} isLight={isLightTheme} className="hidden sm:inline-flex" />
            {!isAdminRoute && (
              <ThemeToggle isLight={isLightTheme} onToggle={toggleTheme} tr={tr} className="hidden sm:inline-flex" />
            )}

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
                    setMobileOpen(false);
                    setMobileAdminOpen(false);
                  }}
                  title={tr("Panier", "Cart")}
                  aria-label={tr("Panier", "Cart")}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-saffron/35 bg-white/5 transition hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-7 w-7 ${iconColorClass}`}>
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14h9.45c.75 0 1.41-.41 1.75-1.03L21 7H6.21l-.94-2H2v2h2l3.6 7.59-1.35 2.44C5.52 17.37 6.48 19 8 19h12v-2H8l1.16-2z" />
                  </svg>
                  <span className="absolute -right-1.5 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                    {totalItems}
                  </span>
                </button>

                {cartOpen && (
                  <div className="absolute right-0 mt-3 w-[340px] max-w-[90vw] rounded-2xl border border-stone-200 bg-white p-3 text-stone-900 shadow-2xl max-md:fixed max-md:left-2 max-md:right-2 max-md:top-[92px] max-md:mt-0 max-md:w-auto max-md:max-w-none">
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
                            className="theme-light-keep-white flex-1 rounded-lg bg-charcoal px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-stone-700"
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
                          className="theme-light-keep-white block w-full rounded-lg bg-charcoal px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-stone-700"
                        >
                          {tr("Commander", "Order")}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {token && !isAdminRoute && (
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((prev) => !prev);
                    setCartOpen(false);
                    setMobileOpen(false);
                    setMobileAdminOpen(false);
                  }}
                  title={tr("Espace client", "Account")}
                  aria-label={tr("Espace client", "Account")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-saffron/35 bg-white/5 transition hover:bg-white/10"
                  aria-expanded={profileOpen}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-7 w-7 ${iconColorClass}`}>
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
                      {!isAdminUser && (
                        <Link
                          to="/userorders"
                          className="rounded-md px-3 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-100"
                        >
                          {tr("Mes commandes", "My orders")}
                        </Link>
                      )}
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
              onClick={() => {
                setMobileOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setCartOpen(false);
                    setProfileOpen(false);
                  } else {
                    setMobileAdminOpen(false);
                  }
                  return next;
                });
              }}
              className={`xl:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-saffron/35 bg-white/5 transition hover:bg-white/10 ${iconColorClass}`}
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
          <div className="pb-4 xl:hidden max-h-[calc(100vh-96px)] overflow-y-auto overscroll-contain">
            <div className="glass-panel p-3">
              <div className="grid gap-1.5 text-sm text-stone-100">
                <div className="mb-1 flex items-center gap-2">
                  <LanguageSelect language={language} setLanguage={setLanguage} tr={tr} isLight={isLightTheme} />
                  {!isAdminRoute && <ThemeToggle isLight={isLightTheme} onToggle={toggleTheme} tr={tr} />}
                </div>

                {seoPageLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileMenus}
                    className="rounded-md px-3 py-2 transition hover:bg-white/10"
                  >
                    {item.label}
                  </Link>
                ))}

                {token ? (
                  <Link
                    to="/order"
                    onClick={closeMobileMenus}
                    className="mt-1 rounded-md bg-saffron px-3 py-2 text-center text-sm font-semibold text-charcoal"
                  >
                    {tr("Commander", "Order")}
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMobileMenus}
                    className="mt-1 rounded-md border border-saffron/70 px-3 py-2 text-center text-sm font-semibold text-saffron"
                  >
                    {tr("Se connecter", "Sign in")}
                  </Link>
                )}

                {token && (
                  <Link
                    to="/profile"
                    onClick={closeMobileMenus}
                    className="rounded-md px-3 py-2 text-sm transition hover:bg-white/10"
                  >
                    {tr("Informations personnelles", "Personal information")}
                  </Link>
                )}

                {token && !isAdminUser && (
                  <Link
                    to="/userorders"
                    onClick={closeMobileMenus}
                    className="rounded-md px-3 py-2 text-sm transition hover:bg-white/10"
                  >
                    {tr("Mes commandes", "My orders")}
                  </Link>
                )}

                {token && isAdminUser && safeAdminMenuLinks.length > 0 && (
                  <div className="mt-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-2">
                    <button
                      type="button"
                      onClick={() => setMobileAdminOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                      aria-expanded={mobileAdminOpen}
                    >
                      <span>{tr("Administration", "Administration")}</span>
                      <span className="text-xs">{mobileAdminOpen ? "^" : "v"}</span>
                    </button>
                    {mobileAdminOpen && (
                      <div className="mt-1 grid gap-1">
                        {safeAdminMenuLinks.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={closeMobileMenus}
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
                    onClick={() => {
                      closeMobileMenus();
                      logout();
                    }}
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
