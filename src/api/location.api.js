import axios from "axios";
import { API_BASE_URL } from "../config/env";

const API_LOCATIONS = `${API_BASE_URL}/locations`;

const withAuth = (token) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

export const getLocations = async (filters = {}) => {
  const response = await axios.get(API_LOCATIONS, { params: filters });
  return response.data;
};

export const getLocationById = async (id) => {
  const response = await axios.get(`${API_LOCATIONS}/${id}`);
  return response.data;
};

export const createLocation = async (token, data) => {
  const response = await axios.post(API_LOCATIONS, data, withAuth(token));
  return response.data;
};

export const updateLocation = async (token, id, data) => {
  const response = await axios.put(`${API_LOCATIONS}/${id}`, data, withAuth(token));
  return response.data;
};

export const activateLocation = async (token, id, active) => {
  const response = await axios.patch(
    `${API_LOCATIONS}/${id}/activate`,
    { active },
    withAuth(token)
  );
  return response.data;
};

export const deleteLocation = async (token, id) => {
  const response = await axios.delete(`${API_LOCATIONS}/${id}`, withAuth(token));
  return response.data;
};
