import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addIngredientToProduct,
  getAllIngredients,
  getProductById,
  removeIngredientFromProduct,
  updateProduct,
} from "../api/admin.api";
import { getCategories } from "../api/category.api";
import { ActionIconButton, CheckIcon, DeleteIcon, EditIcon } from "../components/ui/AdminActions";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

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

function formatPrice(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
}

export default function EditProduct() {
  const { id } = useParams();
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();

  const [product, setProduct] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientCategories, setIngredientCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const fetchData = useCallback(async () => {
    const [productData, ingredientsData, categoriesData] = await Promise.all([
      getProductById(token, id),
      getAllIngredients(token),
      getCategories({ kind: "INGREDIENT" }),
    ]);

    setProduct(productData);
    setIngredients(sortByName(ingredientsData));
    setIngredientCategories(sortCategories(categoriesData));
    setTempName(productData?.name || "");
    setTempPrice(productData?.basePrice ?? "");
  }, [id, token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "ADMIN") return;

    setLoading(true);
    fetchData()
      .then(() => setMessage(""))
      .catch((err) => {
        setMessage(err.response?.data?.error || tr("Erreur lors du chargement", "Error while loading"));
      })
      .finally(() => setLoading(false));
  }, [authLoading, user, fetchData, tr]);

  const linkedIngredients = useMemo(
    () => (product?.ingredients || []).map((entry) => entry.ingredient).filter(Boolean),
    [product]
  );

  const linkedIngredientIds = useMemo(
    () => new Set(linkedIngredients.map((entry) => entry.id)),
    [linkedIngredients]
  );

  const availableIngredients = useMemo(
    () => ingredients.filter((entry) => !linkedIngredientIds.has(entry.id)),
    [ingredients, linkedIngredientIds]
  );

  const groupedAvailableByCategory = useMemo(() => {
    const groups = [];

    ingredientCategories.forEach((category) => {
      const rows = availableIngredients.filter(
        (ingredient) => Number(ingredient.categoryId) === Number(category.id)
      );
      groups.push({ key: String(category.id), name: category.name, rows });
    });

    const uncategorized = availableIngredients.filter((ingredient) => !ingredient.categoryId);
    groups.push({
      key: "uncategorized",
      name: tr("Sans categorie", "Uncategorized"),
      rows: uncategorized,
    });

    return groups;
  }, [availableIngredients, ingredientCategories, tr]);

  const searchResults = useMemo(() => {
    const query = String(searchTerm || "").trim().toLowerCase();
    if (!searchSubmitted || !query) return [];
    return availableIngredients.filter((ingredient) =>
      String(ingredient.name || "").toLowerCase().includes(query)
    );
  }, [availableIngredients, searchSubmitted, searchTerm]);

  const refreshProductOnly = async () => {
    const refreshed = await getProductById(token, id);
    setProduct(refreshed);
  };

  const saveProductName = async () => {
    const nextName = String(tempName || "").trim();
    if (!nextName) {
      setMessage(tr("Le nom du produit est obligatoire", "Product name is required"));
      return;
    }

    try {
      const updated = await updateProduct(token, id, { name: nextName });
      setProduct((prev) => ({ ...prev, name: updated.name }));
      setTempName(updated.name || "");
      setIsEditingName(false);
      setMessage(tr("Nom du produit mis a jour", "Product name updated"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating"));
    }
  };

  const saveProductPrice = async () => {
    if (tempPrice === "" || Number.isNaN(Number(tempPrice))) {
      setMessage(tr("Prix invalide", "Invalid price"));
      return;
    }

    try {
      const updated = await updateProduct(token, id, { basePrice: Number(tempPrice) });
      setProduct((prev) => ({ ...prev, basePrice: updated.basePrice }));
      setTempPrice(updated.basePrice ?? "");
      setIsEditingPrice(false);
      setMessage(tr("Prix du produit mis a jour", "Product price updated"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating"));
    }
  };

  const handleAddIngredient = async (ingredientId) => {
    try {
      await addIngredientToProduct(token, id, ingredientId);
      await refreshProductOnly();
      setMessage(tr("Ingredient lie au plat", "Ingredient linked to dish"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de l'ajout", "Error while adding"));
    }
  };

  const handleRemoveIngredient = async (ingredientId) => {
    try {
      await removeIngredientFromProduct(token, id, ingredientId);
      await refreshProductOnly();
      setMessage(tr("Liaison ingredient supprimee", "Ingredient link removed"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  const handleSearch = () => {
    setSearchSubmitted(true);
  };

  if (authLoading || loading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!user || user.role !== "ADMIN") {
    return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;
  }
  if (!product) return <p>{tr("Produit introuvable", "Product not found")}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {tr("Element 3 - Edition produit", "Step 3 - Product edition")}
        </h2>
        <p className="mt-1 text-sm text-stone-300">
          {tr("Modifier le nom, le prix et les ingredients lies au plat.", "Edit name, price and linked ingredients.")}
        </p>
      </div>

      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-100">{message}</p>
      )}

      <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-charcoal/35 p-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-saffron">{tr("ProductName", "Product name")}</p>
            {isEditingName ? (
              <input value={tempName} onChange={(event) => setTempName(event.target.value)} />
            ) : (
              <p className="text-lg font-semibold text-white">{product.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <ActionIconButton onClick={saveProductName} label={tr("Valider", "Validate")} variant="success">
                <CheckIcon />
              </ActionIconButton>
            ) : (
              <ActionIconButton onClick={() => setIsEditingName(true)} label={tr("Modifier", "Edit")}>
                <EditIcon />
              </ActionIconButton>
            )}
            {isEditingName && (
              <button type="button" onClick={() => { setIsEditingName(false); setTempName(product.name || ""); }}>
                {tr("Annuler", "Cancel")}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-charcoal/35 p-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-saffron">{tr("Prix", "Price")}</p>
            {isEditingPrice ? (
              <input
                type="number"
                min="0"
                step="0.01"
                value={tempPrice}
                onChange={(event) => setTempPrice(event.target.value)}
              />
            ) : (
              <p className="text-lg font-semibold text-white">{formatPrice(product.basePrice)} EUR</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditingPrice ? (
              <ActionIconButton onClick={saveProductPrice} label={tr("Valider", "Validate")} variant="success">
                <CheckIcon />
              </ActionIconButton>
            ) : (
              <ActionIconButton onClick={() => setIsEditingPrice(true)} label={tr("Modifier", "Edit")}>
                <EditIcon />
              </ActionIconButton>
            )}
            {isEditingPrice && (
              <button type="button" onClick={() => { setIsEditingPrice(false); setTempPrice(product.basePrice ?? ""); }}>
                {tr("Annuler", "Cancel")}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-lg font-semibold text-white">{tr("Ingredients lies", "Linked ingredients")}</h3>
        {linkedIngredients.length === 0 ? (
          <p className="text-sm text-stone-400">{tr("Aucun ingredient lie", "No linked ingredient")}</p>
        ) : (
          <div className="space-y-2">
            {linkedIngredients.map((ingredient) => (
              <div key={ingredient.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-charcoal/35 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-white">{ingredient.name}</p>
                  <p className="text-xs text-stone-300">{formatPrice(ingredient.price)} EUR</p>
                </div>
                <ActionIconButton
                  onClick={() => handleRemoveIngredient(ingredient.id)}
                  label={tr("Supprimer la liaison", "Remove link")}
                  variant="danger"
                >
                  <DeleteIcon />
                </ActionIconButton>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-lg font-semibold text-white">{tr("Lier un ingredient au plat", "Link ingredient to dish")}</h3>

        <div className="rounded-xl border border-white/10 bg-charcoal/35 p-3">
          <p className="mb-2 text-sm font-semibold text-white">{tr("Recherche ingredient", "Search ingredient")}</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSearchSubmitted(false);
              }}
              placeholder={tr("Nom ingredient", "Ingredient name")}
            />
            <button type="button" onClick={handleSearch}>{tr("Rechercher", "Search")}</button>
          </div>

          {searchSubmitted && String(searchTerm || "").trim() !== "" && (
            <div className="mt-3">
              {searchResults.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-stone-200">
                  <p>{tr("Ingredients non disponibles ? Ajouter un ingredient.", "Ingredients not available? Add one.")}</p>
                  <Link to="/admin/menu" className="mt-2 inline-flex">
                    <button type="button">{tr("Aller a la partie ingredients", "Go to ingredients section")}</button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{ingredient.name}</p>
                        <p className="text-xs text-stone-300">{formatPrice(ingredient.price)} EUR</p>
                      </div>
                      <button type="button" onClick={() => handleAddIngredient(ingredient.id)}>
                        {tr("Lier au plat", "Link to dish")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">{tr("Ingredients disponibles (par categories)", "Available ingredients (by categories)")}</p>
          {groupedAvailableByCategory.map((group) => (
            <div key={group.key} className="rounded-xl border border-white/10 bg-charcoal/35 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-saffron">{group.name}</p>
              {group.rows.length === 0 ? (
                <p className="text-xs text-stone-400">{tr("Aucun ingredient", "No ingredient")}</p>
              ) : (
                <div className="space-y-2">
                  {group.rows.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{ingredient.name}</p>
                        <p className="text-xs text-stone-300">{formatPrice(ingredient.price)} EUR</p>
                      </div>
                      <button type="button" onClick={() => handleAddIngredient(ingredient.id)}>
                        {tr("Lier au plat", "Link to dish")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
