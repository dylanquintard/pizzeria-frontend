import api, { authConfig } from "./http";

export const getWeeklySettings = async (token) => {
  const response = await api.get("/timeslots/weekly-settings", authConfig(token));
  return response.data;
};

export const upsertWeeklySetting = async (token, dayOfWeek, data) => {
  const response = await api.put(
    `/timeslots/weekly-settings/${dayOfWeek}`,
    data,
    authConfig(token)
  );
  return response.data;
};

export const getPickupAvailability = async (token, filters = {}) => {
  const response = await api.get("/timeslots/availability", {
    ...authConfig(token),
    params: filters,
  });
  return response.data;
};
