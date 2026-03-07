import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { MessageNotificationsContext } from "../context/MessageNotificationsContext";
import {
  addMessageToThread,
  createThread,
  getMyThreads,
  getThreadMessages,
} from "../api/message.api";

const mailboxFilters = [
  { key: "ALL" },
  { key: "NEW" },
  { key: "ARCHIVED" },
];

function formatDateTime(value, locale) {
  if (!value) return "-";
  return new Date(value).toLocaleString(locale);
}

function getUnreadCount(thread) {
  const count = Number(thread?.unreadCount || 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function getThreadTitle(thread) {
  if (thread?.subject && String(thread.subject).trim()) return thread.subject;
  return `Conversation #${thread?.id}`;
}

function isAdminSender(sender) {
  return String(sender || "").trim().toUpperCase() === "ADMIN";
}

export default function Messages() {
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
  const [subject, setSubject] = useState("");
  const [newThreadMessage, setNewThreadMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sortedThreads = useMemo(
    () =>
      [...threads].sort(
        (a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)
      ),
    [threads]
  );

  const getThreadUnreadCount = useCallback(
    (thread) => {
      const localCount = getUnreadCount(thread);
      if (localCount > 0) return localCount;

      const syncedCount = Number(unreadByThread[String(thread?.id || "")] || 0);
      return Number.isFinite(syncedCount) && syncedCount > 0 ? syncedCount : 0;
    },
    [unreadByThread]
  );

  const filteredThreads = useMemo(() => {
    if (activeFilter === "NEW") {
      return sortedThreads.filter((thread) => getThreadUnreadCount(thread) > 0);
    }
    if (activeFilter === "ARCHIVED") {
      return sortedThreads.filter((thread) => thread.status === "CLOSED");
    }
    return sortedThreads;
  }, [sortedThreads, activeFilter, getThreadUnreadCount]);

  const totalUnread = useMemo(
    () => sortedThreads.reduce((sum, thread) => sum + getThreadUnreadCount(thread), 0),
    [sortedThreads, getThreadUnreadCount]
  );

  const fetchThreads = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getMyThreads(token);
      const normalized = Array.isArray(data) ? data : [];
      setThreads(normalized);
      syncUnreadCountsFromThreads(normalized);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement des conversations", "Error while loading conversations"));
    }
  }, [token, syncUnreadCountsFromThreads, tr]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    fetchThreads();
  }, [authLoading, token, fetchThreads]);

  useEffect(() => {
    if (!token) return undefined;
    const timer = window.setInterval(() => {
      fetchThreads();
    }, 12000);
    return () => window.clearInterval(timer);
  }, [token, fetchThreads]);

  const handleSelectThread = async (threadId) => {
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
                unreadCount: 0,
                lastMessageAt: data?.lastMessageAt || thread.lastMessageAt,
                status: data?.status || thread.status,
              }
            : thread
        )
      );
      setMessage("");
      refreshUnreadCounts();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Impossible de recuperer les messages", "Unable to fetch messages"));
    }
  };

  const handleCreateThread = async (event) => {
    event.preventDefault();

    if (!newThreadMessage.trim()) {
      setMessage(tr("Le message est obligatoire", "Message is required"));
      return;
    }

    try {
      setLoading(true);
      const thread = await createThread(token, {
        subject: subject.trim() || null,
        content: newThreadMessage.trim(),
      });
      setSubject("");
      setNewThreadMessage("");
      setShowComposer(false);
      setMessage("");
      await fetchThreads();
      await handleSelectThread(thread.id);
      refreshUnreadCounts();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation de la conversation", "Error while creating conversation"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (event) => {
    event.preventDefault();

    if (!selectedThreadId) {
      setMessage(tr("Selectionnez une conversation", "Select a conversation"));
      return;
    }
    if (!replyMessage.trim()) {
      setMessage(tr("Le message est obligatoire", "Message is required"));
      return;
    }

    try {
      setLoading(true);
      await addMessageToThread(token, selectedThreadId, { content: replyMessage.trim() });
      setReplyMessage("");
      setMessage("");
      await fetchThreads();
      await handleSelectThread(selectedThreadId);
      refreshUnreadCounts();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de l'envoi", "Error while sending"));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || !user) return <p>{tr("Connectez-vous pour acceder a la messagerie.", "Sign in to access messaging.")}</p>;

  const messageIsError = /erreur|impossible|obligatoire/i.test(String(message).toLowerCase());

  return (
    <div className="section-shell space-y-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-saffron">{tr("Espace client", "Client area")}</p>
          <h1 className="font-display text-4xl uppercase tracking-wide text-white">{tr("Messagerie", "Messaging")}</h1>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {mailboxFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  activeFilter === filter.key
                    ? "bg-stone-100 text-stone-900"
                    : "border border-white/20 bg-black/20 text-stone-200 hover:bg-white/10"
                }`}
              >
                {filter.key === "ALL"
                  ? tr("Tous", "All")
                  : filter.key === "NEW"
                    ? tr("Non lus", "Unread")
                    : tr("Archives", "Archived")}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowComposer((prev) => !prev)}
            className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-100 transition hover:bg-charcoal"
          >
            {showComposer ? tr("Fermer", "Close") : tr("Nouveau message", "New message")}
          </button>
        </div>

        {showComposer && (
          <form onSubmit={handleCreateThread} className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <input
              placeholder={tr("Sujet (optionnel)", "Subject (optional)")}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-400 focus:border-sky-400 focus:outline-none"
            />
            <textarea
              placeholder={tr("Votre message", "Your message")}
              rows={3}
              value={newThreadMessage}
              onChange={(event) => setNewThreadMessage(event.target.value)}
              className="w-full rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-400 focus:border-sky-400 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {tr("Envoyer", "Send")}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
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
              const isArchived = thread.status === "CLOSED";

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => handleSelectThread(thread.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isActive
                      ? "border-white/25 bg-white/10"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-white">{getThreadTitle(thread)}</p>
                    {unreadCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
                        +{unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ${
                        unreadCount > 0 ? "bg-stone-500/25 text-stone-200" : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {unreadCount > 0 ? tr("Non lu", "Unread") : tr("Lu", "Read")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ${
                        isArchived ? "bg-stone-500/25 text-stone-200" : "bg-sky-500/20 text-sky-200"
                      }`}
                    >
                      {isArchived ? tr("Archive", "Archived") : tr("Nouveau", "New")}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-stone-400">{formatDateTime(thread.lastMessageAt || thread.createdAt, locale)}</p>
                </button>
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
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-lg font-semibold text-white">{getThreadTitle(selectedThread)}</h3>
                <p className="text-xs text-stone-300">
                  {tr("Statut", "Status")}: <span className="font-semibold">{selectedThread.status === "CLOSED" ? tr("Archive", "Archived") : tr("Nouveau", "New")}</span>
                </p>
              </div>

              <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
                {selectedThread.messages?.length === 0 && <p className="text-sm text-stone-400">{tr("Aucun message.", "No message.")}</p>}
                {selectedThread.messages?.map((entry) => {
                  const adminMessage = isAdminSender(entry.sender);
                  return (
                    <div key={entry.id} className={`flex ${adminMessage ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 ${
                          adminMessage
                            ? "border border-white/20 bg-white/10 text-stone-100"
                            : "bg-slate-200 text-slate-900"
                        }`}
                      >
                        <div className={`text-[11px] font-semibold ${adminMessage ? "text-stone-300" : "text-slate-700"}`}>
                          {entry.sender} - {formatDateTime(entry.createdAt, locale)}
                        </div>
                        <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${adminMessage ? "text-stone-100" : "text-slate-900"}`}>
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
                  placeholder={tr("Ecrire un message...", "Write a message...")}
                  disabled={selectedThread.status === "CLOSED"}
                  className="w-full rounded-xl border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-400 focus:border-sky-400 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || selectedThread.status === "CLOSED"}
                    className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {tr("Repondre", "Reply")}
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
