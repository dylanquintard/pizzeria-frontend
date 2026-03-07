import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getAdminThreads, getMyThreads } from "../api/message.api";
import { AuthContext } from "./AuthContext";

const INITIAL_STATE = {
  totalUnread: 0,
  unreadByThread: {},
  loading: false,
};

function normalizeUnreadCount(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function isUnreadFromLatestMessage(thread, viewerRole) {
  const latest = Array.isArray(thread?.messages) ? thread.messages[0] : null;
  if (!latest || latest.isRead !== false) return 0;

  const sender = String(latest.sender || "").trim().toUpperCase();
  const isAdminViewer = String(viewerRole || "").trim().toUpperCase() === "ADMIN";

  if (isAdminViewer) {
    return sender !== "ADMIN" ? 1 : 0;
  }
  return sender === "ADMIN" || sender === "SYSTEM" ? 1 : 0;
}

function buildUnreadState(threads, viewerRole) {
  const unreadByThread = {};
  let totalUnread = 0;

  (Array.isArray(threads) ? threads : []).forEach((thread) => {
    const threadId = String(thread?.id || "");
    if (!threadId) return;
    const apiCount = normalizeUnreadCount(thread?.unreadCount);
    const fallbackCount = isUnreadFromLatestMessage(thread, viewerRole);
    const count = Math.max(apiCount, fallbackCount);
    unreadByThread[threadId] = count;
    totalUnread += count;
  });

  return { totalUnread, unreadByThread };
}

export const MessageNotificationsContext = createContext({
  totalUnread: 0,
  unreadByThread: {},
  loading: false,
  refreshUnreadCounts: async () => null,
  syncUnreadCountsFromThreads: () => null,
  markThreadAsRead: () => {},
});

export function MessageNotificationsProvider({ children }) {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const [state, setState] = useState(INITIAL_STATE);
  const requestInFlightRef = useRef(false);
  const viewerRole = user?.role;

  const syncUnreadCountsFromThreads = useCallback((threads) => {
    const next = buildUnreadState(threads, viewerRole);
    setState((prev) => ({ ...prev, ...next }));
    return next;
  }, [viewerRole]);

  const markThreadAsRead = useCallback((threadId) => {
    const key = String(threadId || "");
    if (!key) return;

    setState((prev) => {
      const previousCount = normalizeUnreadCount(prev.unreadByThread[key]);
      if (previousCount <= 0) return prev;

      return {
        ...prev,
        totalUnread: Math.max(0, prev.totalUnread - previousCount),
        unreadByThread: {
          ...prev.unreadByThread,
          [key]: 0,
        },
      };
    });
  }, []);

  const refreshUnreadCounts = useCallback(async () => {
    if (!token || !user) {
      requestInFlightRef.current = false;
      setState(INITIAL_STATE);
      return INITIAL_STATE;
    }

    if (requestInFlightRef.current) return null;
    requestInFlightRef.current = true;
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const data = user?.role === "ADMIN" ? await getAdminThreads(token, {}) : await getMyThreads(token);
      const next = buildUnreadState(data, viewerRole);
      setState({ ...next, loading: false });
      return next;
    } catch (_err) {
      setState((prev) => ({ ...prev, loading: false }));
      return null;
    } finally {
      requestInFlightRef.current = false;
    }
  }, [token, user, viewerRole]);

  useEffect(() => {
    if (authLoading) return;
    refreshUnreadCounts();
  }, [authLoading, refreshUnreadCounts]);

  useEffect(() => {
    if (!token || !user) return undefined;
    const timer = window.setInterval(() => {
      refreshUnreadCounts();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [token, user, refreshUnreadCounts]);

  useEffect(() => {
    if (!token || !user) return undefined;

    const handleFocus = () => {
      refreshUnreadCounts();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshUnreadCounts();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [token, user, refreshUnreadCounts]);

  return (
    <MessageNotificationsContext.Provider
      value={{
        totalUnread: state.totalUnread,
        unreadByThread: state.unreadByThread,
        loading: state.loading,
        refreshUnreadCounts,
        syncUnreadCountsFromThreads,
        markThreadAsRead,
      }}
    >
      {children}
    </MessageNotificationsContext.Provider>
  );
}
