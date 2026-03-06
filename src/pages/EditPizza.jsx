import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getPizzaById,
  getAllIngredients,
  addIngredientToPizza,
  removeIngredientFromPizza,
} from "../api/admin.api";

function EditPizza() {
  const { id } = useParams();
  const { token, user, loading: authLoading } = useContext(AuthContext);

  const [pizza, setPizza] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // === Chargement des données avec useEffect ===
  useEffect(() => {
    if (authLoading) return; // si auth pas prêt
    if (!user || user.role !== "ADMIN") return; // guard admin

    const fetchData = async () => {
      try {
        setLoading(true);
        const pizzaData = await getPizzaById(token, id);
        const ingredientsData = await getAllIngredients(token);

        setPizza(pizzaData);
        setIngredients(ingredientsData);
      } catch (err) {
        setMessage(err.response?.data?.error || "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, token, user, id]);

  const handleAddIngredient = async (ingredientId) => {
    try {
      await addIngredientToPizza(token, id, ingredientId);
      // recharger les données
      const pizzaData = await getPizzaById(token, id);
      setPizza(pizzaData);
    } catch (err) {
      setMessage(err.response?.data?.error || "Erreur lors de l'ajout");
    }
  };

  const handleRemoveIngredient = async (ingredientId) => {
    try {
      await removeIngredientFromPizza(token, id, ingredientId);
      const pizzaData = await getPizzaById(token, id);
      setPizza(pizzaData);
    } catch (err) {
      setMessage(err.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  // === Affichage des guards ===
  if (authLoading || loading) return <p>Chargement...</p>;
  if (!user || user.role !== "ADMIN")
    return <p>Accès refusé : administrateur uniquement</p>;
  if (!pizza) return <p>Pizza introuvable</p>;

  const linkedIngredients = pizza.ingredients.map((i) => i.ingredient);
  const linkedIds = linkedIngredients.map((i) => i.id);

  const availableIngredients = ingredients.filter(
    (i) => !linkedIds.includes(i.id)
  );

  return (
    <div>
      <h2>Gestion des ingrédients — {pizza.name}</h2>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <hr />

      <h3>Ingrédients liés</h3>
      {linkedIngredients.length === 0 && <p>Aucun ingrédient lié</p>}

      {linkedIngredients.map((ingredient) => (
        <div key={ingredient.id}>
          {ingredient.name}
          <button onClick={() => handleRemoveIngredient(ingredient.id)}>
            Retirer
          </button>
        </div>
      ))}

      <hr />

      <h3>Ajouter un ingrédient</h3>
      {availableIngredients.length === 0 && (
        <p>Tous les ingrédients sont déjà liés</p>
      )}

      {availableIngredients.map((ingredient) => (
        <div key={ingredient.id}>
          {ingredient.name}
          <button onClick={() => handleAddIngredient(ingredient.id)}>
            Ajouter
          </button>
        </div>
      ))}
    </div>
  );
}

export default EditPizza;