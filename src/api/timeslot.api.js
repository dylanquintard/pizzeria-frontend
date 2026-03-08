import api, { authConfig } from "./http";

export const getActiveTimeSlots = async (token, filters = {}) => {
  const response = await api.get("/timeslots/active", {
    ...authConfig(token),
    params: filters,
  });
  return response.data;
};

export const createTimeSlots = async (token, data) => {
  const response = await api.post("/timeslots", data, authConfig(token));
  return response.data;
};

export const createTimeSlotsBatch = async (token, data) => {
  const response = await api.post("/timeslots/batch", data, authConfig(token));
  return response.data;
};

export const getAllTimeSlots = async (token) => {
  const response = await api.get("/timeslots", authConfig(token));
  return response.data;
};

export const updateTimeSlot = async (token, id, data) => {
  const response = await api.put(`/timeslots/${id}`, data, authConfig(token));
  return response.data;
};

export const activateTimeSlot = async (token, id, active) => {
  const response = await api.patch(
    `/timeslots/${id}/activate`,
    { active },
    authConfig(token)
  );
  return response.data;
};

export const deleteTimeSlot = async (token, id) => {
  const response = await api.delete(`/timeslots/${id}`, authConfig(token));
  return response.data;
};

