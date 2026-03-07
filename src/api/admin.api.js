import axios from "axios";
import { API_BASE_URL } from "../config/env";

const API_USERS = `${API_BASE_URL}/users`;
const API_PIZZAS = `${API_BASE_URL}/pizzas`;
const API_ORDERS = `${API_BASE_URL}/orders`;

const withAuth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getAllUsers = async (token) => {
  const response = await axios.get(API_USERS, withAuth(token));
  return response.data;
};

export const updateUserRole = async (token, userId, role) => {
  const response = await axios.put(
    `${API_USERS}/${userId}/role`,
    { role },
    withAuth(token)
  );
  return response.data;
};

export const deleteUser = async (token, userId) => {
  const response = await axios.delete(`${API_USERS}/${userId}`, withAuth(token));
  return response.data;
};

export const getAllPizzas = async (token) => {
  const response = await axios.get(API_PIZZAS, withAuth(token));
  return response.data;
};

export const getPizzaById = async (token, id) => {
  const response = await axios.get(`${API_PIZZAS}/${id}/details`, withAuth(token));
  return response.data;
};

export const createPizza = async (token, data) => {
  const response = await axios.post(API_PIZZAS, data, withAuth(token));
  return response.data;
};

export const updatePizza = async (token, id, data) => {
  const response = await axios.put(`${API_PIZZAS}/${id}`, data, withAuth(token));
  return response.data;
};

export const deletePizza = async (token, id) => {
  const response = await axios.delete(`${API_PIZZAS}/${id}`, withAuth(token));
  return response.data;
};

export const getAllIngredients = async (token) => {
  const response = await axios.get(`${API_PIZZAS}/ingredients`, withAuth(token));
  return response.data;
};

export const createIngredient = async (token, data) => {
  const response = await axios.post(
    `${API_PIZZAS}/ingredients`,
    data,
    withAuth(token)
  );
  return response.data;
};

export const updateIngredient = async (token, id, data) => {
  const response = await axios.put(
    `${API_PIZZAS}/ingredients/${id}`,
    data,
    withAuth(token)
  );
  return response.data;
};

export const deleteIngredient = async (token, id) => {
  const response = await axios.delete(
    `${API_PIZZAS}/ingredients/${id}`,
    withAuth(token)
  );
  return response.data;
};

export const addIngredientToPizza = async (token, pizzaId, ingredientId) => {
  const response = await axios.post(
    `${API_PIZZAS}/ingredients/link`,
    { pizzaId, ingredientId },
    withAuth(token)
  );
  return response.data;
};

export const removeIngredientFromPizza = async (token, pizzaId, ingredientId) => {
  const response = await axios.delete(`${API_PIZZAS}/ingredients/link`, {
    ...withAuth(token),
    data: { pizzaId, ingredientId },
  });
  return response.data;
};

export const getOrdersAdmin = async (token, filters = {}) => {
  const response = await axios.get(API_ORDERS, {
    ...withAuth(token),
    params: filters,
  });
  return response.data;
};

export const deleteOrderAdmin = async (token, orderId) => {
  const response = await axios.delete(`${API_ORDERS}/${orderId}`, withAuth(token));
  return response.data;
};

export const finalizeOrderAdmin = async (token, orderId) => {
  const response = await axios.patch(
    `${API_ORDERS}/${orderId}/status`,
    { status: "FINALIZED" },
    withAuth(token)
  );
  return response.data;
};

