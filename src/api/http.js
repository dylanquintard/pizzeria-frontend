import axios from "axios";
import { API_BASE_URL } from "../config/env";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

function isJwtLike(value) {
  if (typeof value !== "string") return false;
  const token = value.trim();
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export function authConfig(token) {
  if (!isJwtLike(token)) {
    return {};
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export default api;
