import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addIngredientToPizza,
  getAllIngredients,
  getPizzaById,
  removeIngredientFromPizza,
} from "../api/admin.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function EditPizza() {
  const { id } = useParams();
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();

  const [pizza, setPizza] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "ADMIN") return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [pizzaData, ingredientsData] = await Promise.all([
          getPizzaById(token, id),
          getAllIngredients(token),
        ]);
        setPizza(pizzaData);
        setIngredients(Array.isArray(ingredientsData) ? ingredientsData : []);
      } catch (err) {
        setMessage(err.response?.data?.error || tr("Erreur lors du chargement", "Error while loading"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, token, user, id, tr]);

  const refreshPizza = async () => {
    const pizzaData = await getPizzaById(token, id);
    setPizza(pizzaData);
  };

  const handleAddIngredient = async (ingredientId) => {
    try {
      await addIngredientToPizza(token, id, ingredientId);
      await refreshPizza();
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de l'ajout", "Error while adding"));
    }
  };

  const handleRemoveIngredient = async (ingredientId) => {
    try {
      await removeIngredientFromPizza(token, id, ingredientId);
      await refreshPizza();
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  if (authLoading || loading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!user || user.role !== "ADMIN") return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;
  if (!pizza) return <p>{tr("Pizza introuvable", "Pizza not found")}</p>;

  const linkedIngredients = (pizza.ingredients || []).map((entry) => entry.ingredient).filter(Boolean);
  const linkedIds = linkedIngredients.map((entry) => entry.id);
  const availableIngredients = ingredients.filter((entry) => !linkedIds.includes(entry.id));

  return (
    <div>
      <h2>{tr("Gestion des ingredients", "Ingredient management")} - {pizza.name}</h2>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <hr />

      <h3>{tr("Ingredients lies", "Linked ingredients")}</h3>
      {linkedIngredients.length === 0 && <p>{tr("Aucun ingredient lie", "No linked ingredient")}</p>}

      {linkedIngredients.map((ingredient) => (
        <div key={ingredient.id}>
          {ingredient.name}
          <button onClick={() => handleRemoveIngredient(ingredient.id)}>
            {tr("Retirer", "Remove")}
          </button>
        </div>
      ))}

      <hr />

      <h3>{tr("Ajouter un ingredient", "Add ingredient")}</h3>
      {availableIngredients.length === 0 && (
        <p>{tr("Tous les ingredients sont deja lies", "All ingredients are already linked")}</p>
      )}

      {availableIngredients.map((ingredient) => (
        <div key={ingredient.id}>
          {ingredient.name}
          <button onClick={() => handleAddIngredient(ingredient.id)}>
            {tr("Ajouter", "Add")}
          </button>
        </div>
      ))}
    </div>
  );
}
