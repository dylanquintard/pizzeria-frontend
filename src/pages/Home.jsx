import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../api/category.api";
import { sendContactEmail } from "../api/contact.api";
import { INSTAGRAM_URL } from "../config/env";
import { getPublicGallery } from "../api/gallery.api";
import { getAllProductsClient } from "../api/user.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const upcomingLocations = [
  {
    spot: "Centre-ville",
    address: "Adresse precise a venir",
    days: "Lundi - Vendredi",
    hours: "18:00 - 22:00",
  },
  {
    spot: "Zone commerciale",
    address: "Adresse precise a venir",
    days: "Mardi - Samedi",
    hours: "12:00 - 14:00 / 18:00 - 22:30",
  },
  {
    spot: "Marche local",
    address: "Adresse precise a venir",
    days: "Dimanche",
    hours: "11:30 - 15:00",
  },
];

const paymentLogos = [
  { src: "/cb.png", alt: "CB", className: "h-9 w-auto object-contain" },
  { src: "/visa.png", alt: "VISA", className: "h-9 w-auto object-contain" },
  { src: "/mastercard.png", alt: "MASTERCARD", className: "h-9 w-auto object-contain" },
  { src: "/especes.png", alt: "Especes", className: "h-[60px] w-auto object-contain" },
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Home() {
  const { token, user } = useContext(AuthContext);
  const { tr } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactFeedback, setContactFeedback] = useState("");
  const [submittingContact, setSubmittingContact] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchHomeData() {
      try {
        const [productData, categoryData, galleryData] = await Promise.all([
          getAllProductsClient(),
          getCategories({ active: true, kind: "PRODUCT" }),
          getPublicGallery({ active: true }),
        ]);

        if (!cancelled) {
          setProducts(Array.isArray(productData) ? productData : []);
          setCategories(Array.isArray(categoryData) ? categoryData : []);
          setGalleryImages(Array.isArray(galleryData) ? galleryData : []);
        }
      } catch (_err) {
        if (!cancelled) {
          setProducts([]);
          setCategories([]);
          setGalleryImages([]);
        }
      }
    }

    fetchHomeData();
    return () => {
      cancelled = true;
    };
  }, []);

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
      imageUrl: "/pizza-background-1920.webp",
      title: tr("Four dore", "Golden oven"),
      description: tr("Image de reference", "Reference image"),
    },
  ];

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

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeGallery();
      }
      if (displayedGallery.length <= 1) return;
      if (event.key === "ArrowLeft") {
        showPreviousInGallery();
      }
      if (event.key === "ArrowRight") {
        showNextInGallery();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeGallery, displayedGallery.length, isGalleryModalOpen, showNextInGallery, showPreviousInGallery]);

  useEffect(() => {
    if (!user) return;
    setContactName((prev) => prev || user.name || "");
    setContactEmail((prev) => prev || user.email || "");
  }, [user]);

  const activeGalleryImage = displayedGallery[activeGalleryIndex] || null;

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (!contactName.trim()) {
      setContactFeedback(tr("Le nom est obligatoire.", "Name is required."));
      return;
    }

    const normalizedEmail = contactEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setContactFeedback(tr("L'email est obligatoire.", "Email is required."));
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setContactFeedback(tr("Format d'email invalide.", "Invalid email format."));
      return;
    }

    if (!contactMessage.trim()) {
      setContactFeedback(tr("Le message est obligatoire.", "Message is required."));
      return;
    }

    try {
      setSubmittingContact(true);
      setContactFeedback("");
      await sendContactEmail({
        name: contactName.trim(),
        email: normalizedEmail,
        subject: contactSubject.trim(),
        message: contactMessage.trim(),
      });
      setContactSubject("");
      setContactMessage("");
      setContactFeedback(tr("Message envoye par email. Nous vous repondrons rapidement.", "Email sent. We will reply quickly."));
    } catch (err) {
      setContactFeedback(err.response?.data?.error || tr("Impossible d'envoyer l'email.", "Unable to send email."));
    } finally {
      setSubmittingContact(false);
    }
  };

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
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(18,16,13,0.88) 5%, rgba(18,16,13,0.62) 40%, rgba(18,16,13,0.92) 100%), url('/pizza-background-1920.webp')",
          }}
        />
        <div className="section-shell relative py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <p className="chip mb-6">{tr("Camion pizza napolitaine", "Neapolitan pizza truck")}</p>
            <h1 className="theme-light-keep-white font-display text-5xl uppercase leading-none tracking-wide text-white sm:text-6xl lg:text-7xl">
              {tr(
                "Cuisson au four a bois, produits frais, pate a pizza maison.",
                "Wood-fired baking, fresh products, homemade pizza dough."
              )}
            </h1>
            <p className="theme-light-keep-white mt-6 max-w-2xl text-base text-stone-200 sm:text-lg">
              {tr(
                "Une carte lisible, des recettes courtes et de la qualite. Nos pizzas sont mises en avant avec une experience simple, rapide et moderne.",
                "A clear menu, short recipes and quality. Our pizzas are highlighted with a simple, fast and modern experience."
              )}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#menu"
                className="rounded-full bg-saffron px-6 py-3 text-sm font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
              >
                {tr("Voir le menu", "See menu")}
              </a>
              {token ? (
                <Link
                  to="/order"
                  className="theme-light-keep-white rounded-full border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-white/10"
                >
                  {tr("Commander maintenant", "Order now")}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="theme-light-keep-white rounded-full border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-white/10"
                >
                  {tr("Se connecter", "Sign in")}
                </Link>
              )}
            </div>
          </div>
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

      <section id="emplacements" className="section-shell space-y-6">
        <div>
          <p className="theme-light-keep-dark text-sm uppercase tracking-[0.25em] text-saffron">{tr("Emplacements & horaires d'ouverture", "Locations & opening hours")}</p>
          <h2 className="font-display text-4xl uppercase tracking-wide text-white">{tr("Tournee du camion", "Truck tour")}</h2>
          <p className="mt-2 text-sm text-stone-400">{tr("Adresses et horaires definitifs seront ajustes bientot.", "Final addresses and schedules will be adjusted soon.")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {upcomingLocations.map((location) => (
            <div key={location.spot} className="glass-panel p-5">
              <p className="text-lg font-bold text-white">
                {location.spot === "Centre-ville"
                  ? tr("Centre-ville", "City center")
                  : location.spot === "Zone commerciale"
                    ? tr("Zone commerciale", "Shopping area")
                    : location.spot === "Marche local"
                      ? tr("Marche local", "Local market")
                      : location.spot}
              </p>
              <p className="mt-2 text-sm text-stone-200">{tr("Adresse precise a venir", "Exact address coming soon")}</p>
              <p className="mt-3 text-xs uppercase tracking-wider text-saffron">
                {location.days === "Lundi - Vendredi"
                  ? tr("Lundi - Vendredi", "Monday - Friday")
                  : location.days === "Mardi - Samedi"
                    ? tr("Mardi - Samedi", "Tuesday - Saturday")
                    : location.days === "Dimanche"
                      ? tr("Dimanche", "Sunday")
                      : location.days}
              </p>
              <p className="text-sm text-stone-200">{location.hours}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="paiements" className="section-shell space-y-6">
        <div>
          <p className="theme-light-keep-dark text-sm uppercase tracking-[0.25em] text-saffron">{tr("Moyens de paiement acceptes", "Accepted payment methods")}</p>
          <h2 className="font-display text-4xl uppercase tracking-wide text-white">{tr("Simple et rapide", "Simple and fast")}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 lg:gap-10">
          {paymentLogos.map((logo) => (
            <img key={logo.src} src={logo.src} alt={logo.alt} className={logo.className} />
          ))}
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

      <section id="contact" className="section-shell">
        <div className="rounded-3xl border border-white/10 bg-oven-glow p-8 sm:p-10">
          <p className="theme-light-keep-dark text-sm uppercase tracking-[0.25em] text-saffron">{tr("Nous contacter", "Contact us")}</p>
          <h2 className="mt-2 font-display text-4xl uppercase tracking-wide text-white">{tr("On vous repond rapidement", "We reply quickly")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-charcoal/70 p-5">
              <p className="theme-light-keep-dark text-sm uppercase tracking-wider text-saffron">{tr("Telephone", "Phone")}</p>
              <p className="mt-2 text-lg font-semibold text-white">{tr("Numero a venir", "Number coming soon")}</p>
            </div>
            <div className="rounded-2xl bg-charcoal/70 p-5">
              <p className="theme-light-keep-dark text-sm uppercase tracking-wider text-saffron">Email</p>
              <p className="mt-2 text-lg font-semibold text-white">adresse@email-a-venir.com</p>
            </div>
            <div className="rounded-2xl bg-charcoal/70 p-5">
              <p className="theme-light-keep-dark text-sm uppercase tracking-wider text-saffron">{tr("RESEAU", "SOCIAL")}</p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg"
                  alt="Instagram"
                  className="h-8 w-8 object-contain"
                />
              </a>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/15 bg-charcoal/70 p-5">
            <p className="theme-light-keep-dark text-sm uppercase tracking-wider text-saffron">{tr("Formulaire de contact", "Contact form")}</p>
            <form onSubmit={handleContactSubmit} className="mt-3 space-y-3">
              <input
                type="text"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                placeholder={tr("Votre nom", "Your name")}
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-stone-400 focus:border-saffron focus:outline-none"
              />
              <input
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder={tr("Votre email", "Your email")}
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-stone-400 focus:border-saffron focus:outline-none"
              />
              <input
                type="text"
                value={contactSubject}
                onChange={(event) => setContactSubject(event.target.value)}
                placeholder={tr("Sujet (optionnel)", "Subject (optional)")}
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-stone-400 focus:border-saffron focus:outline-none"
              />
              <textarea
                rows={4}
                value={contactMessage}
                onChange={(event) => setContactMessage(event.target.value)}
                placeholder={tr("Votre message", "Your message")}
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-stone-400 focus:border-saffron focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={submittingContact}
                  className="rounded-full bg-saffron px-5 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingContact ? tr("Envoi...", "Sending...") : tr("Envoyer", "Send")}
                </button>
                {contactFeedback && <p className="text-xs text-stone-200">{contactFeedback}</p>}
              </div>
            </form>
          </div>
        </div>
      </section>

      {isGalleryModalOpen && activeGalleryImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-6xl rounded-2xl border border-white/20 bg-charcoal/95 p-4 sm:p-6">
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
