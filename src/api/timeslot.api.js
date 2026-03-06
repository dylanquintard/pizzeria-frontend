import axios from "axios";
import { API_BASE_URL } from "../config/env";

const API_TIMESLOTS = `${API_BASE_URL}/timeslots`;

const withAuth = (token) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

export const getActiveTimeSlots = async (token) => {
  const response = await axios.get(`${API_TIMESLOTS}/active`, withAuth(token));
  return response.data;
};

export const createTimeSlots = async (token, data) => {
  const response = await axios.post(API_TIMESLOTS, data, withAuth(token));
  return response.data;
};

export const createTimeSlotsBatch = async (token, data) => {
  const response = await axios.post(`${API_TIMESLOTS}/batch`, data, withAuth(token));
  return response.data;
};

export const getAllTimeSlots = async (token) => {
  const response = await axios.get(API_TIMESLOTS, withAuth(token));
  return response.data;
};

export const updateTimeSlot = async (token, id, data) => {
  const response = await axios.put(`${API_TIMESLOTS}/${id}`, data, withAuth(token));
  return response.data;
};

export const activateTimeSlot = async (token, id, active) => {
  const response = await axios.patch(
    `${API_TIMESLOTS}/${id}/activate`,
    { active },
    withAuth(token)
  );
  return response.data;
};

export const deleteTimeSlot = async (token, id) => {
  const response = await axios.delete(`${API_TIMESLOTS}/${id}`, withAuth(token));
  return response.data;
};
