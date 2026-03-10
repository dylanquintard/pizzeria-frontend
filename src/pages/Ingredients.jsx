import { useContext, useEffect, useState } from "react";
import {
  createIngredient,
  deleteIngredient,
  getAllIngredients,
  updateIngredient,
} from "../api/admin.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { ActionIconButton, DeleteIcon, EditIcon } from "../components/ui/AdminActions";

export default function Ingredients() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const [ingredients, setIngredients] = useState([]);
  const [message, setMessage] = useState("");
  const [newIngredient, setNewIngredient] = useState({ name: "", price: "" });

  useEffect(() => {
    if (authLoading || !user || !token) return;
    if (user.role !== "ADMIN") {
      setMessage(tr("Acces refuse : administrateur uniquement", "Access denied: admin only"));
      return;
    }

    async function fetchIngredients() {
      try {
        const data = await getAllIngredients(token);
        const normalized = (Array.isArray(data) ? data : []).map((entry) => ({
          ...entry,
          editPrice: false,
          tempPrice: entry.price,
        }));
        setIngredients(normalized);
      } catch (err) {
        setMessage(err.response?.data?.error || tr("Erreur lors du chargement", "Error while loading"));
      }
    }

    fetchIngredients();
  }, [authLoading, token, user, tr]);

  const handleCreate = async () => {
    try {
      const ingredient = await createIngredient(token, newIngredient);
      setIngredients((prev) => [
        ...prev,
        { ...ingredient, editPrice: false, tempPrice: ingredient.price },
      ]);
      setNewIngredient({ name: "", price: "" });
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    }
  };

  const toggleEdit = (id) => {
    setIngredients((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, editPrice: !entry.editPrice } : entry))
    );
  };

  const handleSavePrice = async (id, tempPrice) => {
    try {
      const updated = await updateIngredient(token, id, { price: tempPrice });
      setIngredients((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...updated, editPrice: false, tempPrice: updated.price } : entry
        )
      );
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour du prix", "Error while updating price"));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteIngredient(token, id);
      setIngredients((prev) => prev.filter((entry) => entry.id !== id));
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;

  return (
    <div>
      <h2>{tr("Ingredients", "Ingredients")}</h2>
      {message && <p>{message}</p>}

      <h3>{tr("Ajouter un ingredient", "Add ingredient")}</h3>
      <input
        placeholder={tr("Nom", "Name")}
        value={newIngredient.name}
        onChange={(event) => setNewIngredient((prev) => ({ ...prev, name: event.target.value }))}
      />
      <input
        type="number"
        placeholder={tr("Prix", "Price")}
        value={newIngredient.price}
        onChange={(event) => setNewIngredient((prev) => ({ ...prev, price: event.target.value }))}
      />
      <button onClick={handleCreate} className="w-full">{tr("Creer", "Create")}</button>

      <h3>{tr("Liste des ingredients", "Ingredients list")}</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{tr("Nom", "Name")}</th>
            <th>{tr("Prix", "Price")}</th>
            <th>{tr("Actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.id}</td>
              <td>{entry.name}</td>
              <td>
                {entry.editPrice ? (
                  <input
                    type="number"
                    value={entry.tempPrice}
                    onChange={(event) =>
                      setIngredients((prev) =>
                        prev.map((item) =>
                          item.id === entry.id ? { ...item, tempPrice: event.target.value } : item
                        )
                      )
                    }
                  />
                ) : (
                  entry.price
                )}
              </td>
              <td>
                <div className="flex items-center gap-2">
                  {entry.editPrice ? (
                    <button onClick={() => handleSavePrice(entry.id, entry.tempPrice)}>
                      {tr("Sauvegarder", "Save")}
                    </button>
                  ) : (
                    <ActionIconButton onClick={() => toggleEdit(entry.id)} label={tr("Modifier le prix", "Edit price")}>
                      <EditIcon />
                    </ActionIconButton>
                  )}
                  <ActionIconButton onClick={() => handleDelete(entry.id)} label={tr("Supprimer", "Delete")} variant="danger">
                    <DeleteIcon />
                  </ActionIconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
