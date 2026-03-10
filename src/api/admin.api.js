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

export const getAllProducts = async (token) => {
  const response = await api.get("/products", authConfig(token));
  return response.data;
};

export const getProductById = async (token, id) => {
  const response = await api.get(`/products/${id}/details`, authConfig(token));
  return response.data;
};

export const createProduct = async (token, data) => {
  const response = await api.post("/products", data, authConfig(token));
  return response.data;
};

export const updateProduct = async (token, id, data) => {
  const response = await api.put(`/products/${id}`, data, authConfig(token));
  return response.data;
};

export const deleteProduct = async (token, id) => {
  const response = await api.delete(`/products/${id}`, authConfig(token));
  return response.data;
};

export const getAllIngredients = async (token, filters = {}) => {
  const response = await api.get("/products/ingredients", {
    ...authConfig(token),
    params: filters,
  });
  return response.data;
};

export const createIngredient = async (token, data) => {
  const response = await api.post(
    "/products/ingredients",
    data,
    authConfig(token)
  );
  return response.data;
};

export const updateIngredient = async (token, id, data) => {
  const response = await api.put(
    `/products/ingredients/${id}`,
    data,
    authConfig(token)
  );
  return response.data;
};

export const deleteIngredient = async (token, id) => {
  const response = await api.delete(`/products/ingredients/${id}`, authConfig(token));
  return response.data;
};

export const addIngredientToProduct = async (token, productId, ingredientId) => {
  const response = await api.post(
    "/products/ingredients/link",
    { productId, ingredientId },
    authConfig(token)
  );
  return response.data;
};

export const removeIngredientFromProduct = async (token, productId, ingredientId) => {
  const response = await api.delete("/products/ingredients/link", {
    ...authConfig(token),
    data: { productId, ingredientId },
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
