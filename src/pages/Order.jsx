import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../api/category.api";
import { getLocations } from "../api/location.api";
import { getActiveTimeSlots } from "../api/timeslot.api";
import {
  addToCart,
  finalizeOrder,
  getAllIngredients,
  getAllPizzasClient,
} from "../api/user.api";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useRealtimeEvents } from "../hooks/useRealtimeEvents";

function toLocalIsoDate(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSlotServiceDate(slot) {
  return slot.serviceDate ? toLocalIsoDate(slot.serviceDate) : toLocalIsoDate(slot.startTime);
}

function formatPrice(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed.toFixed(2);
}

function getCartItemProduct(item) {
  return item?.pizza || item?.product || item?.menuItem || null;
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

function formatSlotTime(slot, locale) {
  return new Date(slot.startTime).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PizzaCustomizerModal({
  pizza,
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
  const baseIngredients = Array.isArray(pizza.ingredients) ? pizza.ingredients : [];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-stone-900 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">{tr("Personnaliser", "Customize")}: {pizza.name}</h3>
          <button type="button" onClick={onClose} className="rounded-md border border-stone-300 px-3 py-1 text-sm">
            {tr("Fermer", "Close")}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{tr("Supplements", "Extras")}</p>
            <div className="space-y-2">
              {ingredients.map((ingredient) => (
                <label key={ingredient.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedExtras.some((entry) => entry.id === ingredient.id)}
                    onChange={(event) => onExtrasChange(ingredient, event.target.checked)}
                  />
                  <span>
                    {ingredient.name} (+{formatPrice(ingredient.price)} EUR)
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{tr("Retirer ingredients", "Remove ingredients")}</p>
            <div className="space-y-2">
              {baseIngredients.length === 0 && (
                <p className="text-xs text-stone-500">{tr("Aucun ingredient a retirer pour ce produit.", "No ingredient can be removed for this product.")}</p>
              )}
              {baseIngredients.map((entry) => (
                <label key={entry.ingredient.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={removedIngredients.some((ingredient) => ingredient.id === entry.ingredient.id)}
                    onChange={(event) => onRemovedChange(entry.ingredient, event.target.checked)}
                  />
                  <span>{entry.ingredient.name}</span>
                </label>
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
              value={quantity}
              onChange={(event) => onQuantityChange(Number(event.target.value || 1))}
              className="ml-2 w-20 rounded-md border border-stone-300 px-2 py-1"
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

  const [pizzas, setPizzas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [extras, setExtras] = useState([]);
  const [locations, setLocations] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toLocalIsoDate(new Date()));
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [editingPizza, setEditingPizza] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [validatedCartSignature, setValidatedCartSignature] = useState("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [activeCategoryKey, setActiveCategoryKey] = useState("");

  const cartSignature = useMemo(
    () =>
      cartItems
        .map((item) => {
          const added = (item.addedIngredients || []).map((entry) => getCartIngredientName(entry)).join(",");
          const removed = (item.removedIngredients || []).map((entry) => getCartIngredientName(entry)).join(",");
          return `${item.id}:${item.quantity}:${item.unitPrice}:${added}:${removed}`;
        })
        .join("|"),
    [cartItems]
  );

  const isCartValidated = cartItems.length > 0 && validatedCartSignature !== "" && validatedCartSignature === cartSignature;

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialData() {
      try {
        const [pizzaData, categoryData, ingredientData, locationData] = await Promise.all([
          getAllPizzasClient(),
          getCategories({ active: true }),
          getAllIngredients(token),
          getLocations({ active: true }),
        ]);

        if (!cancelled) {
          setPizzas(Array.isArray(pizzaData) ? pizzaData : []);
          setCategories(Array.isArray(categoryData) ? categoryData : []);
          setExtras((Array.isArray(ingredientData) ? ingredientData : []).filter((entry) => entry.isExtra));
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

  const refreshSlots = useCallback(async () => {
    if (!isCartValidated || itemCount <= 0) {
      setSlots([]);
      setAvailableLocations([]);
      setSelectedLocationId("");
      setSelectedSlotId("");
      return;
    }

    try {
      const allSlots = await getActiveTimeSlots(token, {});
      const now = new Date();
      const eligibleSlots = allSlots.filter((slot) => {
        const locationId = slot.location?.id ?? slot.locationId;
        if (!locationId) return false;

        const slotStart = new Date(slot.startTime);
        return (
          getSlotServiceDate(slot) === selectedDate &&
          slot.maxPizzas - slot.currentPizzas >= itemCount &&
          slotStart - now >= 15 * 60_000
        );
      });

      const availableLocationIds = new Set(
        eligibleSlots
          .map((slot) => slot.location?.id ?? slot.locationId)
          .filter((entry) => entry !== null && entry !== undefined)
          .map((entry) => String(entry))
      );

      const nextAvailableLocations = locations.filter((location) =>
        availableLocationIds.has(String(location.id))
      );
      setAvailableLocations(nextAvailableLocations);

      const selectedIsAvailable = availableLocationIds.has(String(selectedLocationId));
      const nextLocationId = selectedIsAvailable ? String(selectedLocationId) : "";

      if (String(selectedLocationId || "") !== String(nextLocationId || "")) {
        setSelectedLocationId(nextLocationId);
      }

      const slotsForSelectedLocation = nextLocationId
        ? eligibleSlots.filter(
            (slot) => String(slot.location?.id ?? slot.locationId) === String(nextLocationId)
          )
        : [];

      setSlots(slotsForSelectedLocation);
      if (!slotsForSelectedLocation.find((slot) => String(slot.id) === String(selectedSlotId))) {
        setSelectedSlotId("");
      }
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Impossible de recuperer les creneaux", "Unable to fetch timeslots"));
    }
  }, [isCartValidated, itemCount, locations, selectedDate, selectedLocationId, selectedSlotId, token, tr]);

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  const handleRealtimeEvent = useCallback(
    (eventName) => {
      if (eventName === "timeslots:updated") {
        refreshSlots();
        return;
      }

      if (eventName === "locations:updated") {
        getLocations({ active: true })
          .then((locationData) => {
            setLocations(Array.isArray(locationData) ? locationData : []);
            refreshSlots();
          })
          .catch(() => {});
        return;
      }

      if (eventName === "cart:updated" || eventName === "orders:user-updated") {
        refreshCart();
        refreshSlots();
      }
    },
    [refreshSlots, refreshCart]
  );

  useRealtimeEvents({
    enabled: Boolean(token),
    onEvent: handleRealtimeEvent,
    onConnectionChange: setRealtimeConnected,
  });

  useEffect(() => {
    if (cartItems.length === 0) {
      setValidatedCartSignature("");
      setSelectedSlotId("");
    }
  }, [cartItems.length]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => String(slot.id) === String(selectedSlotId)) || null,
    [slots, selectedSlotId]
  );
  const selectedLocation = useMemo(
    () =>
      availableLocations.find((location) => String(location.id) === String(selectedLocationId)) ||
      locations.find((location) => String(location.id) === String(selectedLocationId)) ||
      null,
    [availableLocations, locations, selectedLocationId]
  );

  const menuByCategory = useMemo(() => {
    const grouped = categories.map((category) => ({
      key: `category-${category.id}`,
      title: category.name,
      description: category.description,
      items: pizzas.filter((pizza) => String(pizza.categoryId ?? "") === String(category.id)),
    }));

    const uncategorized = pizzas.filter((pizza) => !pizza.categoryId);
    if (uncategorized.length > 0) {
      grouped.push({
        key: "category-uncategorized",
        title: tr("Autres produits", "Other products"),
        description: "",
        items: uncategorized,
      });
    }

    if (grouped.length === 0 && pizzas.length > 0) {
      grouped.push({
        key: "category-default",
        title: tr("Le menu", "Menu"),
        description: "",
        items: pizzas,
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
  }, [categories, pizzas, tr]);

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

  const openPizzaModal = (pizza) => {
    setEditingPizza(pizza);
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
    if (!editingPizza) return;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage(tr("Quantite invalide", "Invalid quantity"));
      return;
    }

    try {
      setLoading(true);
      const response = await addToCart(token, editingPizza.id, quantity, {
        addedIngredients: selectedExtras.map((entry) => entry.id),
        removedIngredients: removedIngredients.map((entry) => entry.id),
      });
      setCartFromResponse(response);
      setEditingPizza(null);
      setMessage(tr("Pizza ajoutee au panier", "Pizza added to cart"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Impossible d'ajouter au panier", "Unable to add to cart"));
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!isCartValidated) {
      setMessage(tr("Validez d'abord le panier avant de choisir le retrait.", "Validate the cart before selecting pickup."));
      return;
    }

    if (!selectedLocationId) {
      setMessage(tr("Selectionnez un emplacement disponible", "Select an available location"));
      return;
    }

    if (!selectedSlot) {
      setMessage(tr("Selectionnez un creneau", "Select a timeslot"));
      return;
    }

    const locationForSummary =
      selectedSlot.location ||
      availableLocations.find((location) => String(location.id) === String(selectedLocationId)) ||
      locations.find((location) => String(location.id) === String(selectedLocationId)) ||
      null;
    const pickupLocationName = locationForSummary?.name || tr("Emplacement", "Location");
    const pickupAddress = formatPickupAddress(locationForSummary, tr);
    const pickupTime = selectedSlot.startTime;
    const resetStateAndNavigate = async (resolvedOrderId = null) => {
      await refreshCart();
      setSlots([]);
      setSelectedLocationId("");
      setSelectedSlotId("");
      setValidatedCartSignature("");
      setMessage("");

      navigate("/order/confirmation", {
        state: {
          orderId: resolvedOrderId,
          pickupTime,
          pickupLocationName,
          pickupAddress,
        },
      });
    };

    try {
      setLoading(true);
      const finalizedOrder = await finalizeOrder(token, selectedSlot.id);
      const orderId = finalizedOrder?.id ?? finalizedOrder?.order?.id ?? finalizedOrder?.orderId ?? null;
      await resetStateAndNavigate(orderId);
    } catch (err) {
      setMessage(
        err?.response?.data?.error || err?.message || tr("Erreur lors de la finalisation", "Error while finalizing order")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCart = () => {
    if (cartItems.length === 0) {
      setMessage(tr("Votre panier est vide", "Your cart is empty"));
      return;
    }

    setValidatedCartSignature(cartSignature);
    setMessage(tr("Panier valide. Choisissez la date, l'emplacement et l'heure de retrait.", "Cart validated. Choose date, location and pickup time."));
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
      setSelectedSlotId("");
      setMessage(tr("Panier vide", "Cart cleared"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Impossible de vider le panier", "Unable to clear cart"));
    }
  };

  return (
    <div className="section-shell pb-16">
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
                              visibleMenuGroup.isPizzaCategory ? openPizzaModal(product) : handleQuickAdd(product)
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
              {tr("Etape 2: une fois le panier valide, choisissez date, emplacement et creneau.", "Step 2: once the cart is validated, choose date, location and timeslot.")}
            </p>
            <p className="mb-3 text-xs text-stone-300">
              {tr("Flux temps reel", "Realtime stream")}:{" "}
              <strong className={realtimeConnected ? "text-emerald-300" : "text-amber-300"}>
                {realtimeConnected ? tr("connecte", "connected") : tr("reconnexion...", "reconnecting...")}
              </strong>
            </p>

            {!isCartValidated && (
              <div className="theme-light-keep-dark mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {tr("Validez d'abord le panier pour debloquer la selection du retrait.", "Validate the cart first to unlock pickup selection.")}
              </div>
            )}

            <fieldset disabled={!isCartValidated || loading || cartItems.length === 0} className="space-y-3 disabled:opacity-60">
              <label className="block text-sm text-stone-300">
                {tr("Date", "Date")}
                <input
                  type="date"
                  min={toLocalIsoDate(new Date())}
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-white"
                />
              </label>

              <div className="space-y-2">
                <p className="text-sm text-stone-300">{tr("Emplacement", "Location")}</p>
                {availableLocations.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableLocations.map((location) => {
                      const isSelected = String(selectedLocationId) === String(location.id);
                      return (
                        <button
                          key={location.id}
                          type="button"
                          onClick={() => {
                            setSelectedLocationId(String(location.id));
                            setSelectedSlotId("");
                          }}
                          className={`rounded-xl border px-3 py-2 text-left transition ${
                            isSelected
                              ? "border-saffron bg-saffron/15 text-saffron"
                              : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
                          }`}
                        >
                          <p className="text-sm font-semibold">{location.name}</p>
                          <p className="text-xs text-stone-300">{location.city || "-"}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="theme-light-keep-dark rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {tr("Aucun emplacement disponible pour la date et la quantite choisies.", "No location available for selected date and quantity.")}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-stone-300">{tr("Creneau", "Timeslot")}</p>
                {!selectedLocationId ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-stone-300">
                    {tr("Selectionnez d'abord un emplacement", "Select a location first")}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {tr("Aucun creneau disponible pour cet emplacement a cette date.", "No timeslot available for this location on this date.")}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => {
                      const isSelected = String(selectedSlotId) === String(slot.id);
                      const remaining = Math.max(0, Number(slot.maxPizzas || 0) - Number(slot.currentPizzas || 0));
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(String(slot.id))}
                          className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                            isSelected
                              ? "border-saffron bg-saffron/20 text-saffron"
                              : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
                          }`}
                        >
                          {formatSlotTime(slot, locale)} · {remaining} {tr("places", "spots")}
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

              <button
                type="button"
                disabled={
                  loading ||
                  cartItems.length === 0 ||
                  !isCartValidated ||
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

      {editingPizza && (
        <PizzaCustomizerModal
          pizza={editingPizza}
          ingredients={extras}
          selectedExtras={selectedExtras}
          removedIngredients={removedIngredients}
          quantity={quantity}
          onClose={() => setEditingPizza(null)}
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
