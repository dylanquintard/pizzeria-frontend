import axios from "axios";
import { API_BASE_URL } from "../config/env";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

const CSRF_HEADER_NAME = "x-csrf-token";
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);
let csrfToken = "";

function isJwtLike(value) {
  if (typeof value !== "string") return false;
  const token = value.trim();
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function normalizeCsrfToken(value) {
  const token = String(value || "").trim();
  return token || "";
}

function setCsrfToken(token) {
  csrfToken = normalizeCsrfToken(token);
}

export function clearCsrfToken() {
  csrfToken = "";
}

api.interceptors.request.use((config) => {
  const method = String(config?.method || "get").toLowerCase();
  if (!MUTATING_METHODS.has(method)) return config;
  if (!csrfToken) return config;

  const nextConfig = { ...config };
  nextConfig.headers = {
    ...(config.headers || {}),
    [CSRF_HEADER_NAME]: csrfToken,
  };
  return nextConfig;
});

api.interceptors.response.use((response) => {
  const nextToken = normalizeCsrfToken(response?.headers?.[CSRF_HEADER_NAME]);
  if (nextToken) {
    setCsrfToken(nextToken);
  }
  return response;
});

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
