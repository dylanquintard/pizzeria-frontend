import { createContext, useEffect, useState } from "react";
import { getCsrfToken, getMe, logoutUser } from "../api/user.api";
import { clearCsrfToken } from "../api/http";

export const AuthContext = createContext();
const INVALID_TOKEN_VALUES = new Set(["", "undefined", "null"]);
const SESSION_COOKIE_TOKEN = "__cookie_session__";

function hasValidToken(token) {
  if (typeof token !== "string") return false;
  return !INVALID_TOKEN_VALUES.has(token.trim());
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      try {
        const profile = await getMe();
        if (cancelled) return;
        setUser(profile);
        setToken(SESSION_COOKIE_TOKEN);
      } catch (_err) {
        if (cancelled) return;
        setUser(null);
        setToken(null);
        clearCsrfToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const syncCsrfToken = async () => {
      try {
        await getCsrfToken(token);
      } catch (_err) {
        if (!cancelled) {
          clearCsrfToken();
        }
      }
    };

    syncCsrfToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = (userData, jwtToken) => {
    if (!userData) {
      return;
    }

    setUser(userData);
    const normalizedToken = hasValidToken(jwtToken) ? jwtToken.trim() : SESSION_COOKIE_TOKEN;
    setToken(normalizedToken);
  };

  const logout = async () => {
    try {
      await logoutUser(token);
    } catch (_err) {
      // Always clear local state even if server logout fails.
    }

    setUser(null);
    setToken(null);
    clearCsrfToken();
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
