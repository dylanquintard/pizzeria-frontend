import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../api/category.api";
import { getPublicGallery } from "../api/gallery.api";
import { getPublicWeeklySettings } from "../api/timeslot.api";
import { getAllProductsClient } from "../api/user.api";
import ContactPanel from "../components/contact/ContactPanel";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import { DEFAULT_TOUR_CITIES } from "../seo/localLandingContent";

const paymentLogos = [
  {
    src: "/payments/cb.webp",
    fallbackSrc: "/payments/cb.webp",
    alt: "CB",
    width: 112,
    height: 63,
    className: "h-9 w-auto object-contain",
  },
  {
    src: "/payments/visa.webp",
    fallbackSrc: "/payments/visa.webp",
    alt: "VISA",
    width: 67,
    height: 63,
    className: "h-9 w-auto object-contain",
  },
  {
    src: "/payments/mastercard.webp",
    fallbackSrc: "/payments/mastercard.webp",
    alt: "MASTERCARD",
    width: 90,
    height: 63,
    className: "h-9 w-auto object-contain",
  },
  {
    src: "/payments/especes.webp",
    fallbackSrc: "/payments/especes.webp",
    alt: "Especes",
    width: 105,
    height: 105,
    className: "h-[60px] w-auto object-contain",
  },
];

function formatPrice(value) {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric.toFixed(2);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const DAY_LABELS = {
  MONDAY: { fr: "Lundi", en: "Monday" },
  TUESDAY: { fr: "Mardi", en: "Tuesday" },
  WEDNESDAY: { fr: "Mercredi", en: "Wednesday" },
  THURSDAY: { fr: "Jeudi", en: "Thursday" },
  FRIDAY: { fr: "Vendredi", en: "Friday" },
  SATURDAY: { fr: "Samedi", en: "Saturday" },
  SUNDAY: { fr: "Dimanche", en: "Sunday" },
};
const DEFAULT_HOME_BACKGROUND = "/pizza-background-1920.webp";
const FOCUSABLE_SELECTOR =
  "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

function formatLocationAddress(location, tr) {
  if (!location) return tr("Adresse non renseignee", "Address not available");
  const cityLine = `${location.postalCode || ""} ${location.city || ""}`.trim();
  return [location.addressLine1, cityLine].filter(Boolean).join(", ");
}

function getSeoLocationLabel(location) {
  return String(location?.name || location?.city || "").trim();
}

function formatHourValue(timeValue) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(timeValue || "").trim());
  if (!match) return "--";
  const hours = match[1];
  const minutes = match[2];
  return minutes === "00" ? `${hours}H` : `${hours}H${minutes}`;
}

function formatHourRange(startTime, endTime) {
  return `${formatHourValue(startTime)}-${formatHourValue(endTime)}`;
}

export default function Home() {
  const { token } = useContext(AuthContext);
  const { tr } = useLanguage();
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [weeklySettings, setWeeklySettings] = useState([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const galleryModalRef = useRef(null);

useEffect(() => {
  let cancelled = false;

  async function fetchHomeData() {
    try {
      const [productData, categoryData, galleryData, weeklySettingsData] = await Promise.all([
        getAllProductsClient(),
        getCategories({ active: true, kind: "PRODUCT" }),
        getPublicGallery({ active: true }),
        getPublicWeeklySettings(),
      ]);

      if (!cancelled) {
        setProducts(Array.isArray(productData) ? productData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setGalleryImages(Array.isArray(galleryData) ? galleryData : []);
        setWeeklySettings(Array.isArray(weeklySettingsData) ? weeklySettingsData : []);
      }
    } catch (_err) {
      if (!cancelled) {
        setProducts([]);
        setCategories([]);
        setGalleryImages([]);
        setWeeklySettings([]);
      }
    }
  }

  fetchHomeData();
  return () => {
    cancelled = true;
  };
}, []);

const truckTourSchedule = useMemo(
  () => {
    const rows = (Array.isArray(weeklySettings) ? weeklySettings : []).flatMap(
      (entry, dayIndex) => {
        const services =
          Array.isArray(entry?.services) && entry.services.length > 0
            ? entry.services
            : entry?.isOpen && entry?.location
              ? [
                  {
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    locationId: entry.locationId,
                    location: entry.location,
                  },
                ]
              : [];

        return services
          .filter((service) => service?.location && entry?.dayOfWeek)
          .map((service, serviceIndex) => {
            const locationName = service.location?.name || tr("Emplacement", "Location");
            const address = formatLocationAddress(service.location, tr);
            const locationKey =
              service.locationId ||
              `${locationName.toLowerCase()}-${address.toLowerCase()}`;

            return {
              groupKey: `${entry.dayOfWeek}-${locationKey}`,
              sortKey: `${dayIndex}-${serviceIndex}`,
              locationName,
              address,
              dayLabel: tr(
                DAY_LABELS[entry.dayOfWeek]?.fr || entry.dayOfWeek,
                DAY_LABELS[entry.dayOfWeek]?.en || entry.dayOfWeek
              ),
              hours: formatHourRange(service.startTime, service.endTime),
            };
          });
      }
    );

    const grouped = new Map();
    for (const row of rows) {
      if (!grouped.has(row.groupKey)) {
        grouped.set(row.groupKey, {
          key: row.groupKey,
          sortKey: row.sortKey,
          locationName: row.locationName,
          address: row.address,
          dayLabel: row.dayLabel,
          hours: [],
        });
      }

      const current = grouped.get(row.groupKey);
      if (!current.hours.includes(row.hours)) {
        current.hours.push(row.hours);
      }
    }

    return [...grouped.values()]
      .sort((left, right) => String(left.sortKey).localeCompare(String(right.sortKey)))
      .map((entry) => ({
        key: entry.key,
        locationName: entry.locationName,
        address: entry.address,
        dayLabel: entry.dayLabel,
        hours: entry.hours,
      }));
  },
  [weeklySettings, tr]
);

  const truckTourCities = useMemo(() => {
    const source = Array.isArray(weeklySettings) ? weeklySettings : [];
    const dynamicLocations = source.flatMap((entry) => {
      const services =
        Array.isArray(entry?.services) && entry.services.length > 0
          ? entry.services
          : entry?.isOpen && entry?.location
            ? [{ location: entry.location }]
            : [];

      return services
        .map((service) => getSeoLocationLabel(service?.location))
        .filter(Boolean);
    });

    return [...new Set([...DEFAULT_TOUR_CITIES, ...dynamicLocations])];
  }, [weeklySettings]);

  const homeJsonLd = useMemo(() => {
    const base = buildBaseFoodEstablishmentJsonLd({
      pagePath: "/",
      pageName: "Pizza napolitaine au feu de bois en Moselle",
      description:
        "Camion pizza artisanal autour de Thionville et Metz, avec produits italiens authentiques et retrait rapide.",
    });

    const payload = {
      ...base,
      areaServed: truckTourCities,
    };

    return payload;
  }, [truckTourCities]);

  const menuByCategory = useMemo(() => {
    const grouped = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      items: products.filter((product) => product.categoryId === category.id),
    }));

    const uncategorized = products.filter((product) => !product.categoryId);
    if (uncategorized.length > 0) {
      grouped.push({
        id: "uncategorized",
        name: tr("Nos creations", "Our creations"),
        description: tr("Selections artisanales", "Craft selections"),
        items: uncategorized,
      });
    }

    if (grouped.length === 0 && products.length > 0) {
      grouped.push({
        id: "default",
        name: tr("Le menu", "Menu"),
        description: tr("Pizzas napolitaines", "Neapolitan pizzas"),
        items: products,
      });
    }

    const visibleGroups = grouped.filter((entry) => entry.items.length > 0);

    return visibleGroups
      .map((entry, index) => ({ entry, index }))
      .sort((left, right) => {
        const leftPriority = normalizeText(left.entry.name).includes("pizza") ? 0 : 1;
        const rightPriority = normalizeText(right.entry.name).includes("pizza") ? 0 : 1;
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
        return left.index - right.index;
      })
      .map(({ entry }) => entry);
  }, [categories, products, tr]);

  const galleryFallback = [
    {
      id: "fallback-1",
      imageUrl: DEFAULT_HOME_BACKGROUND,
      title: tr("Four dore", "Golden oven"),
      description: tr("Image de reference", "Reference image"),
    },
  ];

  const heroBackgroundUrl = useMemo(() => {
    const selectedBackground = galleryImages.find(
      (image) => image?.isHomeBackground && image?.imageUrl
    );
    return selectedBackground?.imageUrl || DEFAULT_HOME_BACKGROUND;
  }, [galleryImages]);

  const heroOverlay = theme === "light"
    ? "linear-gradient(118deg, rgba(246,235,221,0.90) 6%, rgba(246,235,221,0.68) 42%, rgba(58,38,28,0.48) 100%)"
    : "linear-gradient(120deg, rgba(18,16,13,0.88) 5%, rgba(18,16,13,0.62) 40%, rgba(18,16,13,0.92) 100%)";

  const displayedGallery = galleryImages.length > 0 ? galleryImages : galleryFallback;
  const visibleGallery = displayedGallery.slice(0, 3);

  const openGalleryAt = (index) => {
    setActiveGalleryIndex(index);
    setIsGalleryModalOpen(true);
  };

  const closeGallery = useCallback(() => setIsGalleryModalOpen(false), []);

  const showPreviousInGallery = useCallback(() => {
    setActiveGalleryIndex((prev) => (prev - 1 + displayedGallery.length) % displayedGallery.length);
  }, [displayedGallery.length]);

  const showNextInGallery = useCallback(() => {
    setActiveGalleryIndex((prev) => (prev + 1) % displayedGallery.length);
  }, [displayedGallery.length]);

  useEffect(() => {
    if (!isGalleryModalOpen) return;
    const modalElement = galleryModalRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const getFocusableElements = () => {
      if (!modalElement) return [];
      return Array.from(modalElement.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (element) => element instanceof HTMLElement && !element.hasAttribute("disabled")
      );
    };

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      modalElement?.focus();
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeGallery();
        return;
      }

      if (event.key === "Tab") {
        const elements = getFocusableElements();
        if (elements.length === 0) {
          event.preventDefault();
          modalElement?.focus();
          return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];
        const active = document.activeElement;

        if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (displayedGallery.length <= 1) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousInGallery();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextInGallery();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    };
  }, [closeGallery, displayedGallery.length, isGalleryModalOpen, showNextInGallery, showPreviousInGallery]);

  const activeGalleryImage = displayedGallery[activeGalleryIndex] || null;

  const renderGalleryCard = (image, index, heightClass) => (
    <button
      key={image.id || `${image.imageUrl}-${index}`}
      type="button"
      onClick={() => openGalleryAt(index)}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 text-left ${heightClass}`}
    >
      <img
        src={image.imageUrl}
        alt={image.altText || image.title || tr("Image galerie", "Gallery image")}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/90 to-transparent p-3">
        <p className="theme-light-keep-white text-sm font-semibold text-white">{image.title || tr("Galerie", "Gallery")}</p>
        <p className="theme-light-keep-white text-xs text-stone-300">{image.description || tr("Qualite artisanale", "Craft quality")}</p>
      </div>
    </button>
  );

  return (
    <div className="space-y-20 pb-24">
      <SeoHead
        title="Pizza napolitaine au feu de bois en Moselle | Pizza Truck"
        description="Camion pizza artisanal autour de Thionville et Metz, avec produits italiens authentiques et retrait rapide."
        pathname="/"
        jsonLd={homeJsonLd}
      />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBackgroundUrl}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: heroOverlay,
            }}
          />
        </div>
        <div className="section-shell relative py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <h1
              className={`font-display text-5xl uppercase leading-none tracking-wide sm:text-6xl lg:text-7xl ${
                isLightTheme ? "text-[#3A261C]" : "theme-light-keep-white text-white"
              }`}
            >
              {tr(
                "Pizza napolitaine au feu de bois en Moselle",
                "Wood-fired Neapolitan pizza in Moselle"
              )}
            </h1>
            <p
              className={`mt-6 max-w-2xl text-base sm:text-lg ${
                isLightTheme ? "text-[#1A1817]/80" : "theme-light-keep-white text-stone-200"
              }`}
            >
              {tr(
                "Camion pizza artisanal autour de Thionville et Metz, avec produits italiens authentiques et retrait rapide.",
                "Craft pizza truck around Thionville and Metz, with authentic Italian products and quick pickup."
              )}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#menu"
                className="rounded-full bg-saffron px-6 py-3 text-sm font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
              >
                {tr("Voir le menu", "See menu")}
              </a>
              <Link
                to="/planing"
                className={`rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition ${
                  isLightTheme
                    ? "border border-[#3A261C]/15 bg-white/70 text-[#3A261C] hover:bg-white"
                    : "theme-light-keep-white border border-white/30 text-white hover:bg-white/10"
                }`}
              >
                {tr("Voir les horaires d'ouvertures", "See opening hours")}
              </Link>
              {token ? (
                <Link
                  to="/order"
                  className={`rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition ${
                    isLightTheme
                      ? "border border-[#3A261C]/15 bg-white/70 text-[#3A261C] hover:bg-white"
                      : "theme-light-keep-white border border-white/30 text-white hover:bg-white/10"
                  }`}
                >
                  {tr("Commander maintenant", "Order now")}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className={`rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition ${
                    isLightTheme
                      ? "border border-[#3A261C]/15 bg-white/70 text-[#3A261C] hover:bg-white"
                      : "theme-light-keep-white border border-white/30 text-white hover:bg-white/10"
                  }`}
                >
                  {tr("Se connecter", "Sign in")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
      <section id="galerie" className="section-shell space-y-6">
        <div>
          <p className="theme-light-keep-dark text-sm uppercase tracking-[0.25em] text-white">
            {tr("Le camion, le four dore, nos pizzas, etc...", "The truck, the golden oven, our pizzas, and more...")}
          </p>
        </div>
        <div className="mx-auto grid w-[90%] gap-4">
          {visibleGallery[0] && renderGalleryCard(visibleGallery[0], 0, "h-80 lg:h-[32rem]")}

          {(visibleGallery[1] || visibleGallery[2]) && (
            <div className={`grid gap-4 ${visibleGallery[2] ? "sm:grid-cols-2" : ""}`}>
              {visibleGallery[1] && renderGalleryCard(visibleGallery[1], 1, "h-64 lg:h-[22rem]")}
              {visibleGallery[2] && renderGalleryCard(visibleGallery[2], 2, "h-64 lg:h-[22rem]")}
            </div>
          )}
        </div>
      </section>

      <section id="menu" className="section-shell space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="theme-light-keep-dark text-4xl uppercase tracking-[0.25em] text-saffron">{tr("Le Menu", "Menu")}</p>
          </div>
          <span className="rounded-full border border-saffron/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-saffron">
            {tr("Carte artisanale", "Craft menu")}
          </span>
        </div>

        {menuByCategory.length === 0 ? (
          <div className="glass-panel p-6 text-stone-300">{tr("Le menu sera disponible ici.", "The menu will be available here.")}</div>
        ) : (
          <div className="space-y-8">
            {menuByCategory.map((group) => (
              <article key={group.id} className="rounded-3xl border border-white/10 bg-charcoal/35 p-5 sm:p-7">
                <div className="mb-4 border-b border-white/10 pb-3">
                  <h3 className="font-display text-3xl uppercase tracking-[0.08em] text-crust sm:text-4xl">{group.name}</h3>
                  {group.description && <p className="mt-1 text-sm text-stone-400">{group.description}</p>}
                </div>

                <div>
                  {group.items.map((product) => (
                    <div key={product.id} className="border-b border-white/10 py-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <h4 className="text-base font-semibold uppercase tracking-wide text-white sm:text-lg">{product.name}</h4>
                        <div className="mt-3 hidden h-px flex-1 border-t border-dashed border-stone-500/70 sm:block" />
                        <span className="whitespace-nowrap text-sm font-extrabold uppercase tracking-wide text-saffron sm:text-base">
                          {formatPrice(product.basePrice)} EUR
                        </span>
                      </div>

                      {product.description && <p className="mt-1 text-sm text-stone-300">{product.description}</p>}

                      {product.ingredients?.length > 0 && (
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone-400">
                          {product.ingredients.map((entry) => entry.ingredient.name).join(" - ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="emplacements" className="section-shell space-y-6">
        <div>
          <p className="theme-light-keep-dark text-sm uppercase tracking-[0.25em] text-saffron">{tr("Emplacements & horaires d'ouverture", "Locations & opening hours")}</p>
          <h2 className="font-display text-4xl uppercase tracking-wide text-white">{tr("Emplacements du camion pizza", "Pizza truck locations")}</h2>
          <p className="mt-2 text-sm text-stone-400">
            {tr(
              "Retrouvez notre camion pizza napolitaine dans plusieurs villes autour de Thionville et Metz selon les horaires d'ouvertures hebdomadaires.",
              "Find our Neapolitan pizza truck in several cities around Thionville and Metz according to weekly opening hours."
            )}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
{truckTourSchedule.length === 0 ? (
  <div className="glass-panel p-5 text-sm text-stone-300">
    {tr("Aucun horaire disponible pour le moment.", "No opening hours available for now.")}
  </div>
) : (
  truckTourSchedule.map((location) => (
    <div key={location.key} className="glass-panel p-5">
      <p className="text-[11px] uppercase tracking-wider text-saffron">{tr("Nom", "Name")}</p>
      <p className="mt-1 text-lg font-bold text-white">{location.locationName}</p>

      <p className="mt-3 text-[11px] uppercase tracking-wider text-saffron">{tr("Adresse", "Address")}</p>
      <p className="mt-1 text-sm text-stone-200">{location.address}</p>

      <p className="mt-3 text-[11px] uppercase tracking-wider text-saffron">{tr("Jour d'ouverture", "Opening day")}</p>
      <p className="mt-1 text-sm text-stone-200">{location.dayLabel}</p>

      <p className="mt-3 text-[11px] uppercase tracking-wider text-saffron">{tr("Horaires", "Hours")}</p>
      <div className="mt-1 space-y-1 text-sm text-stone-200">
        {(Array.isArray(location.hours) ? location.hours : []).map((hour) => (
          <p key={hour}>{hour}</p>
        ))}
      </div>
    </div>
  ))
)}
        </div>
      </section>

      <section id="services" className="section-shell space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-saffron">{tr("Nos services", "Our services")}</p>
          <h2 className="font-display text-4xl uppercase tracking-wide text-white">{tr("A emporter uniquement", "Takeaway only")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-panel p-6">
            <p className="text-xl font-bold text-white">{tr("Commande rapide", "Fast ordering")}</p>
            <p className="mt-2 text-sm text-stone-300">
              {tr(
                "Passez commande en ligne, choisissez votre creneau et recuperez votre pizza chaude directement au camion.",
                "Order online, choose your timeslot and pick up your hot pizza directly at the truck."
              )}
            </p>
          </div>
          <div className="glass-panel p-6">
            <p className="text-xl font-bold text-white">{tr("Qualite constante", "Consistent quality")}</p>
            <p className="mt-2 text-sm text-stone-300">
              {tr(
                "Pates travaillees, produits selectionnes et cuisson minute. Service fluide, tres peu d'attente.",
                "Prepared doughs, selected products and minute baking. Smooth service, very little waiting."
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell space-y-6">
        <div className="grid gap-5 xl:grid-cols-12">
          <article className="glass-panel p-6 sm:p-8 xl:col-span-7">
            <p className="text-xs uppercase tracking-[0.2em] text-saffron">Pizza truck Moselle</p>
            <h2 className="mt-2 font-display text-3xl uppercase tracking-wide text-white">
              Camion pizza napolitaine autour de Thionville et Metz
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
              Notre camion pizza propose des pizzas napolitaines artisanales dans le nord de la Moselle.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300 sm:text-base">
              Les horaires d'ouvertures du camion couvrent regulierement plusieurs villes autour de Thionville, Metz et des communes voisines.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300 sm:text-base">
              Les pizzas sont preparees avec une pate napolitaine traditionnelle et des produits italiens selectionnes.
            </p>
          </article>

          <article className="glass-panel p-6 sm:p-8 xl:col-span-5">
            <h2 className="font-display text-3xl uppercase tracking-wide text-white">
              Pizza napolitaine artisanale avec produits italiens
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-300 sm:text-base">
              Chaque pizza est preparee avec des ingredients italiens reconnus pour leur qualite:
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-stone-200 sm:grid-cols-2">
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">farine Nuvola Super</li>
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">tomates San Marzano</li>
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">mozzarella fior di latte</li>
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">parmigiano reggiano</li>
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">jambon de Parme</li>
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">prosciutto italien</li>
            </ul>
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-saffron">
              pizza napolitaine artisanale | pizza produits italiens | pizza italienne traditionnelle
            </p>
          </article>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="glass-panel p-6 sm:p-8">
            <h2 className="font-display text-3xl uppercase tracking-wide text-white">
              Cuisson au four a bois et gaz
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-300 sm:text-base">
              La cuisson se fait dans un four a bois et gaz permettant d'obtenir une pizza legere, alveolee et croustillante.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300 sm:text-base">
              Chaque pizza est preparee a la commande afin de garantir une qualite constante.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-[11px] uppercase tracking-wide text-saffron">
                pizza napolitaine feu de bois
              </span>
              <span className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-[11px] uppercase tracking-wide text-saffron">
                pizza feu de bois thionville
              </span>
              <span className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-[11px] uppercase tracking-wide text-saffron">
                pizza artisanale moselle
              </span>
              <span className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-[11px] uppercase tracking-wide text-saffron">
                camion pizza napolitaine
              </span>
            </div>
          </article>

          <article className="glass-panel p-6 sm:p-8">
            <h2 className="font-display text-3xl uppercase tracking-wide text-white">
              Ou trouver notre camion pizza
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-300 sm:text-base">
              Retrouvez notre camion pizza dans plusieurs villes autour de Thionville et Metz.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300 sm:text-base">
              Les emplacements changent selon les horaires d'ouvertures hebdomadaires.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300 sm:text-base">
              Consultez la page horaires d'ouvertures du camion pour connaitre les horaires et points de retrait.
            </p>
            <Link
              to="/planing"
              className="mt-5 inline-flex rounded-full border border-saffron/60 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
            >
              Voir les horaires d'ouvertures
            </Link>
          </article>
        </div>
      </section>

      <section id="paiements" className="section-shell space-y-6">
        <div>
          <p className="theme-light-keep-dark text-sm uppercase tracking-[0.25em] text-saffron">{tr("Moyens de paiement acceptes", "Accepted payment methods")}</p>
          <h2 className="font-display text-4xl uppercase tracking-wide text-white">{tr("Simple et rapide", "Simple and fast")}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 lg:gap-10">
          {paymentLogos.map((logo) => (
            <picture key={logo.alt}>
              <source srcSet={logo.src} type="image/webp" />
              <img
                src={logo.fallbackSrc}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                loading="lazy"
                decoding="async"
                className={logo.className}
              />
            </picture>
          ))}
        </div>
      </section>

      <ContactPanel sectionId="contact" sectionClassName="section-shell" />

      <section className="section-shell">
        <SeoInternalLinks />
      </section>

      {isGalleryModalOpen && activeGalleryImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4">
          <div
            ref={galleryModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-modal-title"
            tabIndex={-1}
            className="w-full max-w-6xl rounded-2xl border border-white/20 bg-charcoal/95 p-4 sm:p-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-stone-400">
                {tr("Photo", "Photo")} {activeGalleryIndex + 1} / {displayedGallery.length}
              </p>
              <button
                type="button"
                onClick={closeGallery}
                className="rounded-full border border-white/25 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                {tr("Fermer", "Close")}
              </button>
            </div>
            <h2 id="gallery-modal-title" className="sr-only">
              {tr("Galerie en plein ecran", "Fullscreen gallery")}
            </h2>

            <div className="relative">
              <div className="relative mx-auto w-fit overflow-hidden rounded-xl">
                <img
                  src={activeGalleryImage.imageUrl}
                  alt={activeGalleryImage.altText || activeGalleryImage.title || tr("Image galerie", "Gallery image")}
                  className="block max-h-[68vh] w-auto max-w-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/90 to-transparent p-3">
                  <p className="theme-light-keep-white text-sm font-semibold text-white">{activeGalleryImage.title || tr("Galerie", "Gallery")}</p>
                  <p className="theme-light-keep-white text-xs text-stone-300">
                    {activeGalleryImage.description || tr("Qualite artisanale", "Craft quality")}
                  </p>
                </div>
              </div>

              {displayedGallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousInGallery}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-charcoal/80 p-2 text-white transition hover:bg-charcoal"
                    aria-label={tr("Image precedente", "Previous image")}
                  >
                    {"<"}
                  </button>
                  <button
                    type="button"
                    onClick={showNextInGallery}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-charcoal/80 p-2 text-white transition hover:bg-charcoal"
                    aria-label={tr("Image suivante", "Next image")}
                  >
                    {">"}
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {displayedGallery.map((image, index) => (
                <button
                  key={image.id || `${image.imageUrl}-${index}`}
                  type="button"
                  onClick={() => setActiveGalleryIndex(index)}
                  className={`shrink-0 overflow-hidden rounded-lg border ${
                    index === activeGalleryIndex ? "border-saffron" : "border-white/20"
                  }`}
                  aria-label={`${tr("Aller a l'image", "Go to image")} ${index + 1}`}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.altText || image.title || `${tr("Miniature", "Thumbnail")} ${index + 1}`}
                    className="h-16 w-24 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

