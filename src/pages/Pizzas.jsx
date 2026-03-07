import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../api/category.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  createPizza,
  deletePizza,
  getAllPizzas,
  updatePizza,
} from "../api/admin.api";

const initialNewPizza = {
  name: "",
  description: "",
  basePrice: "",
  categoryId: "",
};

function normalizePizzaForList(pizza) {
  return {
    ...pizza,
    editPrice: false,
    tempPrice: pizza.basePrice,
    tempCategoryId: pizza.categoryId ?? "",
  };
}

function toPizzaPayload(data) {
  return {
    name: data.name?.trim(),
    description: data.description?.trim() || "",
    basePrice: Number(data.basePrice),
    categoryId: data.categoryId === "" ? null : Number(data.categoryId),
  };
}

function formatPrice(value) {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric.toFixed(2);
}

export default function Pizzas() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const [pizzas, setPizzas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [newPizza, setNewPizza] = useState(initialNewPizza);

  const fetchData = useCallback(async () => {
    try {
      const [pizzasData, categoriesData] = await Promise.all([
        getAllPizzas(token),
        getCategories(),
      ]);
      setPizzas(pizzasData.map(normalizePizzaForList));
      setCategories(categoriesData);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement des pizzas", "Error while loading pizzas"));
    }
  }, [token, tr]);

  useEffect(() => {
    if (authLoading || !user || !token) return;
    if (user.role !== "ADMIN") {
      setMessage(tr("Acces refuse : administrateur uniquement", "Access denied: admin only"));
      return;
    }

    fetchData();
  }, [authLoading, token, user, fetchData, tr]);

  const updatePizzaState = (id, updater) => {
    setPizzas((prev) => prev.map((pizza) => (pizza.id === id ? updater(pizza) : pizza)));
  };

  const handleCreate = async () => {
    if (!newPizza.name.trim()) {
      setMessage(tr("Le nom de la pizza est obligatoire", "Pizza name is required"));
      return;
    }

    if (newPizza.basePrice === "") {
      setMessage(tr("Le prix est obligatoire", "Price is required"));
      return;
    }

    try {
      const payload = toPizzaPayload(newPizza);
      const pizza = await createPizza(token, payload);
      setPizzas((prev) => [...prev, normalizePizzaForList(pizza)]);
      setNewPizza(initialNewPizza);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    }
  };

  const toggleEdit = (id) => {
    updatePizzaState(id, (pizza) => ({ ...pizza, editPrice: !pizza.editPrice }));
  };

  const handleSavePrice = async (pizza) => {
    try {
      const updated = await updatePizza(token, pizza.id, {
        basePrice: Number(pizza.tempPrice),
      });
      updatePizzaState(pizza.id, () => normalizePizzaForList(updated));
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour du prix", "Error while updating price"));
    }
  };

  const handleSaveCategory = async (pizza) => {
    try {
      const updated = await updatePizza(token, pizza.id, {
        categoryId: pizza.tempCategoryId === "" ? null : Number(pizza.tempCategoryId),
      });
      updatePizzaState(pizza.id, () => normalizePizzaForList(updated));
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour de la categorie", "Error while updating category"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(tr("Supprimer cette pizza ?", "Delete this pizza?"))) return;

    try {
      await deletePizza(token, id);
      setPizzas((prev) => prev.filter((pizza) => pizza.id !== id));
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;

  return (
    <div>
      <h2>{tr("Pizzas", "Pizzas")}</h2>
      {message && <p>{message}</p>}

      <h3>{tr("Ajouter une pizza", "Add pizza")}</h3>
      <input
        placeholder={tr("Nom", "Name")}
        value={newPizza.name}
        onChange={(event) => setNewPizza((prev) => ({ ...prev, name: event.target.value }))}
      />
      <input
        placeholder={tr("Description", "Description")}
        value={newPizza.description}
        onChange={(event) =>
          setNewPizza((prev) => ({ ...prev, description: event.target.value }))
        }
      />
      <input
        type="number"
        placeholder={tr("Prix", "Price")}
        value={newPizza.basePrice}
        onChange={(event) =>
          setNewPizza((prev) => ({ ...prev, basePrice: event.target.value }))
        }
      />
      <select
        value={newPizza.categoryId}
        onChange={(event) =>
          setNewPizza((prev) => ({ ...prev, categoryId: event.target.value }))
        }
      >
        <option value="">{tr("Sans categorie", "No category")}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <button onClick={handleCreate}>{tr("Creer", "Create")}</button>

      <h3>{tr("Liste des pizzas", "Pizzas list")}</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{tr("Nom", "Name")}</th>
            <th>{tr("Description", "Description")}</th>
            <th>{tr("Categorie", "Category")}</th>
            <th>{tr("Prix", "Price")}</th>
            <th>{tr("Actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {pizzas.map((pizza) => (
            <tr key={pizza.id}>
              <td>{pizza.id}</td>
              <td>{pizza.name}</td>
              <td>{pizza.description}</td>
              <td>
                <select
                  value={pizza.tempCategoryId}
                  onChange={(event) =>
                    updatePizzaState(pizza.id, (entry) => ({
                      ...entry,
                      tempCategoryId: event.target.value,
                    }))
                  }
                >
                  <option value="">{tr("Sans categorie", "No category")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button onClick={() => handleSaveCategory(pizza)}>{tr("Sauvegarder categorie", "Save category")}</button>
              </td>
              <td>
                {pizza.editPrice ? (
                  <input
                    type="number"
                    value={pizza.tempPrice}
                    onChange={(event) =>
                      updatePizzaState(pizza.id, (entry) => ({
                        ...entry,
                        tempPrice: event.target.value,
                      }))
                    }
                  />
                ) : (
                  `${formatPrice(pizza.basePrice)} EUR`
                )}
              </td>
              <td>
                {pizza.editPrice ? (
                  <button onClick={() => handleSavePrice(pizza)}>{tr("Sauvegarder prix", "Save price")}</button>
                ) : (
                  <button onClick={() => toggleEdit(pizza.id)}>{tr("Modifier le prix", "Edit price")}</button>
                )}
                <Link to={`/admin/editpizza/${pizza.id}`}>
                  <button>{tr("Composition", "Composition")}</button>
                </Link>
                <button onClick={() => handleDelete(pizza.id)}>{tr("Supprimer", "Delete")}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
