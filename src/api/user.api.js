import axios from "axios";
import { API_BASE_URL } from "../config/env";

const API_USERS = `${API_BASE_URL}/users`;
const API_PIZZAS = `${API_BASE_URL}/pizzas`;
const API_ORDERS = `${API_BASE_URL}/orders`;

const authHeaders = (token) => {
  if (!token) throw new Error("Missing token");
  return { Authorization: `Bearer ${token}` };
};

export const registerUser = async ({ name, email, phone, password }) => {
  const response = await axios.post(`${API_USERS}/register`, {
    name,
    email,
    phone,
    password,
  });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await axios.post(`${API_USERS}/login`, { email, password });
  return response.data;
};

export const getMe = async (token) => {
  const response = await axios.get(`${API_USERS}/me`, {
    headers: authHeaders(token),
  });
  return response.data;
};

export const updateMe = async (token, data) => {
  const response = await axios.put(`${API_USERS}/me`, data, {
    headers: authHeaders(token),
  });
  return response.data;
};

export const getAllPizzasClient = async () => {
  const response = await axios.get(API_PIZZAS);
  return response.data;
};

export const getAllIngredients = async (token) => {
  const response = await axios.get(`${API_PIZZAS}/ingredients`, {
    headers: authHeaders(token),
  });
  return response.data;
};

export const getCart = async (token) => {
  const response = await axios.get(`${API_ORDERS}/cart`, {
    headers: authHeaders(token),
  });
  return response.data;
};

export const addToCart = async (token, pizzaId, quantity, customizations) => {
  const response = await axios.post(
    `${API_ORDERS}/cart`,
    { pizzaId, quantity, customizations },
    { headers: authHeaders(token) }
  );
  return response.data;
};

export const removeFromCart = async (token, itemId) => {
  const response = await axios.delete(`${API_ORDERS}/cart/${itemId}`, {
    headers: authHeaders(token),
  });
  return response.data;
};

export const finalizeOrder = async (token, timeSlotId) => {
  const response = await fetch(`${API_ORDERS}/finalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ timeSlotId }),
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
};

export const getUserOrders = async (token) => {
  const response = await axios.get(`${API_USERS}/orders`, {
    headers: authHeaders(token),
  });
  return response.data;
};
