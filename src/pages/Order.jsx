import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../api/category.api";
import { getLocations } from "../api/location.api";
import { getPickupAvailability } from "../api/timeslot.api";
import {
  addToCart,
  finalizeOrder,
  getAllIngredients,
  getAllProductsClient,
} from "../api/user.api";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useRealtimeEvents } from "../hooks/useRealtimeEvents";

const FOCUSABLE_SELECTOR =
  "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

function toLocalIsoDate(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftIsoDate(isoDate, delta) {
  const next = new Date(`${isoDate}T00:00:00`);
  next.setDate(next.getDate() + delta);
  return toLocalIsoDate(next);
}

function formatNavigatorDate(isoDate, locale) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(locale, {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed.toFixed(2);
}

function getCartItemProduct(item) {
  return item?.product || item?.menuItem || null;
}

function getCartItemName(item) {
  return getCartItemProduct(item)?.name || item?.name || `Produit #${item?.id ?? "?"}`;
}

function getCartIngredientName(ingredient) {
  return ingredient?.name || ingredient?.ingredient?.name || "";
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isPizzaCategoryLabel(value) {
  return normalizeText(value).includes("pizza");
}

function formatPickupAddress(location, tr) {
  if (!location) return tr("Adresse de retrait non disponible", "Pickup address unavailable");
  const cityLine = `${location.postalCode || ""} ${location.city || ""}`.trim();
  return [location.addressLine1, cityLine].filter(Boolean).join(", ");
}

function ProductCustomizerModal({
  product,
  ingredients,
  selectedExtras,
  removedIngredients,
  quantity,
  onClose,
  onExtrasChange,
  onRemovedChange,
  onQuantityChange,
  onConfirm,
  tr,
}) {
  const baseIngredients = Array.isArray(product.ingredients)
    ? product.ingredients.map((entry) => entry?.ingredient).filter(Boolean)
    : [];

  const groupedExtras = ingredients.reduce((acc, ingredient) => {
    const key = String(ingredient.category?.id ?? "uncategorized");
    if (!acc[key]) {
      acc[key] = {
        key,
        label: ingredient.category?.name || tr("Sans categorie", "Uncategorized"),
        items: [],
      };
    }
    acc[key].items.push(ingredient);
    return acc;
  }, {});

  const groupedBaseIngredients = baseIngredients.reduce((acc, ingredient) => {
    const key = String(ingredient.category?.id ?? "uncategorized");
    if (!acc[key]) {
      acc[key] = {
        key,
        label: ingredient.category?.name || tr("Sans categorie", "Uncategorized"),
        items: [],
      };
    }
    acc[key].items.push(ingredient);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-stone-900 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">{tr("Personnaliser", "Customize")}: {product.name}</h3>
          <button type="button" onClick={onClose} className="rounded-md border border-stone-300 px-3 py-1 text-sm">
            {tr("Fermer", "Close")}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{tr("Supplements", "Extras")}</p>
            <div className="space-y-3">
              {ingredients.length === 0 && (
                <p className="text-xs text-stone-500">{tr("Aucun supplement disponible.", "No extra available.")}</p>
              )}
              {Object.values(groupedExtras).map((group) => (
                <div key={group.key} className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{group.label}</p>
                  {group.items.map((ingredient) => (
                    <label
                      key={ingredient.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition hover:bg-stone-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedExtras.some((entry) => entry.id === ingredient.id)}
                        onChange={(event) => onExtrasChange(ingredient, event.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-saffron"
                      />
                      <span>
                        {ingredient.name} (+{formatPrice(ingredient.price)} EUR)
                      </span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{tr("Retirer ingredients", "Remove ingredients")}</p>
            <div className="space-y-3">
              {baseIngredients.length === 0 && (
                <p className="text-xs text-stone-500">{tr("Aucun ingredient a retirer pour ce produit.", "No ingredient can be removed for this product.")}</p>
              )}
              {Object.values(groupedBaseIngredients).map((group) => (
                <div key={group.key} className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{group.label}</p>
                  {group.items.map((ingredient) => (
                    <label
                      key={ingredient.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition hover:bg-stone-100"
                    >
                      <input
                        type="checkbox"
                        checked={removedIngredients.some((entry) => entry.id === ingredient.id)}
                        onChange={(event) => onRemovedChange(ingredient, event.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-saffron"
                      />
                      <span>{ingredient.name}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
          <label className="text-sm">
            {tr("Quantite", "Quantity")}
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(event) => onQuantityChange(Number(event.target.value || 1))}
              className="ml-2 w-20 rounded-md border border-stone-300 bg-white px-2 py-1 text-stone-900"
            />
          </label>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white hover:bg-tomato"
          >
            {tr("Ajouter au panier", "Add to cart")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Order() {
  const { token } = useContext(AuthContext);
  const { tr, locale } = useLanguage();
  const navigate = useNavigate();
  const { cartItems, itemCount, cartTotal, setCartFromResponse, refreshCart, removeItem, clearCart, loading: cartLoading } =
    useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [extras, setExtras] = useState([]);
  const [locations, setLocations] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toLocalIsoDate(new Date()));
  const [selectedPickupTime, setSelectedPickupTime] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isFinalizeConfirmOpen, setIsFinalizeConfirmOpen] = useState(false);
  const [validatedCartSignature, setValidatedCartSignature] = useState("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [activeCategoryKey, setActiveCategoryKey] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const finalizeModalRef = useRef(null);

  const todayIso = toLocalIsoDate(new Date());
  const canGoPreviousDate = selectedDate > todayIso;
  const quantityForAvailability = Math.max(1, Number(itemCount || 0));
  const cartSignature = useMemo(
    () =>
      cartItems
        .map((item) => {
          const added = (item.addedIngredients || [])
            .map((entry) => getCartIngredientName(entry))
            .join(",");
          const removed = (item.removedIngredients || [])
            .map((entry) => getCartIngredientName(entry))
            .join(",");
          return `${item.id}:${item.quantity}:${item.unitPrice}:${added}:${removed}`;
        })
        .join("|"),
    [cartItems]
  );
  const isCartValidated =
    cartItems.length > 0 &&
    validatedCartSignature !== "" &&
    validatedCartSignature === cartSignature;

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialData() {
      try {
        const [productData, categoryData, ingredientData, locationData] = await Promise.all([
          getAllProductsClient(),
          getCategories({ active: true, kind: "PRODUCT" }),
          getAllIngredients(token, { isExtra: true }),
          getLocations({ active: true }),
        ]);

        if (!cancelled) {
          setProducts(Array.isArray(productData) ? productData : []);
          setCategories(Array.isArray(categoryData) ? categoryData : []);
          setExtras(Array.isArray(ingredientData) ? ingredientData : []);
          setLocations(Array.isArray(locationData) ? locationData : []);
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(err.response?.data?.error || tr("Erreur lors du chargement de la page commande", "Error while loading order page"));
        }
      }
    }

    fetchInitialData();
    return () => {
      cancelled = true;
    };
  }, [token, tr]);

  const refreshAvailability = useCallback(async () => {
    if (!isCartValidated || itemCount <= 0) {
      setAvailabilitySlots([]);
      setSelectedPickupTime("");
      setSelectedLocationId("");
      return;
    }

    try {
      const response = await getPickupAvailability(token, {
        date: selectedDate,
        quantity: quantityForAvailability,
      });

      const slots = Array.isArray(response?.slots) ? response.slots : [];
      const availableSlots = slots.filter((slot) => slot.availableForQuantity);
      setAvailabilitySlots(availableSlots);
    } catch (err) {
      setAvailabilitySlots([]);
      setMessage(
        err.response?.data?.error ||
          tr("Impossible de recuperer les disponibilites", "Unable to fetch pickup availability")
      );
    }
  }, [isCartValidated, itemCount, selectedDate, quantityForAvailability, token, tr]);

  useEffect(() => {
    refreshAvailability();
  }, [refreshAvailability]);

  useEffect(() => {
    const hasSelectedTime = availabilitySlots.some(
      (slot) => slot.pickupTime === selectedPickupTime
    );
    if (!hasSelectedTime) {
      setSelectedPickupTime("");
      setSelectedLocationId("");
      return;
    }

    const hasSelectedLocation = availabilitySlots.some(
      (slot) =>
        slot.pickupTime === selectedPickupTime &&
        String(slot.locationId) === String(selectedLocationId)
    );
    if (!hasSelectedLocation) {
      setSelectedLocationId("");
    }
  }, [availabilitySlots, selectedPickupTime, selectedLocationId]);

  const handleRealtimeEvent = useCallback(
    (eventName) => {
      if (eventName === "timeslots:updated") {
        refreshAvailability();
        return;
      }

      if (eventName === "locations:updated") {
        getLocations({ active: true })
          .then((locationData) => {
            setLocations(Array.isArray(locationData) ? locationData : []);
            refreshAvailability();
          })
          .catch(() => {});
        return;
      }

      if (eventName === "cart:updated" || eventName === "orders:user-updated") {
        refreshCart();
        refreshAvailability();
      }
    },
    [refreshAvailability, refreshCart]
  );

  useRealtimeEvents({
    enabled: Boolean(token),
    onEvent: handleRealtimeEvent,
    onConnectionChange: setRealtimeConnected,
  });

  useEffect(() => {
    if (cartItems.length === 0) {
      setValidatedCartSignature("");
      setSelectedPickupTime("");
      setSelectedLocationId("");
    }
  }, [cartItems.length]);

  const timeOptions = useMemo(() => {
    const grouped = new Map();
    for (const slot of availabilitySlots) {
      const key = slot.pickupTime;
      if (!grouped.has(key)) {
        grouped.set(key, {
          pickupTime: key,
          remainingCapacity: 0,
          locationCount: 0,
        });
      }

      const current = grouped.get(key);
      current.remainingCapacity += Number(slot.remainingCapacity || 0);
      current.locationCount += 1;
    }

    return [...grouped.values()].sort((left, right) =>
      String(left.pickupTime).localeCompare(String(right.pickupTime))
    );
  }, [availabilitySlots]);

  const locationsForSelectedTime = useMemo(
    () =>
      availabilitySlots
        .filter((slot) => slot.pickupTime === selectedPickupTime)
        .sort((left, right) =>
          String(left.location?.name || "").localeCompare(String(right.location?.name || ""))
        ),
    [availabilitySlots, selectedPickupTime]
  );

  const selectedSlot = useMemo(
    () =>
      locationsForSelectedTime.find(
        (slot) => String(slot.locationId) === String(selectedLocationId)
      ) || null,
    [locationsForSelectedTime, selectedLocationId]
  );
  const selectedLocation = useMemo(
    () =>
      selectedSlot?.location ||
      locations.find((location) => String(location.id) === String(selectedLocationId)) ||
      null,
    [selectedSlot, locations, selectedLocationId]
  );

  const menuByCategory = useMemo(() => {
    const grouped = categories.map((category) => ({
      key: `category-${category.id}`,
      title: category.name,
      description: category.description,
      items: products.filter((product) => String(product.categoryId ?? "") === String(category.id)),
    }));

    const uncategorized = products.filter((product) => !product.categoryId);
    if (uncategorized.length > 0) {
      grouped.push({
        key: "category-uncategorized",
        title: tr("Autres produits", "Other products"),
        description: "",
        items: uncategorized,
      });
    }

    if (grouped.length === 0 && products.length > 0) {
      grouped.push({
        key: "category-default",
        title: tr("Le menu", "Menu"),
        description: "",
        items: products,
      });
    }

    return grouped
      .filter((entry) => entry.items.length > 0)
      .map((entry, index) => ({ entry, index }))
      .sort((left, right) => {
        const leftPriority = normalizeText(left.entry.title).includes("pizza") ? 0 : 1;
        const rightPriority = normalizeText(right.entry.title).includes("pizza") ? 0 : 1;
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
        return left.index - right.index;
      })
      .map(({ entry }) => ({
        ...entry,
        isPizzaCategory: isPizzaCategoryLabel(entry.title),
      }));
  }, [categories, products, tr]);

  useEffect(() => {
    if (menuByCategory.length === 0) {
      setActiveCategoryKey("");
      return;
    }

    const stillExists = menuByCategory.some((entry) => entry.key === activeCategoryKey);
    if (!stillExists) {
      setActiveCategoryKey(menuByCategory[0].key);
    }
  }, [activeCategoryKey, menuByCategory]);

  const visibleMenuGroup = useMemo(
    () => menuByCategory.find((entry) => entry.key === activeCategoryKey) || menuByCategory[0] || null,
    [activeCategoryKey, menuByCategory]
  );

  const openProductModal = (product) => {
    setEditingProduct(product);
    setSelectedExtras([]);
    setRemovedIngredients([]);
    setQuantity(1);
  };

  const handleQuickAdd = async (product) => {
    if (!product?.id) return;

    try {
      setLoading(true);
      const response = await addToCart(token, product.id, 1, {
        addedIngredients: [],
        removedIngredients: [],
      });
      setCartFromResponse(response);
      setMessage(`${product.name} ${tr("ajoute au panier", "added to cart")}`);
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Impossible d'ajouter au panier", "Unable to add to cart"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!editingProduct) return;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage(tr("Quantite invalide", "Invalid quantity"));
      return;
    }

    try {
      setLoading(true);
      const response = await addToCart(token, editingProduct.id, quantity, {
        addedIngredients: selectedExtras.map((entry) => entry.id),
        removedIngredients: removedIngredients.map((entry) => entry.id),
      });
      setCartFromResponse(response);
      setEditingProduct(null);
      setMessage(tr("Produit ajoute au panier", "Product added to cart"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Impossible d'ajouter au panier", "Unable to add to cart"));
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (cartItems.length === 0) {
      setMessage(tr("Votre panier est vide", "Your cart is empty"));
      return;
    }

    if (!isCartValidated) {
      setMessage(
        tr(
          "Validez d'abord le panier avant de choisir le retrait.",
          "Validate the cart before selecting pickup."
        )
      );
      return;
    }

    if (!selectedPickupTime) {
      setMessage(tr("Selectionnez un horaire", "Select a pickup time"));
      return;
    }

    if (!selectedLocationId) {
      setMessage(tr("Selectionnez une adresse de retrait", "Select a pickup address"));
      return;
    }

    if (!selectedSlot) {
      setMessage(tr("Selection invalide", "Invalid pickup selection"));
      return;
    }

    setIsFinalizeConfirmOpen(true);
  };

  const handleConfirmFinalize = async () => {
    if (!selectedPickupTime || !selectedLocationId || !selectedSlot) {
      setIsFinalizeConfirmOpen(false);
      setMessage(tr("Selection invalide", "Invalid pickup selection"));
      return;
    }

    const locationForSummary = selectedLocation;
    const pickupLocationName = locationForSummary?.name || tr("Emplacement", "Location");
    const pickupAddress = formatPickupAddress(locationForSummary, tr);
    const pickupTime = `${selectedDate}T${selectedPickupTime}:00`;
    const trimmedOrderNote = orderNote.trim();

    try {
      setIsFinalizeConfirmOpen(false);
      setLoading(true);
      const finalizedOrder = await finalizeOrder(token, {
        pickupDate: selectedDate,
        pickupTime: selectedPickupTime,
        locationId: Number(selectedLocationId),
        note: trimmedOrderNote || null,
        customerNote: trimmedOrderNote || null,
      });
      const orderId = finalizedOrder?.id ?? finalizedOrder?.order?.id ?? finalizedOrder?.orderId ?? null;
      await refreshCart();
      setAvailabilitySlots([]);
      setSelectedPickupTime("");
      setSelectedLocationId("");
      setOrderNote("");
      setMessage("");

      navigate("/order/confirmation", {
        state: {
          orderId,
          pickupTime,
          pickupLocationName,
          pickupAddress,
          orderNote: trimmedOrderNote,
        },
      });
    } catch (err) {
      setMessage(
        err?.response?.data?.error || err?.message || tr("Erreur lors de la finalisation", "Error while finalizing order")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isFinalizeConfirmOpen) return;
    const modalElement = finalizeModalRef.current;
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
        setIsFinalizeConfirmOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

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
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    };
  }, [isFinalizeConfirmOpen]);

  const handleValidateCart = () => {
    if (cartItems.length === 0) {
      setMessage(tr("Votre panier est vide", "Your cart is empty"));
      return;
    }

    setValidatedCartSignature(cartSignature);
    setMessage(
      tr(
        "Panier valide. Choisissez la date, l'horaire et l'adresse de retrait.",
        "Cart validated. Choose date, pickup time and location."
      )
    );
  };

  const handleRemoveCartItem = async (itemId) => {
    try {
      await removeItem(itemId);
      setMessage(tr("Article retire du panier", "Item removed from cart"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Impossible de retirer l'article du panier", "Unable to remove the item from cart"));
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      setValidatedCartSignature("");
      setSelectedPickupTime("");
      setSelectedLocationId("");
      setMessage(tr("Panier vide", "Cart cleared"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Impossible de vider le panier", "Unable to clear cart"));
    }
  };

  return (
    <div className="order-page section-shell pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-saffron">{tr("Commande en ligne", "Online ordering")}</p>
          <h1 className="font-display text-4xl uppercase tracking-wide text-white">{tr("Composez votre commande", "Build your order")}</h1>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-stone-200">
          <p>{tr("Articles dans le panier", "Items in cart")}: <strong>{itemCount}</strong></p>
          <p>{tr("Total", "Total")}: <strong>{Number(cartTotal).toFixed(2)} EUR</strong></p>
        </div>
      </div>

      {message && (
        <div className="theme-light-keep-dark mb-6 rounded-xl border border-saffron/50 bg-saffron/10 px-4 py-3 text-sm text-saffron">
          {message}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.65fr_1fr]">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">{tr("Nos produits", "Our products")}</h2>
          {menuByCategory.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-stone-300">
              {tr("Aucun produit disponible pour le moment.", "No products available right now.")}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {menuByCategory.map((group) => {
                  const isActive = group.key === visibleMenuGroup?.key;
                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => setActiveCategoryKey(group.key)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                        isActive
                          ? "border-saffron bg-saffron text-charcoal"
                          : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
                      }`}
                    >
                      {group.title}
                    </button>
                  );
                })}
              </div>

              {visibleMenuGroup && (
                <article className="rounded-3xl border border-white/10 bg-charcoal/35 p-5 sm:p-7">
                  <div className="mb-4 border-b border-white/10 pb-3">
                    <h3 className="font-display text-3xl uppercase tracking-[0.08em] text-crust sm:text-4xl">
                      {visibleMenuGroup.title}
                    </h3>
                    {visibleMenuGroup.description && <p className="mt-1 text-sm text-stone-400">{visibleMenuGroup.description}</p>}
                  </div>

                  <div>
                    {visibleMenuGroup.items.map((product) => (
                      <div key={product.id} className="border-b border-white/10 py-4 last:border-b-0">
                        <div className="flex items-start gap-3">
                          <h4 className="text-base font-semibold uppercase tracking-wide text-white sm:text-lg">
                            {product.name}
                          </h4>
                          <div className="mt-3 hidden h-px flex-1 border-t border-dashed border-stone-500/70 sm:block" />
                          <span className="whitespace-nowrap text-sm font-extrabold uppercase tracking-wide text-saffron sm:text-base">
                            {formatPrice(product.basePrice)} EUR
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              visibleMenuGroup.isPizzaCategory ? openProductModal(product) : handleQuickAdd(product)
                            }
                            disabled={loading}
                            title={
                              visibleMenuGroup.isPizzaCategory
                                ? tr("Configurer et ajouter", "Customize and add")
                                : tr("Ajouter au panier", "Add to cart")
                            }
                            aria-label={
                              visibleMenuGroup.isPizzaCategory
                                ? `${tr("Configurer", "Customize")} ${product.name}`
                                : `${tr("Ajouter", "Add")} ${product.name}`
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-saffron/70 text-sm font-bold text-saffron transition hover:bg-saffron/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            +
                          </button>
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
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="order-cart-shell rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">{tr("Mon panier", "My cart")}</h2>
              {isCartValidated && (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
                  {tr("Panier valide", "Cart validated")}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {cartLoading && <p className="text-sm text-stone-300">{tr("Chargement du panier...", "Loading cart...")}</p>}
              {!cartLoading && cartItems.length === 0 && (
                <p className="order-cart-item rounded-xl px-3 py-2 text-sm text-stone-300">
                  {tr("Votre panier est vide.", "Your cart is empty.")}
                </p>
              )}

              {cartItems.map((item) => {
                const itemUnitPrice = Number(item.unitPrice ?? getCartItemProduct(item)?.basePrice ?? 0);
                const itemTotal = itemUnitPrice * Number(item.quantity || 0);
                return (
                  <div key={item.id} className="order-cart-item rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{getCartItemName(item)}</p>
                          <p className="text-xs text-stone-300">{tr("Quantite", "Quantity")}: {item.quantity}</p>
                        {item.addedIngredients?.length > 0 && (
                          <p className="text-[11px] text-emerald-300">
                            + {item.addedIngredients.map((entry) => getCartIngredientName(entry)).filter(Boolean).join(", ")}
                          </p>
                        )}
                        {item.removedIngredients?.length > 0 && (
                          <p className="text-[11px] text-red-300">
                            - {item.removedIngredients.map((entry) => getCartIngredientName(entry)).filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-saffron">{formatPrice(itemTotal)} EUR</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(item.id)}
                          className="mt-1 rounded-md border border-white/20 px-2 py-1 text-[11px] font-semibold text-stone-100 transition hover:bg-white/10"
                        >
                          {tr("Retirer", "Remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-sm text-stone-200">
                {tr("Total panier", "Cart total")}: <strong>{Number(cartTotal).toFixed(2)} EUR</strong>
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleValidateCart}
                  disabled={cartItems.length === 0}
                  className="flex-1 rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {tr("Valider le panier", "Validate cart")}
                </button>
                <button
                  type="button"
                  onClick={handleClearCart}
                  disabled={cartItems.length === 0}
                  className="rounded-full border border-white/25 px-4 py-2 text-xs font-semibold text-stone-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {tr("Vider", "Clear")}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-1 text-xl font-bold text-white">{tr("Retrait de la commande", "Order pickup")}</h2>
            <p className="mb-4 text-sm text-stone-300">
              {tr("Choisissez d'abord la date, l'horaire, puis l'adresse de retrait.", "Choose date first, then pickup time and location.")}
            </p>
            <p className="mb-3 text-xs text-stone-300">
              {tr("Flux temps reel", "Realtime stream")}:{" "}
              <strong className={realtimeConnected ? "text-emerald-300" : "text-amber-300"}>
                {realtimeConnected ? tr("connecte", "connected") : tr("reconnexion...", "reconnecting...")}
              </strong>
            </p>

            {!isCartValidated && (
              <div className="theme-light-keep-dark mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {tr(
                  "Validez d'abord le panier pour debloquer la selection du retrait.",
                  "Validate the cart first to unlock pickup selection."
                )}
              </div>
            )}

            <fieldset disabled={!isCartValidated || loading || cartItems.length === 0} className="space-y-3 disabled:opacity-60">
              <div className="space-y-2">
                <p className="text-sm text-stone-300">{tr("Date de retrait", "Pickup date")}</p>
                <div className="mt-1 flex w-full items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!canGoPreviousDate) return;
                      setSelectedDate((prev) => shiftIsoDate(prev, -1));
                    }}
                    disabled={!canGoPreviousDate}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/5 text-stone-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={tr("Jour precedent", "Previous day")}
                  >
                    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="m14 6-6 6 6 6" />
                    </svg>
                  </button>

                  <span className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-center text-sm font-semibold text-stone-100">
                    {formatNavigatorDate(selectedDate, locale)}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedDate((prev) => shiftIsoDate(prev, 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/5 text-stone-100 transition hover:bg-white/15"
                    aria-label={tr("Jour suivant", "Next day")}
                  >
                    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="m10 6 6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-stone-300">{tr("Horaire de retrait", "Pickup time")}</p>
                {timeOptions.length === 0 ? (
                  <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {tr("Aucun horaire disponible pour cette date et cette quantite.", "No pickup time available for this date and quantity.")}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {timeOptions.map((option) => {
                      const isSelected = selectedPickupTime === option.pickupTime;
                      return (
                        <button
                          key={option.pickupTime}
                          type="button"
                          onClick={() => {
                            setSelectedPickupTime(option.pickupTime);
                            setSelectedLocationId("");
                          }}
                          className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                            isSelected
                              ? "border-saffron bg-saffron/15 text-saffron"
                              : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
                          }`}
                        >
                          {option.pickupTime} - {option.remainingCapacity} {tr("places", "spots")}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-stone-300">{tr("Adresse de retrait", "Pickup location")}</p>
                {!selectedPickupTime ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-stone-300">
                    {tr("Selectionnez d'abord un horaire", "Select a pickup time first")}
                  </div>
                ) : locationsForSelectedTime.length === 0 ? (
                  <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {tr("Aucune adresse disponible pour cet horaire.", "No location available for this pickup time.")}
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {locationsForSelectedTime.map((slot) => {
                      const location = slot.location;
                      const isSelected = String(selectedLocationId) === String(slot.locationId);
                      return (
                        <button
                          key={`${slot.locationId}-${slot.pickupTime}`}
                          type="button"
                          onClick={() => setSelectedLocationId(String(slot.locationId))}
                          className={`rounded-xl border px-3 py-2 text-left transition ${
                            isSelected
                              ? "border-saffron bg-saffron/15 text-saffron"
                              : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
                          }`}
                        >
                          <p className="text-sm font-semibold">{location?.name || "-"}</p>
                          <p className="text-xs text-stone-300">{formatPickupAddress(location, tr)}</p>
                          <p className="mt-1 text-[11px] text-emerald-300">
                            {slot.remainingCapacity} {tr("places restantes", "spots left")}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedLocation && (
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-stone-300">
                  <strong className="text-stone-100">{selectedLocation.name}</strong>
                  {" - "}
                  {formatPickupAddress(selectedLocation, tr)}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="order-note" className="text-sm text-stone-300">
                  {tr("Note pour la commande (optionnel)", "Order note (optional)")}
                </label>
                <textarea
                  id="order-note"
                  value={orderNote}
                  onChange={(event) => setOrderNote(event.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder={tr(
                    "Ex: Allergie, demande de cuisson, precision utile...",
                    "e.g. Allergy, cooking request, helpful detail..."
                  )}
                  className="w-full rounded-xl border border-white/20 bg-charcoal/60 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-400 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/25"
                />
                <p className="text-right text-[11px] text-stone-400">{orderNote.length}/300</p>
              </div>

              <button
                type="button"
                disabled={
                  loading ||
                  cartItems.length === 0 ||
                  !selectedPickupTime ||
                  !selectedLocationId ||
                  !selectedSlot
                }
                onClick={handleFinalize}
                className="mt-2 w-full rounded-full bg-saffron px-4 py-3 text-sm font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? tr("Traitement...", "Processing...") : tr("Finaliser la commande", "Finalize order")}
              </button>
            </fieldset>
          </div>
        </section>
      </div>

      {isFinalizeConfirmOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4">
          <div
            ref={finalizeModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="finalize-order-title"
            tabIndex={-1}
            className="w-full max-w-lg rounded-2xl border border-saffron/45 bg-charcoal/95 p-5 shadow-2xl"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-saffron">
              {tr("Verification retrait", "Pickup check")}
            </p>
            <h3 id="finalize-order-title" className="mt-2 text-xl font-bold text-white">
              {tr("Confirmez votre adresse de retrait", "Confirm your pickup address")}
            </h3>

            <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-stone-400">{tr("Emplacement", "Location")}</p>
                <p className="font-semibold text-white">
                  {selectedLocation?.name || tr("Emplacement", "Location")}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-stone-400">{tr("Adresse", "Address")}</p>
                <p className="text-stone-200">{formatPickupAddress(selectedLocation, tr)}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-stone-400">{tr("Date", "Date")}</p>
                  <p className="text-stone-200">{formatNavigatorDate(selectedDate, locale)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-stone-400">{tr("Horaire", "Time")}</p>
                  <p className="text-stone-200">{selectedPickupTime || "--:--"}</p>
                </div>
              </div>
              {orderNote.trim() && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-stone-400">{tr("Note", "Note")}</p>
                  <p className="text-stone-200">{orderNote.trim()}</p>
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-amber-200">
              {tr(
                "Verifiez bien cette adresse avant de finaliser la commande.",
                "Please verify this address before finalizing your order."
              )}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setIsFinalizeConfirmOpen(false)}
                disabled={loading}
                className="flex-1 rounded-full border border-white/25 px-4 py-2 text-xs font-semibold text-stone-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tr("Annuler", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalize}
                disabled={loading}
                className="flex-1 rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? tr("Traitement...", "Processing...") : tr("Confirmer", "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <ProductCustomizerModal
          product={editingProduct}
          ingredients={extras}
          selectedExtras={selectedExtras}
          removedIngredients={removedIngredients}
          quantity={quantity}
          onClose={() => setEditingProduct(null)}
          onExtrasChange={(ingredient, checked) => {
            setSelectedExtras((prev) =>
              checked ? [...prev, ingredient] : prev.filter((entry) => entry.id !== ingredient.id)
            );
          }}
          onRemovedChange={(ingredient, checked) => {
            setRemovedIngredients((prev) =>
              checked ? [...prev, ingredient] : prev.filter((entry) => entry.id !== ingredient.id)
            );
          }}
          onQuantityChange={setQuantity}
          onConfirm={handleAddToCart}
          tr={tr}
        />
      )}
    </div>
  );
}
