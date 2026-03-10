import { useCallback, useContext, useEffect, useMemo, useState } from "react";
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

const CATEGORY_KIND_TABS = [
  { id: "PRODUCT", labelFr: "Categories produits", labelEn: "Product categories" },
  { id: "INGREDIENT", labelFr: "Categories ingredients", labelEn: "Ingredient categories" },
];

const emptyCategoryForm = {
  name: "",
  description: "",
  sortOrder: 0,
  active: true,
};

function normalizeCategoryPayload(form, kind) {
  const name = String(form?.name ?? "").trim();
  const description = typeof form?.description === "string" ? form.description.trim() : "";

  return {
    name,
    description: description || null,
    sortOrder: Number(form?.sortOrder || 0),
    active: Boolean(form?.active),
    kind: form?.kind || kind,
  };
}

export default function Categories() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const [activeKind, setActiveKind] = useState("PRODUCT");
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState(emptyCategoryForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const tabLabel = useMemo(
    () =>
      CATEGORY_KIND_TABS.find((entry) => entry.id === activeKind) || CATEGORY_KIND_TABS[0],
    [activeKind]
  );

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories({ kind: activeKind });
      setCategories(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement des categories", "Error while loading categories"));
    }
  }, [activeKind, tr]);

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
      await createCategory(token, normalizeCategoryPayload(newCategory, activeKind));
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
      await updateCategory(token, category.id, normalizeCategoryPayload(category, activeKind));
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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">{tr("Gestion des categories", "Category management")}</h2>
      {message && <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-200">{message}</p>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_KIND_TABS.map((tab) => {
          const isActive = tab.id === activeKind;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveKind(tab.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                isActive
                  ? "border-saffron bg-saffron text-charcoal"
                  : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
              }`}
            >
              {tr(tab.labelFr, tab.labelEn)}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
        <h3 className="text-lg font-semibold text-white">
          {tr("Ajouter une categorie", "Add category")} - {tr(tabLabel.labelFr, tabLabel.labelEn)}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
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
        </div>
        <button type="submit" disabled={loading} className="mt-2 w-full">
          {tr("Creer", "Create")}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">
          {tr("Liste des categories", "Categories list")} - {tr(tabLabel.labelFr, tabLabel.labelEn)}
        </h3>

        <div className="overflow-x-auto">
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
                      <button type="button" onClick={() => handleUpdate(category)} disabled={loading}>
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
      </div>
    </div>
  );
}
