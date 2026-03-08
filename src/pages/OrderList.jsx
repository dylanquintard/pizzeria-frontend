import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getOrdersAdmin,
  getAllUsers,
  deleteOrderAdmin,
  finalizeOrderAdmin,
} from "../api/admin.api";

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

function getOrderItemCategory(item) {
  const product = getOrderItemProduct(item);
  return product?.category?.name || item?.category?.name || product?.categoryName || item?.categoryName || null;
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
      setOrders(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement des commandes", "Error while loading orders"));
    } finally {
      setLoading(false);
    }
  }, [token, user, selectedDate, selectedStatus, tr]);

  useEffect(() => {
    if (authLoading) return;
    fetchOrders();
  }, [authLoading, fetchOrders]);

  useEffect(() => {
    if (!token || !user || user.role !== "ADMIN") return undefined;
    const timer = window.setInterval(() => {
      fetchOrders();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [token, user, fetchOrders]);

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

  const groupedOrders = orders.reduce((acc, order) => {
    const slotKey = order.timeSlot ? formatTime(order.timeSlot.startTime) : "-";
    if (!acc[slotKey]) acc[slotKey] = [];
    acc[slotKey].push(order);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">{tr("Gestion des commandes", "Order management")}</h2>
        <p className="text-xs uppercase tracking-wider text-stone-400">
          {orders.length} {tr("commande", "order")}{orders.length > 1 ? "s" : ""}
        </p>
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

      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
        <button
          type="button"
          onClick={() => changeDate(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-stone-100 transition hover:bg-white/10"
          aria-label={tr("Jour precedent", "Previous day")}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="h-9 rounded-lg border border-white/20 bg-charcoal/70 px-3 text-sm text-stone-100 focus:border-saffron focus:outline-none"
        />

        <button
          type="button"
          onClick={() => changeDate(1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-stone-100 transition hover:bg-white/10"
          aria-label={tr("Jour suivant", "Next day")}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>

        <label htmlFor="statusSelect" className="ml-auto text-xs font-semibold uppercase tracking-wide text-stone-300">
          {tr("Statut", "Status")}
        </label>
        <select
          id="statusSelect"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="h-9 rounded-lg border border-white/20 bg-charcoal/70 px-3 text-sm text-stone-100 focus:border-saffron focus:outline-none"
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
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300/60 !bg-slate-900/85 !p-0 !text-stone-100 shadow-sm transition hover:!bg-slate-800"
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
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-300/70 !bg-emerald-900/35 !p-0 !text-emerald-200 shadow-sm transition hover:!bg-emerald-800/45"
                              title={tr("Finaliser la commande", "Finalize order")}
                              aria-label={tr("Finaliser la commande", "Finalize order")}
                            >
                              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.7">
                                <path d="m5 13 4 4L19 7" />
                              </svg>
                            </button>
                          ) : (
                            <span
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-300/35 bg-emerald-900/20 text-emerald-200/70"
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
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-300/80 !bg-red-950/45 !p-0 !text-red-200 shadow-sm transition hover:!bg-red-900/55"
                            title={tr("Supprimer la commande", "Delete order")}
                            aria-label={tr("Supprimer la commande", "Delete order")}
                          >
                            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4">
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="min-w-0 text-right">
                          <p className="truncate text-sm font-semibold uppercase tracking-wide text-white">
                            {order.user?.name || tr("Client inconnu", "Unknown client")}
                          </p>
                          <p className={`mt-0.5 text-[11px] font-medium ${hasPhone ? "text-sky-200" : "text-stone-400"}`}>
                            {phoneDisplay}
                          </p>
                          <div className="mt-0.5 flex items-center justify-end gap-2 text-[11px] text-stone-300">
                            <span>{orderTotal} EUR</span>
                            <span className="text-stone-500">|</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                order.status === "FINALIZED"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-amber-500/20 text-amber-200"
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
                                const category = getOrderItemCategory(item);
                                const added = (item.addedIngredients || []).map((entry) => getIngredientName(entry, tr)).filter(Boolean);
                                const removed = (item.removedIngredients || []).map((entry) => getIngredientName(entry, tr)).filter(Boolean);

                                return (
                                  <div key={item.id ?? `${order.id}-${index}`} className="text-xs text-stone-200">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="inline-flex min-w-[34px] justify-center rounded-md bg-saffron/20 px-1.5 py-0.5 text-[11px] font-bold text-saffron">
                                        {item.quantity}x
                                      </span>
                                      <span className="font-semibold text-white">{getOrderItemName(item, tr)}</span>
                                      {category && (
                                        <span className="rounded-md border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone-300">
                                          {category}
                                        </span>
                                      )}
                                    </div>

                                    {(added.length > 0 || removed.length > 0) && (
                                      <div className="ml-9 mt-1 space-y-0.5">
                                        {added.length > 0 && <p className="text-[11px] text-emerald-300">+ {added.join(", ")}</p>}
                                        {removed.length > 0 && <p className="text-[11px] text-red-300">- {removed.join(", ")}</p>}
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
