// src/pages/OrderList.jsx
import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { SOCKET_URL } from "../config/env";
import {
  getOrdersAdmin,
  deleteOrderAdmin,
  finalizeOrderAdmin,
} from "../api/admin.api";
import "../styles/OrderList.css";

export default function OrderList() {
  const { user, token, loading: authLoading } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("COMPLETED");

  const [showNotification, setShowNotification] = useState(false);

  const socketRef = useRef(null);

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // ========================= FETCH INITIAL ORDERS =========================
  const fetchOrders = useCallback(async () => {
    if (!token || !user || user.role !== "ADMIN") return;

    setLoading(true);
    try {
      const data = await getOrdersAdmin(token, {
        date: selectedDate,
        status: selectedStatus,
      });
      setOrders(data);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.error ||
          "Erreur lors du chargement des commandes"
      );
    }
    setLoading(false);
  }, [token, user, selectedDate, selectedStatus]);

  useEffect(() => {
    if (authLoading) return;
    fetchOrders();
  }, [authLoading, fetchOrders]);

// ========================= SOCKET (REALTIME) =========================
useEffect(() => {
  if (!user || user.role !== "ADMIN") return;

  socketRef.current = io(SOCKET_URL);

  socketRef.current.emit("joinAdminRoom");

  socketRef.current.on("orderCompleted", (order) => {
    setOrders((prev) => {
      // Evite les doublons
      if (prev.find((o) => o.id === order.id)) return prev;

      // Nouvelle commande -> on ajoute à la fin
      triggerNotification(); // 🔔 Notification son + visuelle
      return [...prev, order];
    });
  });

  return () => {
    socketRef.current.disconnect();
  };
}, [user]);

  // ========================= NOTIFICATION =========================
  const triggerNotification = () => {
    setShowNotification(true);

    const audio = new Audio(
      process.env.PUBLIC_URL + "/ordernotification.mp3"
    );
    audio.play().catch(() => {});
  };

  // ========================= DELETE ORDER =========================
  const handleDelete = async (orderId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette commande ?"))
      return;
    try {
      await deleteOrderAdmin(token, orderId);
      fetchOrders();
      setMessage("Commande supprimée !");
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.error ||
          "Impossible de supprimer la commande"
      );
    }
  };

  // ========================= FINALIZE ORDER =========================
  const handleFinalize = async (orderId) => {
    if (!window.confirm("Voulez-vous vraiment finaliser cette commande ?"))
      return;
    try {
      await finalizeOrderAdmin(token, orderId);
      fetchOrders();
      setMessage("Commande finalisée !");
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.error ||
          "Erreur lors de la finalisation"
      );
    }
  };

  // ========================= GROUP ORDERS BY TIME SLOT =========================
const groupedOrders = orders.reduce((acc, order) => {
  const slotKey = order.timeSlot
    ? formatTime(order.timeSlot.startTime)
    : "—";
  if (!acc[slotKey]) acc[slotKey] = [];
  acc[slotKey].push(order);
  return acc;
}, {});

  return (
    <div className="order-list-page">
      {showNotification && (
        <div className="order-notification">
          🛎️ Nouvelle commande reçue !
        </div>
      )}

      <h2>Gestion des commandes</h2>
      {message && <p className="message">{message}</p>}

      {/* DATE NAVIGATION */}
      <div className="date-navigation">
        <button onClick={() => changeDate(-1)}>&lt;</button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button onClick={() => changeDate(1)}>&gt;</button>
      </div>

      {/* STATUS FILTER */}
      <div className="status-filter" style={{ margin: "1em 0" }}>
        <label htmlFor="statusSelect">Filtrer par statut :</label>
        <select
          id="statusSelect"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ marginLeft: "0.5em" }}
        >
          <option value="COMPLETED">EN COURS</option>
          <option value="FINALIZED">TERMINE</option>
        </select>
      </div>

      {/* ORDERS TABLE */}
      {loading ? (
        <p>Chargement des commandes...</p>
      ) : orders.length === 0 ? (
        <p>Aucune commande prévue à cette date</p>
      ) : (
        Object.keys(groupedOrders)
          .sort((a, b) => a.localeCompare(b))
          .map((slot) => (
          <div key={slot} className="time-slot-group">
            <h3>Heure: {slot}</h3>

            {groupedOrders[slot].map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-summary">
                  <strong>Client:</strong> {order.user?.name || "Client inconnu"}
                  <strong>Total:</strong>{" "}
                  {order.total.toFixed(2)} € |{" "}
                  <strong>Status:</strong>{" "}
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>

                  <button
                    onClick={() => handleDelete(order.id)}
                    className="btn-delete"
                  >
                    Supprimer
                  </button>

                  {order.status === "COMPLETED" && (
                    <button
                      onClick={() => handleFinalize(order.id)}
                      className="btn-finalize"
                      style={{ marginLeft: "0.5em" }}
                    >
                      Finaliser la commande
                    </button>
                  )}
                </div>

                <div className="order-details">
                  {order.items?.map((item) => (
                    <div key={item.id} className="order-item">
                      <strong>{item.pizza.name}</strong> x{" "}
                      {item.quantity}

                      <div
                        className="modifications"
                        style={{ marginLeft: "1em" }}
                      >
                        {item.addedIngredients?.map((e) => (
                          <p
                            key={e.id}
                            style={{
                              fontStyle: "italic",
                              margin: 0,
                            }}
                          >
                            + {e.name}
                          </p>
                        ))}
                        {item.removedIngredients?.map((r) => (
                          <p
                            key={r.id}
                            style={{
                              fontStyle: "italic",
                              margin: 0,
                            }}
                          >
                            - {r.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
