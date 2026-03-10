import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createIngredient,
  createProduct,
  deleteIngredient,
  deleteProduct,
  getAllIngredients,
  getAllProducts,
  updateIngredient,
} from "../api/admin.api";
import {
  activateCategory,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../api/category.api";
import {
  ActionIconButton,
  CheckIcon,
  DeleteIcon,
  EditIcon,
  StatusToggle,
} from "../components/ui/AdminActions";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const KIND = {
  MENU: "PRODUCT",
  INGREDIENT: "INGREDIENT",
};

function toMoney(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

function sortCategories(list) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) => {
    const orderDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    if (orderDiff !== 0) return orderDiff;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function sortByName(list) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""))
  );
}

function parseSortOrder(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

function normalizeIngredient(ingredient) {
  return {
    ...ingredient,
    isEditing: false,
    tempName: ingredient.name || "",
    tempPrice: ingredient.price ?? "",
    tempIsExtra: Boolean(ingredient.isExtra),
  };
}

function CategoryTable({ title, categories, token, tr, onRefresh, onError }) {
  const [busyId, setBusyId] = useState(null);

  const patchLocal = (id, patch) => {
    onRefresh((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    );
  };

  const saveRow = async (category) => {
    setBusyId(category.id);
    try {
      await updateCategory(token, category.id, {
        name: String(category.name || "").trim(),
        description: category.description || null,
        sortOrder: parseSortOrder(category.sortOrder),
        active: Boolean(category.active),
        kind: category.kind,
      });
      await onRefresh();
    } catch (err) {
      onError?.(
        err?.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating")
      );
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (category) => {
    try {
      await activateCategory(token, category.id, !category.active);
      await onRefresh();
    } catch (err) {
      onError?.(
        err?.response?.data?.error ||
          tr("Erreur lors du changement de statut", "Error while changing status")
      );
    }
  };

  const removeCategory = async (category) => {
    if (!window.confirm(tr("Supprimer cette categorie ?", "Delete this category?"))) return;
    try {
      await deleteCategory(token, category.id);
      await onRefresh();
    } catch (err) {
      onError?.(
        err?.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting")
      );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-charcoal/40 p-3">
      <p className="mb-2 text-sm font-semibold text-white">{title}</p>
      <table>
        <thead>
          <tr>
            <th>{tr("Nom", "Name")}</th>
            <th>{tr("Ordre", "Order")}</th>
            <th>{tr("Actif / Inactif", "Active / Inactive")}</th>
            <th>{tr("Actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={4}>{tr("Aucune categorie", "No category")}</td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr key={category.id}>
                <td>
                  <input
                    value={category.name || ""}
                    onChange={(event) => patchLocal(category.id, { name: event.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={category.sortOrder ?? 0}
                    onChange={(event) => patchLocal(category.id, { sortOrder: event.target.value })}
                    className="w-24"
                  />
                </td>
                <td>
                  <StatusToggle
                    checked={Boolean(category.active)}
                    onChange={() => toggleActive(category)}
                    labelOn={tr("Desactiver", "Disable")}
                    labelOff={tr("Activer", "Enable")}
                    disabled={busyId === category.id}
                  />
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveRow(category)}
                      disabled={busyId === category.id}
                    >
                      {tr("Sauvegarder", "Save")}
                    </button>
                    <ActionIconButton
                      onClick={() => removeCategory(category)}
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
  );
}

export default function Products() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const navigate = useNavigate();

  const [menuCategories, setMenuCategories] = useState([]);
  const [ingredientCategories, setIngredientCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  const [activePanel, setActivePanel] = useState("");
  const [selectedMenuCategoryId, setSelectedMenuCategoryId] = useState("");
  const [selectedIngredientCategoryId, setSelectedIngredientCategoryId] = useState("");

  const [newMenuCategoryName, setNewMenuCategoryName] = useState("");
  const [newIngredientCategoryName, setNewIngredientCategoryName] = useState("");

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientPrice, setNewIngredientPrice] = useState("");
  const [newIngredientIsExtra, setNewIngredientIsExtra] = useState(true);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const [menuCats, ingCats, productsData, ingredientsData] = await Promise.all([
      getCategories({ kind: KIND.MENU }),
      getCategories({ kind: KIND.INGREDIENT }),
      getAllProducts(token),
      getAllIngredients(token),
    ]);

    const nextMenuCats = sortCategories(menuCats);
    const nextIngCats = sortCategories(ingCats);

    setMenuCategories(nextMenuCats);
    setIngredientCategories(nextIngCats);
    setProducts(sortByName(productsData));
    setIngredients(sortByName(ingredientsData).map(normalizeIngredient));

    setSelectedMenuCategoryId((prev) => {
      const exists = nextMenuCats.some((entry) => String(entry.id) === String(prev));
      return exists ? prev : "";
    });
    setSelectedIngredientCategoryId((prev) => {
      const exists = nextIngCats.some((entry) => String(entry.id) === String(prev));
      return exists ? prev : "";
    });
  }, [token]);

  useEffect(() => {
    if (authLoading || !token || user?.role !== "ADMIN") return;

    setLoading(true);
    fetchAll()
      .then(() => setMessage(""))
      .catch((err) => {
        setMessage(
          err.response?.data?.error ||
            tr("Erreur lors du chargement des donnees du menu", "Error while loading menu data")
        );
      })
      .finally(() => setLoading(false));
  }, [authLoading, token, user, fetchAll, tr]);

  const refreshAfterAction = async (successMessage = "") => {
    await fetchAll();
    setMessage(successMessage);
  };

  const createCategoryByKind = async (kind) => {
    const name =
      kind === KIND.MENU
        ? String(newMenuCategoryName || "").trim()
        : String(newIngredientCategoryName || "").trim();

    if (!name) {
      setMessage(tr("Le nom de categorie est obligatoire", "Category name is required"));
      return;
    }

    try {
      await createCategory(token, {
        name,
        description: null,
        sortOrder: 0,
        active: true,
        kind,
      });
      if (kind === KIND.MENU) setNewMenuCategoryName("");
      if (kind === KIND.INGREDIENT) setNewIngredientCategoryName("");
      await refreshAfterAction(tr("Categorie creee avec succes", "Category created successfully"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    }
  };

  const createMenuProduct = async () => {
    const name = String(newProductName || "").trim();
    if (!name) {
      setMessage(tr("Le nom du plat est obligatoire", "Dish name is required"));
      return;
    }
    if (!newProductPrice) {
      setMessage(tr("Le prix est obligatoire", "Price is required"));
      return;
    }
    if (!selectedMenuCategoryId) {
      setMessage(tr("Selectionnez une categorie menu", "Select a menu category"));
      return;
    }

    try {
      const created = await createProduct(token, {
        name,
        description: "",
        basePrice: Number(newProductPrice),
        categoryId: Number(selectedMenuCategoryId),
      });
      setNewProductName("");
      setNewProductPrice("");
      setMessage(tr("Plat ajoute au menu", "Dish added to menu"));
      navigate(`/admin/editproduct/${created.id}`);
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    }
  };

  const removeMenuProduct = async (productId) => {
    if (!window.confirm(tr("Supprimer ce plat ?", "Delete this dish?"))) return;
    try {
      await deleteProduct(token, productId);
      await refreshAfterAction(tr("Plat supprime", "Dish deleted"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  const createMenuIngredient = async () => {
    const name = String(newIngredientName || "").trim();
    if (!name) {
      setMessage(tr("Le nom de l'ingredient est obligatoire", "Ingredient name is required"));
      return;
    }
    if (!newIngredientPrice) {
      setMessage(tr("Le prix est obligatoire", "Price is required"));
      return;
    }
    if (!selectedIngredientCategoryId) {
      setMessage(
        tr("Selectionnez une categorie Ingredients & Extras", "Select an Ingredients & Extras category")
      );
      return;
    }

    try {
      await createIngredient(token, {
        name,
        price: Number(newIngredientPrice),
        isExtra: Boolean(newIngredientIsExtra),
        categoryId: Number(selectedIngredientCategoryId),
      });
      setNewIngredientName("");
      setNewIngredientPrice("");
      setNewIngredientIsExtra(true);
      await refreshAfterAction(tr("Ingredient ajoute avec succes", "Ingredient added successfully"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    }
  };

  const patchIngredient = (ingredientId, patch) => {
    setIngredients((prev) =>
      prev.map((entry) => (entry.id === ingredientId ? { ...entry, ...patch } : entry))
    );
  };

  const toggleIngredientEdit = (ingredient) => {
    patchIngredient(ingredient.id, {
      isEditing: !ingredient.isEditing,
      tempName: ingredient.name || "",
      tempPrice: ingredient.price ?? "",
      tempIsExtra: Boolean(ingredient.isExtra),
    });
  };

  const saveIngredient = async (ingredient) => {
    try {
      const updated = await updateIngredient(token, ingredient.id, {
        name: String(ingredient.tempName || "").trim(),
        price: Number(ingredient.tempPrice),
        isExtra: Boolean(ingredient.tempIsExtra),
      });
      setIngredients((prev) =>
        prev.map((entry) => (entry.id === ingredient.id ? normalizeIngredient(updated) : entry))
      );
      setMessage(tr("Ingredient mis a jour", "Ingredient updated"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating"));
    }
  };

  const removeIngredient = async (ingredientId) => {
    if (!window.confirm(tr("Supprimer cet ingredient ?", "Delete this ingredient?"))) return;
    try {
      await deleteIngredient(token, ingredientId);
      await refreshAfterAction(tr("Ingredient supprime", "Ingredient deleted"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  const productsByCategory = useMemo(() => {
    const grouped = {};
    for (const category of menuCategories) {
      grouped[String(category.id)] = [];
    }
    grouped.uncategorized = [];

    for (const product of products) {
      const key = product.categoryId ? String(product.categoryId) : "uncategorized";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(product);
    }

    Object.keys(grouped).forEach((key) => {
      grouped[key] = sortByName(grouped[key]);
    });

    return grouped;
  }, [menuCategories, products]);

  const ingredientsByCategory = useMemo(() => {
    const grouped = {};
    for (const category of ingredientCategories) {
      grouped[String(category.id)] = [];
    }
    grouped.uncategorized = [];

    for (const ingredient of ingredients) {
      const key = ingredient.categoryId ? String(ingredient.categoryId) : "uncategorized";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ingredient);
    }

    Object.keys(grouped).forEach((key) => {
      grouped[key] = sortByName(grouped[key]);
    });

    return grouped;
  }, [ingredientCategories, ingredients]);

  const hasSelectedMenuCategory = Boolean(selectedMenuCategoryId);
  const hasSelectedIngredientCategory = Boolean(selectedIngredientCategoryId);
  const hasSelectedCategory =
    activePanel === KIND.MENU
      ? hasSelectedMenuCategory
      : activePanel === KIND.INGREDIENT
        ? hasSelectedIngredientCategory
        : false;

  const menuCategoryListForUi = [...menuCategories, { id: "uncategorized", name: tr("Sans categorie", "Uncategorized") }];
  const ingredientCategoryListForUi = [
    ...ingredientCategories,
    { id: "uncategorized", name: tr("Sans categorie", "Uncategorized") },
  ];

  if (authLoading || loading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") {
    return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{tr("Gestion du menu", "Menu management")}</h2>
        <p className="mt-1 text-sm text-stone-300">
          {tr(
            "Bienvenue dans la page de gestion du menu, choisir une modification :",
            "Welcome to menu management, choose what to change:"
          )}
        </p>
      </div>

      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-100">
          {message}
        </p>
      )}

      <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-lg font-semibold text-white">{tr("Element 1 - Categories", "Step 1 - Categories")}</h3>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActivePanel((prev) => (prev === KIND.MENU ? "" : KIND.MENU))}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
              activePanel === KIND.MENU
                ? "border-saffron bg-saffron text-charcoal"
                : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
            }`}
          >
            {tr("Ajouter un plat au menu", "Add a dish to menu")}
          </button>
          <button
            type="button"
            onClick={() => setActivePanel((prev) => (prev === KIND.INGREDIENT ? "" : KIND.INGREDIENT))}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
              activePanel === KIND.INGREDIENT
                ? "border-saffron bg-saffron text-charcoal"
                : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
            }`}
          >
            {tr("Ajouter un ingredient", "Add ingredient")}
          </button>
        </div>

        {activePanel === KIND.MENU && (
          <div>
            <p className="mb-2 text-sm font-semibold text-stone-100">
              {tr("Listing categories menu :", "Menu category listing:")}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {menuCategories.map((category) => {
                const isSelected = String(selectedMenuCategoryId) === String(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setSelectedMenuCategoryId((prev) =>
                        String(prev) === String(category.id) ? "" : String(category.id)
                      )
                    }
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                      isSelected
                        ? "border-saffron bg-saffron text-charcoal"
                        : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activePanel === KIND.INGREDIENT && (
          <div>
            <p className="mb-2 text-sm font-semibold text-stone-100">
              {tr(
                "Listing categories Ingredients & Extras :",
                "Ingredients & Extras category listing:"
              )}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ingredientCategories.map((category) => {
                const isSelected = String(selectedIngredientCategoryId) === String(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setSelectedIngredientCategoryId((prev) =>
                        String(prev) === String(category.id) ? "" : String(category.id)
                      )
                    }
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                      isSelected
                        ? "border-saffron bg-saffron text-charcoal"
                        : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activePanel === KIND.MENU && !hasSelectedMenuCategory && (
          <>
            <div className="rounded-xl border border-white/10 bg-charcoal/40 p-3">
              <p className="mb-2 text-sm font-semibold text-white">
                {tr("Categorie non disponible ? Ajouter une categorie :", "Missing category? Create one:")}
              </p>
              <div className="flex gap-2">
                <input
                  value={newMenuCategoryName}
                  onChange={(event) => setNewMenuCategoryName(event.target.value)}
                  placeholder={tr("Nom categorie menu", "Menu category name")}
                />
                <button type="button" onClick={() => createCategoryByKind(KIND.MENU)}>
                  {tr("Creer", "Create")}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">
                {tr("Liste categories plats", "Dish category list")}
              </p>
              <CategoryTable
                title={tr("Liste categorie menu", "Menu category list")}
                categories={menuCategories}
                token={token}
                tr={tr}
                onRefresh={async (updater) => {
                  if (typeof updater === "function") {
                    setMenuCategories((prev) => updater(prev));
                    return;
                  }
                  await refreshAfterAction();
                }}
                onError={setMessage}
              />
            </div>
          </>
        )}

        {activePanel === KIND.INGREDIENT && !hasSelectedIngredientCategory && (
          <>
            <div className="rounded-xl border border-white/10 bg-charcoal/40 p-3">
              <p className="mb-2 text-sm font-semibold text-white">
                {tr(
                  "Categorie Ingredients & Extras non disponible ? Ajouter une categorie :",
                  "Missing Ingredients & Extras category? Create one:"
                )}
              </p>
              <div className="flex gap-2">
                <input
                  value={newIngredientCategoryName}
                  onChange={(event) => setNewIngredientCategoryName(event.target.value)}
                  placeholder={tr("Nom categorie ingredients", "Ingredient category name")}
                />
                <button type="button" onClick={() => createCategoryByKind(KIND.INGREDIENT)}>
                  {tr("Creer", "Create")}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">
                {tr("Liste categories ingredients", "Ingredient category list")}
              </p>
              <CategoryTable
                title={tr("Liste categorie ingredients", "Ingredients category list")}
                categories={ingredientCategories}
                token={token}
                tr={tr}
                onRefresh={async (updater) => {
                  if (typeof updater === "function") {
                    setIngredientCategories((prev) => updater(prev));
                    return;
                  }
                  await refreshAfterAction();
                }}
                onError={setMessage}
              />
            </div>
          </>
        )}

      </section>

      {hasSelectedCategory && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-lg font-semibold text-white">
            {activePanel === KIND.MENU
              ? tr("Element 2 - Gestion du contenu", "Step 2 - Content management")
              : tr("Gestion ingredients", "Ingredient management")}
          </h3>

          {activePanel === KIND.MENU ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-charcoal/40 p-3">
                <p className="mb-2 text-sm font-semibold text-white">{tr("Ajouter un plat au menu", "Add a dish to menu")}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    placeholder={tr("Nom du plat", "Dish name")}
                    value={newProductName}
                    onChange={(event) => setNewProductName(event.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={tr("Prix", "Price")}
                    value={newProductPrice}
                    onChange={(event) => setNewProductPrice(event.target.value)}
                  />
                  <button type="button" onClick={createMenuProduct}>{tr("Ajouter au menu", "Add to menu")}</button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">{tr("Listing complet du menu", "Full menu listing")}</p>
                {menuCategoryListForUi.map((category) => {
                  const rows = productsByCategory[String(category.id)] || [];
                  return (
                    <div key={category.id} className="rounded-xl border border-white/10 bg-charcoal/35 p-3">
                      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-saffron">{category.name}</p>
                      {rows.length === 0 ? (
                        <p className="text-xs text-stone-400">{tr("Aucun produit", "No product")}</p>
                      ) : (
                        <div className="space-y-2">
                          {rows.map((product) => (
                            <div key={product.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{product.name}</p>
                                <p className="text-xs text-stone-300">{toMoney(product.basePrice)} EUR</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link to={`/admin/editproduct/${product.id}`}>
                                  <button type="button">{tr("Modifier", "Edit")}</button>
                                </Link>
                                <ActionIconButton onClick={() => removeMenuProduct(product.id)} label={tr("Supprimer", "Delete")} variant="danger">
                                  <DeleteIcon />
                                </ActionIconButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-charcoal/40 p-3">
                <p className="mb-2 text-sm font-semibold text-white">{tr("Ajouter un ingredient", "Add ingredient")}</p>
                <div className="grid gap-2 sm:grid-cols-4">
                  <input
                    placeholder={tr("Nom ingredient", "Ingredient name")}
                    value={newIngredientName}
                    onChange={(event) => setNewIngredientName(event.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={tr("Prix", "Price")}
                    value={newIngredientPrice}
                    onChange={(event) => setNewIngredientPrice(event.target.value)}
                  />
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-stone-100">
                    <input
                      type="checkbox"
                      checked={newIngredientIsExtra}
                      onChange={(event) => setNewIngredientIsExtra(event.target.checked)}
                    />
                    <span>{tr("Supplement", "Extra")}</span>
                  </label>
                  <button type="button" onClick={createMenuIngredient}>{tr("Ajouter un ingredient", "Add ingredient")}</button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">{tr("Listing complet ingredients", "Full ingredients listing")}</p>
                {ingredientCategoryListForUi.map((category) => {
                  const rows = ingredientsByCategory[String(category.id)] || [];
                  return (
                    <div key={category.id} className="rounded-xl border border-white/10 bg-charcoal/35 p-3">
                      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-saffron">{category.name}</p>
                      {rows.length === 0 ? (
                        <p className="text-xs text-stone-400">{tr("Aucun ingredient", "No ingredient")}</p>
                      ) : (
                        <div className="space-y-2">
                          {rows.map((ingredient) => (
                            <div key={ingredient.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                              <div className="min-w-0">
                                {ingredient.isEditing ? (
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    <input
                                      value={ingredient.tempName}
                                      onChange={(event) => patchIngredient(ingredient.id, { tempName: event.target.value })}
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={ingredient.tempPrice}
                                      onChange={(event) => patchIngredient(ingredient.id, { tempPrice: event.target.value })}
                                    />
                                    <label className="flex items-center gap-2 text-xs text-stone-200">
                                      <input
                                        type="checkbox"
                                        checked={ingredient.tempIsExtra}
                                        onChange={(event) => patchIngredient(ingredient.id, { tempIsExtra: event.target.checked })}
                                      />
                                      <span>{tr("Supplement", "Extra")}</span>
                                    </label>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="truncate text-sm font-semibold text-white">{ingredient.name}</p>
                                    <p className="text-xs text-stone-300">
                                      {toMoney(ingredient.price)} EUR - {ingredient.isExtra ? tr("Supplement", "Extra") : tr("Standard", "Standard")}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {ingredient.isEditing ? (
                                  <ActionIconButton onClick={() => saveIngredient(ingredient)} label={tr("Valider", "Validate")} variant="success">
                                    <CheckIcon />
                                  </ActionIconButton>
                                ) : (
                                  <ActionIconButton onClick={() => toggleIngredientEdit(ingredient)} label={tr("Modifier", "Edit")}>
                                    <EditIcon />
                                  </ActionIconButton>
                                )}

                                {ingredient.isEditing && (
                                  <button type="button" onClick={() => toggleIngredientEdit(ingredient)}>
                                    {tr("Annuler", "Cancel")}
                                  </button>
                                )}

                                <ActionIconButton onClick={() => removeIngredient(ingredient.id)} label={tr("Supprimer", "Delete")} variant="danger">
                                  <DeleteIcon />
                                </ActionIconButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

    </div>
  );
}
