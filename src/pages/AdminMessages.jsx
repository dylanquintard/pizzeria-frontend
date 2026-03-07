import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { MessageNotificationsContext } from "../context/MessageNotificationsContext";
import {
  addMessageToThread,
  deleteAdminThread,
  getAdminThreads,
  getThreadMessages,
} from "../api/message.api";

function formatDateTime(value, locale) {
  if (!value) return "-";
  return new Date(value).toLocaleString(locale);
}

function isAdminSender(sender) {
  const normalized = String(sender || "").trim().toUpperCase();
  return ["ADMIN", "SUPPORT", "STAFF"].includes(normalized);
}

function getUnreadCount(thread) {
  const count = Number(thread?.unreadCount || 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function getThreadTitle(thread, tr) {
  if (thread?.subject && String(thread.subject).trim()) return thread.subject;
  return `${tr("Conversation", "Conversation")} #${thread?.id}`;
}

function inferUnreadFromLatestMessage(thread) {
  const latest = Array.isArray(thread?.messages) ? thread.messages[0] : null;
  if (!latest || latest.isRead !== false) return 0;
  const sender = String(latest.sender || "").trim().toUpperCase();
  return sender !== "ADMIN" ? 1 : 0;
}

export default function AdminMessages() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr, locale } = useLanguage();
  const {
    unreadByThread,
    syncUnreadCountsFromThreads,
    markThreadAsRead,
    refreshUnreadCounts,
  } = useContext(MessageNotificationsContext);
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [replyMessage, setReplyMessage] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const mailboxFilters = useMemo(
    () => [
      { key: "ALL", label: tr("Tous", "All") },
      { key: "UNREAD", label: tr("Non lus", "Unread") },
      { key: "READ", label: tr("Lus", "Read") },
    ],
    [tr]
  );

  const sortedThreads = useMemo(
    () =>
      [...threads].sort(
        (a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)
      ),
    [threads]
  );

  const getThreadUnreadCount = useCallback(
    (thread) => {
      const localCount = Math.max(getUnreadCount(thread), inferUnreadFromLatestMessage(thread));
      if (localCount > 0) return localCount;
      const syncedCount = Number(unreadByThread[String(thread?.id || "")] || 0);
      return Number.isFinite(syncedCount) && syncedCount > 0 ? syncedCount : 0;
    },
    [unreadByThread]
  );

  const filteredThreads = useMemo(() => {
    if (activeFilter === "ALL") {
      return sortedThreads;
    }
    if (activeFilter === "UNREAD") {
      return sortedThreads.filter((thread) => getThreadUnreadCount(thread) > 0);
    }
    if (activeFilter === "READ") {
      return sortedThreads.filter((thread) => getThreadUnreadCount(thread) === 0);
    }
    return sortedThreads;
  }, [sortedThreads, activeFilter, getThreadUnreadCount]);

  const totalUnread = useMemo(
    () => sortedThreads.reduce((sum, thread) => sum + getThreadUnreadCount(thread), 0),
    [sortedThreads, getThreadUnreadCount]
  );

  const fetchThreads = useCallback(async () => {
    if (!token || user?.role !== "ADMIN") return;
    try {
      const data = await getAdminThreads(token, {});
      const normalized = Array.isArray(data) ? data : [];
      setThreads(normalized);
      if (selectedThreadId) {
        const selectedStillExists = normalized.find((entry) => String(entry.id) === String(selectedThreadId));
        if (!selectedStillExists) {
          setSelectedThreadId(null);
          setSelectedThread(null);
        }
      }
      syncUnreadCountsFromThreads(normalized);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement des conversations", "Error while loading conversations"));
    }
  }, [token, user?.role, selectedThreadId, syncUnreadCountsFromThreads, tr]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.role !== "ADMIN") return;
    fetchThreads();
  }, [authLoading, token, user?.role, fetchThreads]);

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") return undefined;
    const timer = window.setInterval(() => {
      fetchThreads();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [token, user?.role, fetchThreads]);

  const handleSelectThread = useCallback(
    async (threadId) => {
      setSelectedThreadId(threadId);
      try {
        const data = await getThreadMessages(token, threadId);
        setSelectedThread(data);
        markThreadAsRead(threadId);
        setThreads((prev) =>
          prev.map((thread) =>
            String(thread.id) === String(threadId)
              ? {
                  ...thread,
                  lastMessageAt: data?.lastMessageAt || thread.lastMessageAt,
                  status: data?.status || thread.status,
                  unreadCount: 0,
                }
              : thread
          )
        );
        setMessage("");
        refreshUnreadCounts();
        setActiveFilter((prev) => (prev === "UNREAD" ? "ALL" : prev));
      } catch (err) {
        setMessage(err.response?.data?.error || tr("Impossible de recuperer les messages", "Unable to fetch messages"));
      }
    },
    [token, markThreadAsRead, refreshUnreadCounts, tr]
  );

  const handleSendReply = async (event) => {
    event.preventDefault();
    if (!selectedThreadId || !replyMessage.trim()) return;

    try {
      setLoading(true);
      await addMessageToThread(token, selectedThreadId, { content: replyMessage.trim() });
      setReplyMessage("");
      await fetchThreads();
      await handleSelectThread(selectedThreadId);
      setMessage("");
      refreshUnreadCounts();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de l'envoi", "Error while sending"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteThread = async (threadId) => {
    const parsedThreadId = Number(threadId);
    if (!Number.isInteger(parsedThreadId) || parsedThreadId <= 0) return;

    try {
      setLoading(true);
      await deleteAdminThread(token, parsedThreadId);
      setThreads((prev) => prev.filter((thread) => String(thread.id) !== String(parsedThreadId)));
      if (String(selectedThreadId || "") === String(parsedThreadId)) {
        setSelectedThreadId(null);
        setSelectedThread(null);
      }
      await fetchThreads();
      setMessage(tr("Conversation supprimee", "Conversation deleted"));
      refreshUnreadCounts();
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setThreads((prev) => prev.filter((thread) => String(thread.id) !== String(parsedThreadId)));
        if (String(selectedThreadId || "") === String(parsedThreadId)) {
          setSelectedThreadId(null);
          setSelectedThread(null);
        }
        setMessage(tr("Conversation deja supprimee", "Conversation already deleted"));
        refreshUnreadCounts();
        return;
      }
      const details = err.response?.data?.error || err.message || tr("Erreur lors de la suppression", "Error while deleting");
      setMessage(`${tr("Suppression impossible", "Deletion failed")}${status ? ` (${status})` : ""}: ${details}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;

  const messageIsError = /erreur|impossible|forbidden|refuse|error|unable|failed|denied/i.test(String(message).toLowerCase());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">{tr("Messagerie admin", "Admin messages")}</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{tr("Boite de reception clients", "Client inbox")}</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
          {tr("Non lus", "Unread")} {totalUnread > 0 ? `+${totalUnread}` : "0"}
        </div>
      </div>

      {message && (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${
            messageIsError
              ? "border-red-400/40 bg-red-500/10 text-red-200"
              : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {message}
        </p>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex flex-wrap gap-2">
          {mailboxFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`!rounded-full !px-3 !py-1.5 !text-xs !font-semibold !uppercase !tracking-wide !transition ${
                activeFilter === filter.key
                  ? "!bg-stone-100 !text-stone-900"
                  : "!border !border-white/20 !bg-black/20 !text-stone-200 hover:!bg-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-stone-200">{tr("Conversations", "Conversations")}</h3>
            <span className="text-xs text-stone-400">{filteredThreads.length}</span>
          </div>

          <div className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
            {filteredThreads.length === 0 && (
              <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-stone-300">
                {tr("Aucune conversation", "No conversation")}
              </p>
            )}

            {filteredThreads.map((thread) => {
              const isActive = String(selectedThreadId || "") === String(thread.id);
              const unreadCount = getThreadUnreadCount(thread);
              const userName = thread.user?.name || tr("Inconnu", "Unknown");
              const userEmail = thread.user?.email || "-";

              return (
                <div
                  key={thread.id}
                  className={`rounded-xl border p-3 transition ${
                    isActive
                      ? "border-white/25 bg-white/10"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectThread(thread.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelectThread(thread.id);
                        }
                      }}
                      className="min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">{getThreadTitle(thread, tr)}</p>
                        {unreadCount > 0 && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
                            +{unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-stone-300">
                        {userName} - {userEmail}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ${
                            unreadCount > 0 ? "bg-stone-500/25 text-stone-200" : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {unreadCount > 0 ? tr("Non lu", "Unread") : tr("Lu", "Read")}
                        </span>
                        <span className="text-stone-400">
                          {formatDateTime(thread.lastMessageAt || thread.createdAt, locale)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleDeleteThread(thread.id);
                        }}
                        title={tr("Supprimer", "Delete")}
                        className="relative z-20 !inline-flex !h-8 !w-8 !items-center !justify-center !rounded-lg !border !border-red-400/40 !bg-red-500/15 !px-0 !py-0 !text-red-200 !transition hover:!bg-red-500/25"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {!selectedThread && (
            <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-300">
              {tr("Selectionnez une conversation.", "Select a conversation.")}
            </p>
          )}

          {selectedThread && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{getThreadTitle(selectedThread, tr)}</h3>
                  <p className="text-xs text-stone-300">
                    {selectedThread.user?.name || tr("Inconnu", "Unknown")} - {selectedThread.user?.email || "-"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleDeleteThread(selectedThread.id);
                    }}
                    className="!rounded-lg !border !border-red-400/40 !bg-red-500/15 !px-3 !py-2 !text-xs !font-semibold !text-red-100 !transition hover:!bg-red-500/25"
                  >
                    {tr("Supprimer", "Delete")}
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
                {selectedThread.messages?.length === 0 && <p className="text-sm text-stone-400">{tr("Aucun message.", "No message.")}</p>}

                {selectedThread.messages?.map((entry) => {
                  const adminMessage = isAdminSender(entry.sender);
                  return (
                    <div key={entry.id} className={`flex ${adminMessage ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 ${
                          adminMessage
                            ? "bg-slate-200 text-slate-900"
                            : "border border-white/20 bg-white/10 text-stone-100"
                        }`}
                      >
                        <div className={`text-[11px] font-semibold ${adminMessage ? "text-slate-700" : "text-stone-300"}`}>
                          {entry.sender} - {formatDateTime(entry.createdAt, locale)}
                        </div>
                        <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${adminMessage ? "text-slate-900" : "text-stone-100"}`}>
                          {entry.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendReply} className="space-y-2">
                <textarea
                  rows={3}
                  value={replyMessage}
                  onChange={(event) => setReplyMessage(event.target.value)}
                  placeholder={tr("Repondre au client...", "Reply to customer...")}
                  className="w-full rounded-xl border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-400 focus:border-sky-400 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="!rounded-lg !bg-slate-200 !px-4 !py-2 !text-xs !font-bold !uppercase !tracking-wide !text-slate-900 !transition hover:!bg-slate-100 disabled:!cursor-not-allowed disabled:!opacity-50"
                  >
                    {tr("Envoyer", "Send")}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
