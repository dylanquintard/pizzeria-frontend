import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCart, removeFromCart } from "../api/user.api";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

const emptyCart = {
  id: null,
  items: [],
  total: 0,
};

function normalizeCart(payload) {
  return {
    id: payload?.id ?? null,
    items: Array.isArray(payload?.items) ? payload.items : [],
    total: Number(payload?.total ?? 0),
  };
}

export function CartProvider({ children }) {
  const { token } = useContext(AuthContext);
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCart(emptyCart);
      return;
    }

    try {
      setLoading(true);
      const response = await getCart(token);
      setCart(normalizeCart(response));
    } catch (_err) {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const setCartFromResponse = useCallback((response) => {
    setCart(normalizeCart(response));
  }, []);

  const removeItem = useCallback(
    async (itemId) => {
      if (!token) return;
      const response = await removeFromCart(token, itemId);
      setCart(normalizeCart(response));
    },
    [token]
  );

  const clearCart = useCallback(async () => {
    if (!token || cart.items.length === 0) return;
    const itemIds = cart.items.map((item) => item.id);
    for (const itemId of itemIds) {
      // Sequential deletes keep backend state consistent for each response.
      // This also keeps the context synchronized after every item deletion.
      // eslint-disable-next-line no-await-in-loop
      await removeItem(itemId);
    }
  }, [token, cart.items, removeItem]);

  const itemCount = useMemo(
    () => cart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart.items]
  );

  const value = useMemo(
    () => ({
      cart,
      cartItems: cart.items,
      cartTotal: cart.total,
      itemCount,
      loading,
      refreshCart,
      setCartFromResponse,
      removeItem,
      clearCart,
    }),
    [cart, itemCount, loading, refreshCart, setCartFromResponse, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
