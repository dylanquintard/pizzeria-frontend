import { createContext, useEffect, useState } from "react";
import { getMe, logoutUser } from "../api/user.api";

export const AuthContext = createContext();
const INVALID_TOKEN_VALUES = new Set(["", "undefined", "null"]);
const SESSION_COOKIE_TOKEN = "__cookie_session__";
const AUTH_TOKEN_STORAGE_KEY = "pizzeria.auth.token";

function hasValidToken(token) {
  if (typeof token !== "string") return false;
  return !INVALID_TOKEN_VALUES.has(token.trim());
}

function isJwtLike(value) {
  if (typeof value !== "string") return false;
  const token = value.trim();
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function readStoredJwtToken() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!isJwtLike(raw)) return null;
  return raw.trim();
}

function writeStoredJwtToken(jwtToken) {
  if (typeof window === "undefined") return;

  if (isJwtLike(jwtToken)) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, jwtToken.trim());
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      try {
        const storedJwtToken = readStoredJwtToken();

        if (storedJwtToken) {
          try {
            const profile = await getMe(storedJwtToken);
            if (cancelled) return;
            setUser(profile);
            setToken(storedJwtToken);
            return;
          } catch (_jwtErr) {
            writeStoredJwtToken(null);
          }
        }

        const profile = await getMe();
        if (cancelled) return;
        setUser(profile);
        setToken(SESSION_COOKIE_TOKEN);
      } catch (_err) {
        if (cancelled) return;
        setUser(null);
        setToken(null);
        writeStoredJwtToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (userData, jwtToken) => {
    if (!userData) {
      return;
    }

    setUser(userData);
    const normalizedToken = hasValidToken(jwtToken) ? jwtToken.trim() : SESSION_COOKIE_TOKEN;
    setToken(normalizedToken);
    writeStoredJwtToken(normalizedToken);
  };

  const logout = async () => {
    try {
      await logoutUser(token);
    } catch (_err) {
      // Always clear local state even if server logout fails.
    }

    setUser(null);
    setToken(null);
    writeStoredJwtToken(null);
  };

  const updateUserContext = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, updateUserContext, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
