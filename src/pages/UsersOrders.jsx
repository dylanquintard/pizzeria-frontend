import { useCallback, useContext, useEffect, useState } from "react";
import { getUserOrders } from "../api/user.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useRealtimeEvents } from "../hooks/useRealtimeEvents";
import { getOrderNote } from "../utils/orderNote";

function formatDateTime(value, locale) {
  if (!value) return "-";
  return new Date(value).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
}

function getOrderTotal(order) {
  return order?.totalPrice ?? order?.total ?? 0;
}

function getStatusLabel(status, tr) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "PENDING") return tr("En attente", "Pending");
  if (normalized === "COMPLETED") return tr("En cours", "In progress");
  if (normalized === "FINALIZED") return tr("Imprimee", "Printed");
  if (normalized === "CANCELED") return tr("Annulee", "Canceled");
  return normalized || "-";
}

function getStatusClass(status) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "FINALIZED") return "bg-emerald-500/20 text-emerald-200 border-emerald-300/40";
  if (normalized === "CANCELED") return "bg-red-500/20 text-red-200 border-red-300/40";
  if (normalized === "PENDING") return "bg-amber-500/20 text-amber-200 border-amber-300/40";
  return "bg-sky-500/20 text-sky-200 border-sky-300/40";
}

function formatSlotLabel(timeSlot, locale, tr) {
  if (!timeSlot?.startTime) return tr("Sans creneau", "No timeslot");
  return new Date(timeSlot.startTime).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserOrders() {
  const { token, user } = useContext(AuthContext);
  const { tr, locale } = useLanguage();
  const userId = user?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const data = await getUserOrders(token);
      const normalized = Array.isArray(data) ? data : [];
      setOrders(normalized);

      const initialExpandedState = normalized.reduce((acc, order) => {
        acc[String(order.id)] = false;
        return acc;
      }, {});
      setExpandedOrders(initialExpandedState);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || tr("Erreur lors du chargement des commandes", "Error loading orders"));
    } finally {
      setLoading(false);
    }
  }, [token, userId, tr]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRealtimeEvent = useCallback(
    (eventName) => {
      if (eventName === "orders:user-updated") {
        fetchOrders();
      }
    },
    [fetchOrders]
  );

  useRealtimeEvents({
    enabled: Boolean(token && userId),
    onEvent: handleRealtimeEvent,
    onConnectionChange: setRealtimeConnected,
  });

  const toggleOrderDetails = (orderId) => {
    const key = String(orderId);
    setExpandedOrders((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="section-shell space-y-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-saffron">{tr("Espace client", "Client area")}</p>
          <h1 className="font-display text-4xl uppercase tracking-wide text-white">{tr("Mes commandes", "My orders")}</h1>
        </div>
        <p className="text-xs uppercase tracking-wider text-stone-400">
          {orders.length} {tr("commande", "order")}{orders.length > 1 ? "s" : ""}
        </p>
      </div>

      <p className="text-xs text-stone-300">
        {tr("Mises a jour temps reel", "Realtime updates")}:{" "}
        <strong className={realtimeConnected ? "text-emerald-300" : "text-amber-300"}>
          {realtimeConnected ? tr("connecte", "connected") : tr("reconnexion...", "reconnecting...")}
        </strong>
      </p>

      {loading && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-stone-300">
          {tr("Chargement des commandes...", "Loading orders...")}
        </p>
      )}

      {!loading && error && (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-stone-300">
          {tr("Aucune commande trouvee.", "No orders found.")}
        </p>
      )}

      {!loading &&
        !error &&
        orders.map((order) => {
          const isExpanded = Boolean(expandedOrders[String(order.id)]);
          const slotLabel = formatSlotLabel(order.timeSlot, locale, tr);
          const locationName = order.timeSlot?.location?.name || null;
          const pickupDateTime = order.timeSlot?.startTime || order.createdAt;
          const orderNote = getOrderNote(order);

          return (
            <article key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">{tr("Retrait prevu", "Scheduled pickup")}</p>
                  <p className="truncate text-sm font-semibold text-white">{formatDateTime(pickupDateTime, locale)}</p>
                </div>

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusClass(
                    order.status
                  )}`}
                >
                  {getStatusLabel(order.status, tr)}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">{tr("Total", "Total")}</p>
                    <p className="text-sm font-bold text-saffron">{formatPrice(getOrderTotal(order))} EUR</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleOrderDetails(order.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-charcoal/70 text-stone-100 transition hover:bg-charcoal"
                    title={isExpanded ? tr("Masquer le detail", "Hide details") : tr("Afficher le detail", "Show details")}
                    aria-label={isExpanded ? tr("Masquer le detail", "Hide details") : tr("Afficher le detail", "Show details")}
                    aria-expanded={isExpanded}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M4 6h16" />
                      <path d="M4 12h16" />
                      <path d="M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-300">
                    <span>
                      {tr("Creneau", "Timeslot")}: <span className="font-semibold text-stone-100">{slotLabel}</span>
                    </span>
                    {locationName && (
                      <span>
                        {tr("Emplacement", "Location")}: <span className="font-semibold text-stone-100">{locationName}</span>
                      </span>
                    )}
                  </div>

                  {orderNote && (
                    <div className="mb-3 rounded-lg border border-white/10 bg-charcoal/50 px-3 py-2 text-xs text-stone-200">
                      <strong className="text-stone-100">{tr("Note", "Note")}:</strong> {orderNote}
                    </div>
                  )}

                  <div className="space-y-2">
                    {(order.items || []).length === 0 && <p className="text-xs text-stone-400">{tr("Aucun article.", "No items.")}</p>}

                    {(order.items || []).map((item) => (
                      <div key={item.id} className="rounded-lg border border-white/10 bg-charcoal/60 p-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">
                            {item.quantity}x {item.product?.name || tr("Produit", "Product")}
                          </p>
                          <p className="text-xs font-semibold text-saffron">{formatPrice(item.unitPrice)} EUR / {tr("unite", "unit")}</p>
                        </div>

                        {item.product?.category?.name && (
                          <p className="mt-1 text-[11px] text-stone-300">
                            {tr("Categorie", "Category")}: {item.product.category.name}
                          </p>
                        )}

                        {(item.addedIngredients?.length > 0 || item.removedIngredients?.length > 0) && (
                          <div className="mt-1 space-y-0.5 text-[11px]">
                            {item.addedIngredients?.length > 0 && (
                              <p className="text-emerald-300">
                                + {item.addedIngredients.map((entry) => entry.name).join(", ")}
                              </p>
                            )}
                            {item.removedIngredients?.length > 0 && (
                              <p className="text-red-300">
                                - {item.removedIngredients.map((entry) => entry.name).join(", ")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
    </div>
  );
}
