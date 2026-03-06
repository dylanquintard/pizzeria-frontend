import { useState, useEffect } from "react";
import { getAllPizzasClient } from "../api/user.api";
import "../styles/Menu.css";

export default function Menu() {
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await getAllPizzasClient();
        setPizzas(data);
      } catch (err) {
        setMessage("Erreur lors du chargement du menu");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (message) return <p>{message}</p>;
  if (pizzas.length === 0) return <p>Aucune pizza disponible</p>;

  return (
    <div className="menu-page">
      <h2>Menu des Pizzas</h2>
      <div className="menu-container">
        {pizzas.map((pizza) => (
          <div key={pizza.id} className="pizza-card">
            <div className="pizza-header">
              <h3>{pizza.name}</h3>
              <span>{pizza.basePrice}€</span>
            </div>
            <p>{pizza.description}</p>
            {pizza.ingredients.length > 0 && (
              <p className="ingredients">
                {pizza.ingredients.map((pi) => pi.ingredient.name).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}