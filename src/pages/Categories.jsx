import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  activateCategory,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../api/category.api";
import { ActionIconButton, DeleteIcon, StatusToggle } from "../components/ui/AdminActions";

const emptyCategoryForm = {
  name: "",
  description: "",
  sortOrder: 0,
  active: true,
};

function normalizeCategoryPayload(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    sortOrder: Number(form.sortOrder || 0),
    active: Boolean(form.active),
  };
}

export default function Categories() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState(emptyCategoryForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement des categories", "Error while loading categories"));
    }
  }, [tr]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.role !== "ADMIN") return;
    fetchCategories();
  }, [authLoading, token, user, fetchCategories]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newCategory.name.trim()) {
      setMessage(tr("Le nom de categorie est obligatoire", "Category name is required"));
      return;
    }

    try {
      setLoading(true);
      await createCategory(token, normalizeCategoryPayload(newCategory));
      setNewCategory(emptyCategoryForm);
      setMessage("");
      fetchCategories();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (category) => {
    try {
      setLoading(true);
      await updateCategory(token, category.id, normalizeCategoryPayload(category));
      setMessage("");
      fetchCategories();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await activateCategory(token, category.id, !category.active);
      fetchCategories();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du changement de statut", "Error while changing status"));
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm(tr("Supprimer cette categorie ?", "Delete this category?"))) return;

    try {
      await deleteCategory(token, categoryId);
      fetchCategories();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;

  return (
    <div>
      <h2>{tr("Gestion des categories", "Category management")}</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleCreate}>
        <h3>{tr("Ajouter une categorie", "Add category")}</h3>
        <input
          placeholder={tr("Nom", "Name")}
          value={newCategory.name}
          onChange={(event) =>
            setNewCategory((prev) => ({ ...prev, name: event.target.value }))
          }
        />
        <input
          placeholder={tr("Description", "Description")}
          value={newCategory.description}
          onChange={(event) =>
            setNewCategory((prev) => ({ ...prev, description: event.target.value }))
          }
        />
        <input
          type="number"
          min="0"
          placeholder={tr("Ordre", "Order")}
          value={newCategory.sortOrder}
          onChange={(event) =>
            setNewCategory((prev) => ({ ...prev, sortOrder: event.target.value }))
          }
        />
        <label style={{ marginLeft: "8px" }}>
          <input
            type="checkbox"
            checked={newCategory.active}
            onChange={(event) =>
            setNewCategory((prev) => ({ ...prev, active: event.target.checked }))
          }
          />
          {tr("Active", "Active")}
        </label>
        <button type="submit" disabled={loading}>
          {tr("Creer", "Create")}
        </button>
      </form>

      <h3>{tr("Liste des categories", "Categories list")}</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{tr("Nom", "Name")}</th>
            <th>{tr("Description", "Description")}</th>
            <th>{tr("Ordre", "Order")}</th>
            <th>{tr("Actif", "Active")}</th>
            <th>{tr("Actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 && (
            <tr>
              <td colSpan="6">{tr("Aucune categorie", "No category")}</td>
            </tr>
          )}
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{category.id}</td>
              <td>
                <input
                  value={category.name}
                  onChange={(event) =>
                    setCategories((prev) =>
                      prev.map((entry) =>
                        entry.id === category.id
                          ? { ...entry, name: event.target.value }
                          : entry
                      )
                    )
                  }
                />
              </td>
              <td>
                <input
                  value={category.description || ""}
                  onChange={(event) =>
                    setCategories((prev) =>
                      prev.map((entry) =>
                        entry.id === category.id
                          ? { ...entry, description: event.target.value }
                          : entry
                      )
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={category.sortOrder}
                  onChange={(event) =>
                    setCategories((prev) =>
                      prev.map((entry) =>
                        entry.id === category.id
                          ? { ...entry, sortOrder: event.target.value }
                          : entry
                      )
                    )
                  }
                />
              </td>
              <td>{category.active ? tr("Oui", "Yes") : tr("Non", "No")}</td>
              <td>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleUpdate(category)} disabled={loading}>
                    {tr("Sauvegarder", "Save")}
                  </button>
                  <StatusToggle
                    checked={category.active}
                    onChange={() => handleToggleActive(category)}
                    labelOn={tr("Desactiver", "Disable")}
                    labelOff={tr("Activer", "Enable")}
                  />
                  <ActionIconButton onClick={() => handleDelete(category.id)} label={tr("Supprimer", "Delete")} variant="danger">
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
