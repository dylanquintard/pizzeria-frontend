import axios from "axios";
import { API_BASE_URL } from "../config/env";

const API_MESSAGES = `${API_BASE_URL}/messages`;

const withAuth = (token) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

export const getMyThreads = async (token) => {
  const response = await axios.get(`${API_MESSAGES}/threads/me`, withAuth(token));
  return response.data;
};

export const createThread = async (token, data) => {
  const response = await axios.post(`${API_MESSAGES}/threads`, data, withAuth(token));
  return response.data;
};

export const getThreadMessages = async (token, threadId) => {
  const response = await axios.get(
    `${API_MESSAGES}/threads/${threadId}/messages`,
    withAuth(token)
  );
  return response.data;
};

export const addMessageToThread = async (token, threadId, data) => {
  const response = await axios.post(
    `${API_MESSAGES}/threads/${threadId}/messages`,
    data,
    withAuth(token)
  );
  return response.data;
};

export const getAdminThreads = async (token, filters = {}) => {
  const response = await axios.get(`${API_MESSAGES}/admin/threads`, {
    ...withAuth(token),
    params: filters,
  });
  return response.data;
};

export const updateThreadStatus = async (token, threadId, status) => {
  const response = await axios.patch(
    `${API_MESSAGES}/admin/threads/${threadId}/status`,
    { status },
    withAuth(token)
  );
  return response.data;
};

export const deleteAdminThread = async (token, threadId) => {
  const response = await axios.delete(
    `${API_MESSAGES}/admin/threads/${threadId}`,
    withAuth(token)
  );
  return response.data;
};
