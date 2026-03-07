import axios from "axios";
import { API_BASE_URL } from "../config/env";

const API_CATEGORIES = `${API_BASE_URL}/categories`;

const withAuth = (token) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

export const getCategories = async (filters = {}) => {
  const response = await axios.get(API_CATEGORIES, { params: filters });
  return response.data;
};

export const getCategoryById = async (id) => {
  const response = await axios.get(`${API_CATEGORIES}/${id}`);
  return response.data;
};

export const createCategory = async (token, data) => {
  const response = await axios.post(API_CATEGORIES, data, withAuth(token));
  return response.data;
};

export const updateCategory = async (token, id, data) => {
  const response = await axios.put(`${API_CATEGORIES}/${id}`, data, withAuth(token));
  return response.data;
};

export const activateCategory = async (token, id, active) => {
  const response = await axios.patch(
    `${API_CATEGORIES}/${id}/activate`,
    { active },
    withAuth(token)
  );
  return response.data;
};

export const deleteCategory = async (token, id) => {
  const response = await axios.delete(`${API_CATEGORIES}/${id}`, withAuth(token));
  return response.data;
};
