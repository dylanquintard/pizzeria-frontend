import React, { useEffect, useState, useContext, useMemo, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  getAllPizzasClient,
  getAllIngredients,
  getCart,
  addToCart,
  removeFromCart,
  finalizeOrder,
} from "../api/user.api";
import { getActiveTimeSlots } from "../api/timeslot.api";
import "../styles/Order.css";

/* ========================= TOAST ========================= */
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return <div className="toast">{message}</div>;
}

/* ========================= MODAL COMPOSANT ========================= */
function PizzaModal({ pizza, ingredients, selectedExtras, removedIngredients, onClose, onAdd, quantities }) {
  return (
    <div className="modal">
      <div className="modal-content" style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <h3>Modifier {pizza.name}</h3>

        <div className="modal-section">
          <p>Suppléments :</p>
          {ingredients.map((ing) => (
            <label key={ing.id}>
              <input
                type="checkbox"
                checked={selectedExtras.some((e) => e.id === ing.id)}
                onChange={(e) => onAdd("extras", ing, e.target.checked)}
              />
              {ing.name} (+{Number(ing.price || 0).toFixed(2)} €)
            </label>
          ))}
        </div>

        <div className="modal-section">
          <p>Retirer ingrédients :</p>
          {pizza.ingredients.map((ing) => (
            <label key={ing.ingredient.id}>
              <input
                type="checkbox"
                checked={removedIngredients.some((r) => r.id === ing.ingredient.id)}
                onChange={(e) => onAdd("removed", ing.ingredient, e.target.checked)}
              />
              {ing.ingredient.name}
            </label>
          ))}
        </div>

<div className="modal-actions">
  <div className="modal-section">
    <p>Quantité :</p>
    <input
      type="number"
      min={1}
      value={quantities[pizza.id] || 1}
      onChange={(e) => onAdd("quantity", Number(e.target.value))}
    />
  </div>

  <button onClick={() => onAdd("confirm")}>Ajouter au panier</button>
  <button className="btn-cancel" onClick={onClose}>Annuler</button>
</div>
      </div>
    </div>
  );
}

/* ========================= CART ITEM COMPOSANT ========================= */
function CartItem({ item, onRemove, loading }) {
  const total = useMemo(
    () => ((item.totalPrice || item.unitPrice || 0) * item.quantity).toFixed(2),
    [item]
  );

  return (
    <div className="cart-item">
      {/* HEADER : nom + bouton */}
<div className="cart-item-header">
  <strong>{item.pizza.name}</strong>
  <button
    onClick={() => onRemove(item.id)}
    disabled={loading}
    className="cart-item-remove"
  >
    ×
  </button>
</div>

      {/* CONTENU : quantité, modifications, total */}
      <div className="cart-item-content">
        <p>Quantité : {item.quantity}</p>

        {(item.addedIngredients?.length || item.removedIngredients?.length) > 0 && (
          <div className="cart-modifications">
            <p><strong>Modifications :</strong></p>
            <ul>
              {item.addedIngredients?.map((ing) => (
                <li key={`add-${ing.id}`}>+ {ing.name}</li>
              ))}
              {item.removedIngredients?.map((ing) => (
                <li key={`rm-${ing.id}`}>- {ing.name}</li>
              ))}
            </ul>
          </div>
        )}

        <p>Total : {total} €</p>
      </div>
    </div>
  );
}

/* ========================= MAIN ORDER ========================= */
export default function Order() {
  const { token } = useContext(AuthContext);

  const [pizzas, setPizzas] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingPizza, setEditingPizza] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [toastMessage, setToastMessage] = useState("");

  /* ========================= HELPERS ========================= */
  const generateItemKey = useCallback((pizzaId, extras = [], removed = []) => {
    const extrasKey = extras.map((i) => i.id).sort().join(",");
    const removedKey = removed.map((i) => i.id).sort().join(",");
    return `${pizzaId}-${extrasKey}-${removedKey}`;
  }, []);

  const showToast = (message) => setToastMessage(message);

  /* ========================= FETCH INITIAL DATA ========================= */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [pizzaData, ingredientData, cartData] = await Promise.all([
          getAllPizzasClient(),
          getAllIngredients(token),
          getCart(token),
        ]);
        if (cancelled) return;
        setPizzas(pizzaData);
        setIngredients(ingredientData.filter((i) => i.isExtra));
        setCart(cartData.items || []);
      } catch (err) {
        console.error(err);
        showToast(err.message || "Erreur lors du chargement");
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [token]);

  /* ========================= FETCH CRENEAUX ========================= */
  useEffect(() => {
    if (!finalizing || !token) return;
    let cancelled = false;

    const fetchSlots = async () => {
      try {
        const allSlots = await getActiveTimeSlots(token);
        const totalPizzas = cart.reduce((sum, item) => sum + item.quantity, 0);
        const now = new Date();
        const availableSlots = allSlots.filter((slot) => {
          const slotStart = new Date(slot.startTime);
          const slotDate = slotStart.toISOString().split("T")[0];
          return (
            slotDate === selectedDate &&
            slot.maxPizzas - slot.currentPizzas >= totalPizzas &&
            slotStart - now >= 15 * 60000
          );
        });
        if (!cancelled) setTimeSlots(availableSlots);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSlots();
    const interval = setInterval(fetchSlots, 15000);
    return () => { clearInterval(interval); cancelled = true; };
  }, [finalizing, token, cart, selectedDate]);

  /* ========================= CART ACTIONS ========================= */
  const handleAddToCart = async (pizza, extras = selectedExtras, removed = removedIngredients) => {
    const qty = Number(quantities[pizza.id] || 1);
    if (qty <= 0) return showToast("Quantité invalide !");
    setLoading(true);

    try {
      const customizations = {
        addedIngredients: extras.map((i) => i.id),
        removedIngredients: removed.map((i) => i.id),
      };
      const qty = Number(quantities[pizza.id] || 1);
      const updatedCart = await addToCart(token, pizza.id, qty, customizations);

      // Merge côté client
      const mergedCartMap = new Map();
      [...updatedCart.items].forEach((item) => {
        const key = generateItemKey(item.pizza.id, item.addedIngredients || [], item.removedIngredients || []);
        if (mergedCartMap.has(key)) {
          mergedCartMap.get(key).quantity += item.quantity;
        } else {
          mergedCartMap.set(key, {
            ...item,
            addedIngredients: item.addedIngredients || [],
            removedIngredients: item.removedIngredients || [],
          });
        }
      });

      setCart(Array.from(mergedCartMap.values()));

      // Reset modal state
      setQuantities((prev) => ({ ...prev, [pizza.id]: 1 }));
      setEditingPizza(null);
      setSelectedExtras([]);
      setRemovedIngredients([]);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Impossible d'ajouter au panier");
    }
    setLoading(false);
  };

  const handleRemoveItem = async (itemId) => {
    setLoading(true);
    try {
      const updatedCart = await removeFromCart(token, itemId);
      setCart(updatedCart.items || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Impossible de supprimer l'item");
    }
    setLoading(false);
  };

  const handleClearCart = async () => {
    if (!cart.length) return;
    setLoading(true);
    try {
      await Promise.all(cart.map((item) => removeFromCart(token, item.id)));
      setCart([]);
    } catch (err) {
      console.error(err);
      showToast("Impossible de vider le panier");
    }
    setLoading(false);
  };

  const handleValidateCart = () => {
    if (!cart.length) return showToast("Votre panier est vide !");
    setFinalizing(true);
  };

  const handleFinalizeOrder = async () => {
    if (!selectedTimeSlot) return showToast("Veuillez sélectionner un créneau");
    setLoading(true);
    try {
      await finalizeOrder(token, selectedTimeSlot.id);
      showToast("Commande finalisée !");
      const refreshedCart = await getCart(token);
      setCart(refreshedCart.items || []);
      setSelectedTimeSlot(null);
      setTimeSlots([]);
      setFinalizing(false);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Impossible de finaliser la commande");
    }
    setLoading(false);
  };

  const handleModalExtras = (type, ingredient, checked = false) => {
    if (type === "extras") {
      setSelectedExtras((prev) =>
        checked ? [...prev, ingredient] : prev.filter((i) => i.id !== ingredient.id)
      );
    } else if (type === "removed") {
      setRemovedIngredients((prev) =>
        checked ? [...prev, ingredient] : prev.filter((i) => i.id !== ingredient.id)
      );
      } else if (type === "quantity") {
      setQuantities((prev) => ({
        ...prev,
        [editingPizza.id]: ingredient
      }));
    } else if (type === "confirm") {
      handleAddToCart(editingPizza);
    }
  };

  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + (item.totalPrice || item.unitPrice || 0) * item.quantity, 0),
    [cart]
  );
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="order-page">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}

      {/* ========================= PIZZAS ========================= */}
      <div className="pizza-section">
        {pizzas.map((pizza) => (
<div
  className="pizza-card"
  key={pizza.id}
  onClick={() => {
    setEditingPizza(pizza);          // ouvre la modal
    setSelectedExtras([]);
    setRemovedIngredients([]);
    setQuantities((prev) => ({ ...prev, [pizza.id]: prev[pizza.id] || 1 }));
  }}
  style={{ cursor: "pointer" }}       // indique que c'est cliquable
>
  <h2>{pizza.name}</h2>
  <p>{pizza.description}</p>
  <p style={{ fontStyle: "italic", color: "#555" }}>
    {pizza.ingredients.map((i) => i.ingredient.name).join(", ")}
  </p>
  <p>
    Prix : <strong>
      {pizza.basePrice !== undefined && pizza.basePrice !== null 
        ? Number(pizza.basePrice).toFixed(2) 
        : "N/A"} €
    </strong>
  </p>
</div>
        ))}
      </div>

      {/* ========================= PANIER / CRENEAU ========================= */}
      <div className="cart-section">
        {!finalizing ? (
          <>
            <h2>Mon panier</h2>
            {!cart.length && <p>Votre panier est vide</p>}
            {cart.map((item) => (
              <CartItem
                key={generateItemKey(item.pizza.id, item.addedIngredients, item.removedIngredients)}
                item={item}
                onRemove={handleRemoveItem}
                loading={loading}
              />
            ))}

            {cart.length > 0 && (
              <>
                <h3>Total du panier : {cartTotal.toFixed(2)} €</h3>
                <button onClick={handleClearCart} disabled={loading}>Vider le panier</button>
                <button onClick={handleValidateCart} disabled={loading}>
                  Valider le panier
                </button>
              </>
            )}
          </>
        ) : (
<div className="timeslot-section">
  <h2>Choisissez une date</h2>

  {/* NAVIGATION PAR FLÈCHES */}
  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
    <button onClick={() => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().split("T")[0]);
    }}>
      &lt;
    </button>

    <input
      type="date"
      min={today}
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      style={{ textAlign: "center" }}
    />

    <button onClick={() => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split("T")[0]);
    }}>
      &gt;
    </button>
  </div>

  <h3>Créneaux disponibles</h3>
  {timeSlots.length === 0 ? (
    <p>Aucun créneau disponible pour cette date</p>
  ) : (
    <select
      value={selectedTimeSlot?.id || ""}
      onChange={(e) => setSelectedTimeSlot(timeSlots.find(t => t.id === parseInt(e.target.value)))}
    >
      <option value="">-- Choisir un créneau --</option>
      {timeSlots.map((t) => (
        <option
          key={t.id}
          value={t.id}
          disabled={t.maxPizzas - t.currentPizzas <= 0}
        >
          {new Date(t.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </option>
      ))}
    </select>
  )}

  <button
    onClick={handleFinalizeOrder}
    disabled={!selectedTimeSlot || loading || timeSlots.length === 0}
    style={{ marginTop: "12px" }}
  >
    {loading ? "..." : "Finaliser la commande"}
  </button>

  <button
    onClick={() => setFinalizing(false)}
    style={{ marginTop: "10px" }}
  >
    Retour au panier
  </button>
</div>
        )}
      </div>

      {/* ========================= MODAL ========================= */}
      {editingPizza && (
        <PizzaModal
          pizza={editingPizza}
          ingredients={ingredients}
          selectedExtras={selectedExtras}
          removedIngredients={removedIngredients}
          onClose={() => setEditingPizza(null)}
          onAdd={handleModalExtras}
          quantities={quantities}
        />
      )}
    </div>
  );
}