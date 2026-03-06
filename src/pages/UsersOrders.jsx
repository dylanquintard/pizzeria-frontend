import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getUserOrders } from "../api/user.api";

export default function UserOrders() {
  const { token, user } = useContext(AuthContext);
  const userId = user?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !userId) return;
    setLoading(true);

    const fetchOrders = async () => {
      try {
        const data = await getUserOrders(token);
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Erreur lors du chargement des commandes");
      }
      setLoading(false);
    };

    fetchOrders();
  }, [token, userId]);

  if (loading) return <p>Chargement des commandes...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="user-orders-page">
      <h2>Mes commandes</h2>
      {!orders.length && <p>Aucune commande trouvée</p>}
      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <p><strong>Commande du : {new Date(order.createdAt).toLocaleDateString("fr-FR")}</strong></p>
          <p>Statut : {order.status}</p>
          <p>Prix total : {Number(order.totalPrice).toFixed(2)} €</p>
        </div>
      ))}
    </div>
  );
}