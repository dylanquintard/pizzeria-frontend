const stripTrailingSlash = (value) => value.replace(/\/+$/, "");

const normalizeUrl = (value) => {
  if (!value) return "";

  const trimmed = value.trim();
  const isHttpUrl = /^https?:\/\/.+/i.test(trimmed);

  if (!isHttpUrl) return "";
  return stripTrailingSlash(trimmed);
};

const normalizeBrandLogoUrl = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return trimmed;
  if (/^https?:\/\/.+/i.test(trimmed)) return trimmed;
  return "";
};

const localApiBaseUrl = "http://localhost:5000/api";
const defaultSiteUrl = "https://pizzeria-front-dqty.onrender.com";
const isProduction = process.env.NODE_ENV === "production";
const configuredApiBaseUrl = normalizeUrl(process.env.REACT_APP_API_BASE_URL);
const configuredSiteUrl = normalizeUrl(process.env.REACT_APP_SITE_URL);

if (isProduction) {
  if (!configuredApiBaseUrl) {
    throw new Error("REACT_APP_API_BASE_URL is required in production.");
  }

  if (!configuredApiBaseUrl.startsWith("https://")) {
    throw new Error("REACT_APP_API_BASE_URL must use HTTPS in production.");
  }
}

export const API_BASE_URL =
  configuredApiBaseUrl || localApiBaseUrl;

export const SITE_URL = configuredSiteUrl || defaultSiteUrl;

export const REALTIME_STREAM_URL = `${API_BASE_URL}/realtime/stream`;

export const INSTAGRAM_URL =
  normalizeUrl(process.env.REACT_APP_INSTAGRAM_URL) || "https://instagram.com";

export const BRAND_LOGO_URL =
  normalizeBrandLogoUrl(process.env.REACT_APP_BRAND_LOGO_URL) || "/logo.webp";

