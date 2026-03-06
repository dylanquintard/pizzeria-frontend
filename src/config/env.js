const stripTrailingSlash = (value) => value.replace(/\/+$/, "");

const normalizeUrl = (value) => {
  if (!value) return "";

  const trimmed = value.trim();
  const isHttpUrl = /^https?:\/\/.+/i.test(trimmed);

  if (!isHttpUrl) return "";
  return stripTrailingSlash(trimmed);
};

const localApiBaseUrl = "http://localhost:5000/api";

export const API_BASE_URL =
  normalizeUrl(process.env.REACT_APP_API_BASE_URL) || localApiBaseUrl;

const derivedSocketUrl = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;

export const SOCKET_URL =
  normalizeUrl(process.env.REACT_APP_SOCKET_URL) || derivedSocketUrl;
