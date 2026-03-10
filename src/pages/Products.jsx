import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../api/category.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
} from "../api/admin.api";
import { ActionIconButton, DeleteIcon, EditIcon } from "../components/ui/AdminActions";

const emptyNewMenuItem = {
  name: "",
  basePrice: "",
};

function normalizeProductForList(product) {
  return {
    ...product,
    editPrice: false,
    tempPrice: product.basePrice,
  };
}

function formatPrice(value) {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric.toFixed(2);
}

export default function Products() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [newMenuItem, setNewMenuItem] = useState(emptyNewMenuItem);

  const fetchData = useCallback(async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getAllProducts(token),
        getCategories({ kind: "PRODUCT" }),
      ]);
      setMenuItems((Array.isArray(productsData) ? productsData : []).map(normalizeProductForList));
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement du menu", "Error while loading menu"));
    }
  }, [token, tr]);

  useEffect(() => {
    if (authLoading || !user || !token) return;
    if (user.role !== "ADMIN") {
      setMessage(tr("Acces refuse : administrateur uniquement", "Access denied: admin only"));
      return;
    }

    fetchData();
  }, [authLoading, fetchData, token, user, tr]);

  const categoryTabs = useMemo(() => {
    const hasUncategorized = menuItems.some((entry) => !entry.categoryId);
    if (!hasUncategorized) return categories;
    return [
      ...categories,
      { id: "uncategorized", name: tr("Sans categorie", "Uncategorized") },
    ];
  }, [categories, menuItems, tr]);

  useEffect(() => {
    if (categoryTabs.length === 0) {
      setActiveCategoryId("");
      return;
    }

    const exists = categoryTabs.some((entry) => String(entry.id) === String(activeCategoryId));
    if (!exists) {
      setActiveCategoryId(String(categoryTabs[0].id));
    }
  }, [activeCategoryId, categoryTabs]);

  const activeCategory = useMemo(
    () => categoryTabs.find((entry) => String(entry.id) === String(activeCategoryId)) || null,
    [activeCategoryId, categoryTabs]
  );

  const visibleMenuItems = useMemo(() => {
    if (String(activeCategoryId) === "uncategorized") {
      return menuItems.filter((entry) => !entry.categoryId);
    }
    if (!activeCategoryId) return menuItems;
    return menuItems.filter((entry) => String(entry.categoryId ?? "") === String(activeCategoryId));
  }, [activeCategoryId, menuItems]);

  const updateMenuItemState = (id, updater) => {
    setMenuItems((prev) => prev.map((entry) => (entry.id === id ? updater(entry) : entry)));
  };

  const handleCreate = async () => {
    if (!newMenuItem.name.trim()) {
      setMessage(tr("Le nom du produit est obligatoire", "Product name is required"));
      return;
    }
    if (!newMenuItem.basePrice) {
      setMessage(tr("Le prix est obligatoire", "Price is required"));
      return;
    }
    if (!activeCategoryId || String(activeCategoryId) === "uncategorized") {
      setMessage(tr("Selectionnez d'abord une categorie", "Select a category first"));
      return;
    }

    try {
      const payload = {
        name: newMenuItem.name.trim(),
        description: "",
        basePrice: Number(newMenuItem.basePrice),
        categoryId: Number(activeCategoryId),
      };
      const created = await createProduct(token, payload);
      setMenuItems((prev) => [...prev, normalizeProductForList(created)]);
      setNewMenuItem(emptyNewMenuItem);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    }
  };

  const toggleEditPrice = (id) => {
    updateMenuItemState(id, (entry) => ({ ...entry, editPrice: !entry.editPrice }));
  };

  const handleSavePrice = async (entry) => {
    try {
      const updated = await updateProduct(token, entry.id, {
        basePrice: Number(entry.tempPrice),
      });
      updateMenuItemState(entry.id, () => normalizeProductForList(updated));
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour du prix", "Error while updating price"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(tr("Supprimer ce produit du menu ?", "Delete this menu product?"))) return;
    try {
      await deleteProduct(token, id);
      setMenuItems((prev) => prev.filter((entry) => entry.id !== id));
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">{tr("Gestion du menu", "Menu management")}</h2>
      {message && <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-200">{message}</p>}

      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
        <h3 className="text-lg font-semibold text-white">{tr("Ajouter un produit au menu", "Add menu product")}</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categoryTabs.map((category) => {
            const isActive = String(category.id) === String(activeCategoryId);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(String(category.id))}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                  isActive
                    ? "border-saffron bg-saffron text-charcoal"
                    : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <input
            placeholder={tr("Nom", "Name")}
            value={newMenuItem.name}
            onChange={(event) => setNewMenuItem((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            placeholder={tr("Categorie", "Category")}
            value={activeCategory?.name || ""}
            readOnly
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder={tr("Prix", "Price")}
            value={newMenuItem.basePrice}
            onChange={(event) => setNewMenuItem((prev) => ({ ...prev, basePrice: event.target.value }))}
          />
        </div>
        <button type="button" onClick={handleCreate} className="w-full">
          {tr("Ajouter au menu", "Add to menu")}
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">{tr("Menu", "Menu")}</h3>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>{tr("Nom", "Name")}</th>
                <th>{tr("Categorie", "Category")}</th>
                <th>{tr("Prix", "Price")}</th>
                <th>{tr("Actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleMenuItems.length === 0 ? (
                <tr>
                  <td colSpan={5}>{tr("Aucun produit dans cette categorie.", "No product in this category.")}</td>
                </tr>
              ) : (
                visibleMenuItems.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.id}</td>
                    <td>{entry.name}</td>
                    <td>{entry.category?.name || "-"}</td>
                    <td>
                      {entry.editPrice ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.tempPrice}
                          onChange={(event) =>
                            updateMenuItemState(entry.id, (item) => ({
                              ...item,
                              tempPrice: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        `${formatPrice(entry.basePrice)} EUR`
                      )}
                    </td>
                    <td>
                      <div className="flex min-w-[180px] items-center gap-2">
                        {entry.editPrice ? (
                          <button type="button" onClick={() => handleSavePrice(entry)}>
                            {tr("Sauvegarder", "Save")}
                          </button>
                        ) : (
                          <ActionIconButton
                            onClick={() => toggleEditPrice(entry.id)}
                            label={tr("Modifier le prix", "Edit price")}
                          >
                            <EditIcon />
                          </ActionIconButton>
                        )}

                        <Link to={`/admin/editproduct/${entry.id}`}>
                          <button type="button">{tr("Composition", "Composition")}</button>
                        </Link>

                        <ActionIconButton
                          onClick={() => handleDelete(entry.id)}
                          label={tr("Supprimer", "Delete")}
                          variant="danger"
                        >
                          <DeleteIcon />
                        </ActionIconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
