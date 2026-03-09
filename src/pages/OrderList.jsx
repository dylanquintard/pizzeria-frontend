import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getOrdersAdmin,
  getAllUsers,
  deleteOrderAdmin,
  finalizeOrderAdmin,
} from "../api/admin.api";
import { useRealtimeEvents } from "../hooks/useRealtimeEvents";

function toLocalIsoDate(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getOrderItemProduct(item) {
  return item?.pizza || item?.product || item?.menuItem || null;
}

function getOrderItemName(item, tr) {
  const product = getOrderItemProduct(item);
  return product?.name || item?.name || `${tr("Produit", "Product")} #${item?.id ?? "?"}`;
}

function getIngredientName(ingredient, tr) {
  return ingredient?.name || ingredient?.ingredient?.name || tr("Ingredient", "Ingredient");
}

function getClientPhone(order) {
  return (
    order?.user?.phone ||
    order?.user?.phoneNumber ||
    order?.user?.telephone ||
    order?.user?.mobile ||
    order?.user?.tel ||
    order?.phoneNumber ||
    order?.telephone ||
    order?.mobile ||
    order?.contactPhone ||
    order?.phone ||
    null
  );
}

function formatPrice(value) {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? "0.00" : numeric.toFixed(2);
}

export default function OrderList() {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const { tr, locale } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(toLocalIsoDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("COMPLETED");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [usersById, setUsersById] = useState({});
  const [usersByEmail, setUsersByEmail] = useState({});
  const [usersByName, setUsersByName] = useState({});
  const [usersLookupReady, setUsersLookupReady] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const seenOrderIdsRef = useRef(new Set());
  const snapshotInitializedRef = useRef(false);
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  const changeDate = (days) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(toLocalIsoDate(d));
  };

  const fetchOrders = useCallback(async () => {
    if (!token || !user || user.role !== "ADMIN") return;

    setLoading(true);
    try {
      const data = await getOrdersAdmin(token, {
        date: selectedDate,
        status: selectedStatus,
      });
      const nextOrders = Array.isArray(data) ? data : [];
      setOrders(nextOrders);

      const nextIds = new Set(nextOrders.map((entry) => String(entry.id)));
      if (!snapshotInitializedRef.current) {
        seenOrderIdsRef.current = nextIds;
        snapshotInitializedRef.current = true;
      } else {
        const newOrders = nextOrders.filter((entry) => !seenOrderIdsRef.current.has(String(entry.id)));
        if (newOrders.length > 0) {
          setNewOrdersCount((prev) => prev + newOrders.length);

          if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
            const notificationText =
              newOrders.length > 1
                ? tr(`${newOrders.length} nouvelles commandes`, `${newOrders.length} new orders`)
                : tr("Nouvelle commande recue", "New order received");

            const browserNotification = new Notification(tr("Pizzeria - Admin", "Pizzeria - Admin"), {
              body: notificationText,
              tag: "new-order",
            });
            browserNotification.onclick = () => {
              window.focus();
            };
          }
        }
        seenOrderIdsRef.current = nextIds;
      }
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement des commandes", "Error while loading orders"));
    } finally {
      setLoading(false);
    }
  }, [token, user, selectedDate, selectedStatus, tr]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(window.Notification.permission);
  }, []);

  useEffect(() => {
    snapshotInitializedRef.current = false;
    seenOrderIdsRef.current = new Set();
    setNewOrdersCount(0);
  }, [selectedDate, selectedStatus]);

  useEffect(() => {
    if (authLoading) return;
    fetchOrders();
  }, [authLoading, fetchOrders]);

  const handleRealtimeEvent = useCallback(
    (eventName) => {
      if (eventName === "orders:admin-updated") {
        fetchOrders();
      }
    },
    [fetchOrders]
  );

  useRealtimeEvents({
    enabled: Boolean(token && user?.role === "ADMIN"),
    onEvent: handleRealtimeEvent,
    onConnectionChange: setRealtimeConnected,
  });

  useEffect(() => {
    if (!token || !user || user.role !== "ADMIN") return;

    let cancelled = false;

    async function fetchUsersForPhoneLookup() {
      try {
        const users = await getAllUsers(token);
        if (cancelled) return;

        const byId = {};
        const byEmail = {};
        const byName = {};
        (Array.isArray(users) ? users : []).forEach((entry) => {
          const phone = entry?.phone || entry?.phoneNumber || entry?.telephone || null;
          if (!phone) return;

          if (entry?.id !== undefined && entry?.id !== null) {
            byId[String(entry.id)] = String(phone);
          }
          if (entry?.email) {
            byEmail[String(entry.email).toLowerCase()] = String(phone);
          }
          if (entry?.name) {
            const nameKey = String(entry.name).trim().toLowerCase();
            if (nameKey && !byName[nameKey]) {
              byName[nameKey] = String(phone);
            }
          }
        });

        setUsersById(byId);
        setUsersByEmail(byEmail);
        setUsersByName(byName);
      } catch (_err) {
        if (!cancelled) {
          setUsersById({});
          setUsersByEmail({});
          setUsersByName({});
        }
      } finally {
        if (!cancelled) {
          setUsersLookupReady(true);
        }
      }
    }

    fetchUsersForPhoneLookup();

    return () => {
      cancelled = true;
    };
  }, [token, user]);

  const handleDelete = async (orderId) => {
    if (!window.confirm(tr("Voulez-vous vraiment supprimer cette commande ?", "Do you really want to delete this order?"))) return;

    try {
      await deleteOrderAdmin(token, orderId);
      fetchOrders();
      setMessage(tr("Commande supprimee", "Order deleted"));
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || tr("Impossible de supprimer la commande", "Unable to delete order"));
    }
  };

  const handleFinalize = async (orderId) => {
    if (!window.confirm(tr("Voulez-vous vraiment finaliser cette commande ?", "Do you really want to finalize this order?"))) return;

    try {
      await finalizeOrderAdmin(token, orderId);
      fetchOrders();
      setMessage(tr("Commande finalisee", "Order finalized"));
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || tr("Erreur lors de la finalisation", "Error while finalizing"));
    }
  };

  const toggleDetails = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const resolveClientPhone = (order) => {
    const directPhone = getClientPhone(order);
    if (directPhone) return String(directPhone);

    const userId = order?.user?.id ?? order?.userId ?? order?.customerId ?? order?.clientId ?? null;
    if (userId !== null && userId !== undefined) {
      const byIdPhone = usersById[String(userId)];
      if (byIdPhone) return String(byIdPhone);
    }

    const email = order?.user?.email || order?.email || order?.userEmail || order?.clientEmail || null;
    if (email) {
      const byEmailPhone = usersByEmail[String(email).toLowerCase()];
      if (byEmailPhone) return String(byEmailPhone);
    }

    const name = order?.user?.name || order?.customerName || order?.clientName || null;
    if (name) {
      const byNamePhone = usersByName[String(name).trim().toLowerCase()];
      if (byNamePhone) return String(byNamePhone);
    }

    return null;
  };

  const isErrorMessage = /erreur|impossible|acces refus|inconnu|error|unable|denied|unknown|failed/i.test(String(message).toLowerCase());
  const isNotificationSupported = notificationPermission !== "unsupported";

  const requestNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (_err) {
      setNotificationPermission("denied");
    }
  };

  const groupedOrders = orders.reduce((acc, order) => {
    const slotKey = order.timeSlot ? formatTime(order.timeSlot.startTime) : "-";
    if (!acc[slotKey]) acc[slotKey] = [];
    acc[slotKey].push(order);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">{tr("Gestion des commandes", "Order management")}</h2>
        <div className="flex items-center gap-2">
          {newOrdersCount > 0 && (
            <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
              +{newOrdersCount} {tr("nouvelle(s)", "new")}
            </span>
          )}
          <p className="text-xs uppercase tracking-wider text-stone-400">
            {orders.length} {tr("commande", "order")}{orders.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-stone-300">
        {isNotificationSupported ? (
          <div className="flex flex-wrap items-center gap-2">
            <span>
              {tr("Flux temps reel", "Realtime stream")}:{" "}
              <strong className={realtimeConnected ? "text-emerald-300" : "text-amber-300"}>
                {realtimeConnected ? tr("connecte", "connected") : tr("reconnexion...", "reconnecting...")}
              </strong>
            </span>
            <span>
              {tr("Notifications navigateur", "Browser notifications")}:{" "}
              <strong className="text-stone-100">{notificationPermission}</strong>
            </span>
            {notificationPermission !== "granted" && (
              <button type="button" onClick={requestNotifications}>
                {tr("Activer", "Enable")}
              </button>
            )}
          </div>
        ) : (
          <p>
            {tr(
              "Notifications non supportees ici. Sur iPhone: installez l'app web sur l'ecran d'accueil pour les notifications web.",
              "Notifications not supported here. On iPhone, install the web app to Home Screen for web notifications."
            )}
          </p>
        )}
      </div>

      {message && (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${
            isErrorMessage
              ? "border-red-400/40 bg-red-500/10 text-red-200"
              : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-2 sm:gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeDate(-1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-stone-100 transition hover:bg-white/10 sm:h-9 sm:w-9"
            aria-label={tr("Jour precedent", "Previous day")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <span className="min-w-[118px] text-center text-xs font-semibold text-stone-100 sm:min-w-[138px] sm:text-sm">
            {selectedDate}
          </span>

          <button
            type="button"
            onClick={() => changeDate(1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-stone-100 transition hover:bg-white/10 sm:h-9 sm:w-9"
            aria-label={tr("Jour suivant", "Next day")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>

        <label htmlFor="statusSelect" className="text-[11px] font-semibold uppercase tracking-wide text-stone-300 sm:ml-auto sm:text-xs">
          {tr("Statut", "Status")}
        </label>
        <select
          id="statusSelect"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="h-8 rounded-lg border border-white/20 bg-charcoal/70 px-2 text-xs text-stone-100 focus:border-saffron focus:outline-none sm:h-9 sm:px-3 sm:text-sm"
        >
          <option value="COMPLETED">{tr("En cours", "In progress")}</option>
          <option value="FINALIZED">{tr("Termine", "Finished")}</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-stone-300">{tr("Chargement des commandes...", "Loading orders...")}</p>
      ) : orders.length === 0 ? (
        <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-stone-300">
          {tr("Aucune commande prevue a cette date.", "No order planned for this date.")}
        </p>
      ) : (
        Object.keys(groupedOrders)
          .sort((a, b) => a.localeCompare(b))
          .map((slot) => (
            <section key={slot} className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-saffron">{tr("Heure", "Time")} {slot}</h3>
                <span className="text-xs text-stone-300">
                  {groupedOrders[slot].length} {tr("commande", "order")}{groupedOrders[slot].length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-2">
                {groupedOrders[slot].map((order) => {
                  const isExpanded = expandedOrders[order.id] ?? true;
                  const orderTotal = formatPrice(order.total ?? order.totalPrice);
                  const statusLabel = order.status === "FINALIZED" ? tr("Terminee", "Finished") : tr("En cours", "In progress");
                  const clientPhone = resolveClientPhone(order);
                  const hasPhone = Boolean(clientPhone);
                  const phoneDisplay = clientPhone || (usersLookupReady ? tr("Numero non renseigne", "No phone provided") : tr("Chargement...", "Loading..."));

                  return (
                    <article key={order.id} className="rounded-xl border border-white/10 bg-charcoal/45 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleDetails(order.id)}
                            className="inline-flex h-8 w-8 items-center justify-center border-none bg-transparent p-0 text-stone-100 transition hover:text-saffron"
                            title={isExpanded ? tr("Masquer details", "Hide details") : tr("Afficher details", "Show details")}
                            aria-label={isExpanded ? tr("Masquer details", "Hide details") : tr("Afficher details", "Show details")}
                          >
                            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.3">
                              <path d="M4 6h16" />
                              <path d="M4 12h16" />
                              <path d="M4 18h16" />
                            </svg>
                          </button>

                          {order.status === "COMPLETED" ? (
                            <button
                              type="button"
                              onClick={() => handleFinalize(order.id)}
                              className="inline-flex h-8 w-8 items-center justify-center border-none bg-transparent p-0 text-emerald-300 transition hover:text-emerald-200"
                              title={tr("Finaliser la commande", "Finalize order")}
                              aria-label={tr("Finaliser la commande", "Finalize order")}
                            >
                              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.7">
                                <path d="m5 13 4 4L19 7" />
                              </svg>
                            </button>
                          ) : (
                            <span
                              className="inline-flex h-8 w-8 items-center justify-center text-emerald-200/55"
                              title={tr("Commande deja finalisee", "Order already finalized")}
                              aria-hidden="true"
                            >
                              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.7">
                                <path d="m5 13 4 4L19 7" />
                              </svg>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(order.id)}
                            className="inline-flex h-8 items-center justify-center rounded-md bg-red-600 px-2.5 text-xs font-semibold text-white transition hover:bg-red-500"
                            title={tr("Supprimer la commande", "Delete order")}
                            aria-label={tr("Supprimer la commande", "Delete order")}
                          >
                            {tr("Supprimer", "Delete")}
                          </button>
                        </div>

                        <div className="min-w-0 text-right">
                          <p className="truncate text-sm font-semibold uppercase tracking-wide text-white">
                            {order.user?.name || tr("Client inconnu", "Unknown client")}
                          </p>
                          <p className={`theme-light-keep-dark mt-0.5 text-[11px] font-medium ${hasPhone ? "text-sky-200" : "text-stone-400"}`}>
                            {phoneDisplay}
                          </p>
                          <div className="mt-0.5 flex items-center justify-end gap-2 text-[11px] text-stone-300">
                            <span>{orderTotal} EUR</span>
                            <span className="text-stone-500">|</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                order.status === "FINALIZED"
                                  ? "bg-emerald-500/20 text-black"
                                  : "bg-amber-500/20 text-black"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2">
                          <div className="space-y-2">
                            {order.items?.length > 0 ? (
                              order.items.map((item, index) => {
                                const added = (item.addedIngredients || []).map((entry) => getIngredientName(entry, tr)).filter(Boolean);
                                const removed = (item.removedIngredients || []).map((entry) => getIngredientName(entry, tr)).filter(Boolean);

                                return (
                                  <div key={item.id ?? `${order.id}-${index}`} className="text-sm text-stone-200">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="inline-flex min-w-[34px] justify-center rounded-md bg-saffron/20 px-1.5 py-0.5 text-xs font-bold text-saffron">
                                        {item.quantity}x
                                      </span>
                                      <span className="text-sm font-semibold text-white sm:text-[15px]">
                                        {getOrderItemName(item, tr)}
                                      </span>
                                    </div>

                                    {(added.length > 0 || removed.length > 0) && (
                                      <div className="ml-9 mt-1 space-y-0.5">
                                        {added.length > 0 && <p className="text-xs text-emerald-300 sm:text-sm">+ {added.join(", ")}</p>}
                                        {removed.length > 0 && <p className="text-xs text-red-300 sm:text-sm">- {removed.join(", ")}</p>}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-stone-400">{tr("Aucun detail de produit.", "No product detail.")}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
