import api, { authConfig } from "./http";

export const getAllUsers = async (token) => {
  const response = await api.get("/users", authConfig(token));
  return response.data;
};

export const updateUserRole = async (token, userId, role) => {
  const response = await api.put(
    `/users/${userId}/role`,
    { role },
    authConfig(token)
  );
  return response.data;
};

export const deleteUser = async (token, userId) => {
  const response = await api.delete(`/users/${userId}`, authConfig(token));
  return response.data;
};

export const getAllPizzas = async (token) => {
  const response = await api.get("/pizzas", authConfig(token));
  return response.data;
};

export const getPizzaById = async (token, id) => {
  const response = await api.get(`/pizzas/${id}/details`, authConfig(token));
  return response.data;
};

export const createPizza = async (token, data) => {
  const response = await api.post("/pizzas", data, authConfig(token));
  return response.data;
};

export const updatePizza = async (token, id, data) => {
  const response = await api.put(`/pizzas/${id}`, data, authConfig(token));
  return response.data;
};

export const deletePizza = async (token, id) => {
  const response = await api.delete(`/pizzas/${id}`, authConfig(token));
  return response.data;
};

export const getAllIngredients = async (token) => {
  const response = await api.get("/pizzas/ingredients", authConfig(token));
  return response.data;
};

export const createIngredient = async (token, data) => {
  const response = await api.post(
    "/pizzas/ingredients",
    data,
    authConfig(token)
  );
  return response.data;
};

export const updateIngredient = async (token, id, data) => {
  const response = await api.put(
    `/pizzas/ingredients/${id}`,
    data,
    authConfig(token)
  );
  return response.data;
};

export const deleteIngredient = async (token, id) => {
  const response = await api.delete(`/pizzas/ingredients/${id}`, authConfig(token));
  return response.data;
};

export const addIngredientToPizza = async (token, pizzaId, ingredientId) => {
  const response = await api.post(
    "/pizzas/ingredients/link",
    { pizzaId, ingredientId },
    authConfig(token)
  );
  return response.data;
};

export const removeIngredientFromPizza = async (token, pizzaId, ingredientId) => {
  const response = await api.delete("/pizzas/ingredients/link", {
    ...authConfig(token),
    data: { pizzaId, ingredientId },
  });
  return response.data;
};

export const getOrdersAdmin = async (token, filters = {}) => {
  const response = await api.get("/orders", {
    ...authConfig(token),
    params: filters,
  });
  return response.data;
};

export const deleteOrderAdmin = async (token, orderId) => {
  const response = await api.delete(`/orders/${orderId}`, authConfig(token));
  return response.data;
};

export const finalizeOrderAdmin = async (token, orderId) => {
  const response = await api.patch(
    `/orders/${orderId}/status`,
    { status: "FINALIZED" },
    authConfig(token)
  );
  return response.data;
};

