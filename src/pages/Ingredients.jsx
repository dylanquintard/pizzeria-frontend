import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient
} from "../api/admin.api";

export default function Ingredients() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const [ingredients, setIngredients] = useState([]);
  const [message, setMessage] = useState("");
  const [newIngredient, setNewIngredient] = useState({ name: "", price: "" });

  useEffect(() => {
    if (authLoading || !user || !token) return;
    if (user.role !== "ADMIN") {
      setMessage("Accès refusé : administrateur uniquement");
      return;
    }

    async function fetchIngredients() {
      try {
        const data = await getAllIngredients(token);
        setIngredients(data.map(i => ({ ...i, editPrice: false, tempPrice: i.price })));
      } catch (err) {
        setMessage(err.response?.data?.error || "Erreur lors du chargement");
      }
    }

    fetchIngredients();
  }, [authLoading, token, user]);

  const handleCreate = async () => {
    try {
      const ingredient = await createIngredient(token, newIngredient);
      setIngredients([...ingredients, { ...ingredient, editPrice: false, tempPrice: ingredient.price }]);
      setNewIngredient({ name: "", price: "" });
    } catch (err) {
      setMessage(err.response?.data?.error || "Erreur lors de la création");
    }
  };

  const toggleEdit = (id) => {
    setIngredients(ingredients.map(i => i.id === id ? { ...i, editPrice: !i.editPrice } : i));
  };

  const handleSavePrice = async (id, tempPrice) => {
    try {
      const updated = await updateIngredient(token, id, { price: tempPrice });
      setIngredients(ingredients.map(i => i.id === id ? { ...updated, editPrice: false, tempPrice: updated.price } : i));
    } catch (err) {
      setMessage(err.response?.data?.error || "Erreur lors de la mise à jour du prix");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteIngredient(token, id);
      setIngredients(ingredients.filter(i => i.id !== id));
    } catch (err) {
      setMessage(err.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  if (authLoading) return <p>Chargement...</p>;

  return (
    <div>
      <h2>Ingrédients</h2>
      {message && <p>{message}</p>}

      <h3>Ajouter un ingrédient</h3>
      <input
        placeholder="Nom"
        value={newIngredient.name}
        onChange={e => setNewIngredient({...newIngredient, name: e.target.value})}
      />
      <input
        type="number"
        placeholder="Prix"
        value={newIngredient.price}
        onChange={e => setNewIngredient({...newIngredient, price: e.target.value})}
      />
      <button onClick={handleCreate}>Créer</button>

      <h3>Liste des ingrédients</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Nom</th><th>Prix</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map(i => (
            <tr key={i.id}>
              <td>{i.id}</td>
              <td>{i.name}</td>
              <td>
                {i.editPrice ? (
                  <input
                    type="number"
                    value={i.tempPrice}
                    onChange={e => setIngredients(ingredients.map(ix => ix.id === i.id ? { ...ix, tempPrice: e.target.value } : ix))}
                  />
                ) : (
                  i.price
                )}
              </td>
              <td>
                {i.editPrice ? (
                  <button onClick={() => handleSavePrice(i.id, i.tempPrice)}>Sauvegarder</button>
                ) : (
                  <button onClick={() => toggleEdit(i.id)}>Modifier le prix</button>
                )}
                <button onClick={() => handleDelete(i.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}