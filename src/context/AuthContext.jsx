import { createContext, useEffect, useState } from "react";
import { getMe, logoutUser } from "../api/user.api";

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
    setToken(hasValidToken(jwtToken) ? jwtToken.trim() : SESSION_COOKIE_TOKEN);
  };

  const logout = async () => {
    try {
      await logoutUser(token);
    } catch (_err) {
      // Always clear local state even if server logout fails.
    }

    setUser(null);
    setToken(null);
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
