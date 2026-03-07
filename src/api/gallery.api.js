import axios from "axios";
import { API_BASE_URL } from "../config/env";

const API_GALLERY = `${API_BASE_URL}/gallery`;

const withAuth = (token) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

export const getPublicGallery = async (filters = {}) => {
  const response = await axios.get(API_GALLERY, { params: filters });
  return response.data;
};

export const getGalleryAdmin = async (token, filters = {}) => {
  const response = await axios.get(`${API_GALLERY}/admin/all`, {
    ...withAuth(token),
    params: filters,
  });
  return response.data;
};

export const createGalleryImage = async (token, data) => {
  const response = await axios.post(API_GALLERY, data, withAuth(token));
  return response.data;
};

export const updateGalleryImage = async (token, id, data) => {
  const response = await axios.put(`${API_GALLERY}/${id}`, data, withAuth(token));
  return response.data;
};

export const activateGalleryImage = async (token, id, active) => {
  const response = await axios.patch(
    `${API_GALLERY}/${id}/activate`,
    { active },
    withAuth(token)
  );
  return response.data;
};

export const deleteGalleryImage = async (token, id) => {
  const response = await axios.delete(`${API_GALLERY}/${id}`, withAuth(token));
  return response.data;
};
