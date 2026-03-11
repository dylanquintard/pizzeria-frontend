import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  activateLocation,
  createLocation,
  deleteLocation,
  getLocations,
  updateLocation,
} from "../api/location.api";
import { ActionIconButton, DeleteIcon, EditIcon, StatusToggle } from "../components/ui/AdminActions";

const COUNTRY_OPTIONS = ["France", "Belgique", "Luxembourg", "Allemagne"];

const emptyLocationForm = {
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  country: "France",
  active: true,
};

function normalizeLocationPayload(form) {
  const city = form.city.trim();

  return {
    name: city,
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || null,
    postalCode: form.postalCode.trim(),
    city,
    country: form.country.trim() || "France",
    active: Boolean(form.active),
  };
}

function formatLocation(location) {
  const parts = [
    location.addressLine1,
    location.addressLine2,
    `${location.postalCode || ""} ${location.city || ""}`.trim(),
    location.country,
  ].filter(Boolean);
  return parts.join(", ");
}

export default function Locations() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();

  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState(emptyLocationForm);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLocation, setEditLocation] = useState(emptyLocationForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement des emplacements", "Error while loading locations"));
    }
  }, [tr]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.role !== "ADMIN") return;
    fetchLocations();
  }, [authLoading, token, user, fetchLocations]);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (
      !newLocation.addressLine1.trim() ||
      !newLocation.postalCode.trim() ||
      !newLocation.city.trim()
    ) {
      setMessage(
        tr(
          "Adresse, code postal et ville sont obligatoires",
          "Address, postal code and city are required"
        )
      );
      return;
    }

    try {
      setLoading(true);
      await createLocation(token, normalizeLocationPayload(newLocation));
      setNewLocation(emptyLocationForm);
      setShowLocationForm(false);
      setMessage("");
      await fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (location) => {
    setEditingId(location.id);
    setEditLocation({
      ...emptyLocationForm,
      ...location,
      addressLine2: location.addressLine2 ?? "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditLocation(emptyLocationForm);
  };

  const handleUpdate = async () => {
    if (
      !editLocation.addressLine1.trim() ||
      !editLocation.postalCode.trim() ||
      !editLocation.city.trim()
    ) {
      setMessage(
        tr(
          "Adresse, code postal et ville sont obligatoires",
          "Address, postal code and city are required"
        )
      );
      return;
    }

    try {
      setLoading(true);
      await updateLocation(token, editingId, normalizeLocationPayload(editLocation));
      setMessage("");
      cancelEditing();
      await fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (location) => {
    try {
      await activateLocation(token, location.id, !location.active);
      await fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du changement de statut", "Error while changing status"));
    }
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm(tr("Supprimer cet emplacement ?", "Delete this location?"))) return;

    try {
      await deleteLocation(token, locationId);
      await fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{tr("Adresses", "Addresses")}</h2>
      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-100">{message}</p>
      )}

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-saffron">
            {tr("Gestion emplacement", "Address management")}
          </h3>
          <button
            type="button"
            onClick={() => setShowLocationForm((prev) => !prev)}
            className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200"
          >
            {showLocationForm
              ? tr("Fermer le formulaire", "Close form")
              : tr("Ajouter un emplacement", "Add address")}
          </button>
        </div>

        {showLocationForm && (
          <form onSubmit={handleCreate} className="grid gap-2 md:grid-cols-2">
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Adresse", "Address")}</span>
              <input
                value={newLocation.addressLine1}
                onChange={(event) =>
                  setNewLocation((prev) => ({ ...prev, addressLine1: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Complement d'adresse", "Address line 2")}</span>
              <input
                value={newLocation.addressLine2}
                onChange={(event) =>
                  setNewLocation((prev) => ({ ...prev, addressLine2: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Code postal", "Postal code")}</span>
              <input
                value={newLocation.postalCode}
                onChange={(event) =>
                  setNewLocation((prev) => ({ ...prev, postalCode: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Ville", "City")}</span>
              <input
                value={newLocation.city}
                onChange={(event) =>
                  setNewLocation((prev) => ({ ...prev, city: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300 md:col-span-2">
              <span>{tr("Pays", "Country")}</span>
              <select
                value={newLocation.country}
                onChange={(event) =>
                  setNewLocation((prev) => ({ ...prev, country: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={loading} className="rounded-lg border border-saffron/40 bg-saffron/15 px-3 py-2 text-xs font-semibold text-saffron md:col-span-2">
              {tr("Creer", "Create")}
            </button>
          </form>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-stone-400">
                <th className="pb-2">{tr("Nom", "Name")}</th>
                <th className="pb-2">{tr("Adresse", "Address")}</th>
                <th className="pb-2">{tr("Actif", "Active")}</th>
                <th className="pb-2">{tr("Actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-2 text-stone-400">{tr("Aucun emplacement", "No address")}</td>
                </tr>
              )}
              {locations.map((location) => (
                <tr key={location.id} className="border-t border-white/10">
                  <td className="py-2 text-stone-100">{location.name}</td>
                  <td className="py-2 text-stone-300">{formatLocation(location)}</td>
                  <td className="py-2 text-stone-100">{location.active ? tr("Oui", "Yes") : tr("Non", "No")}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <ActionIconButton onClick={() => startEditing(location)} label={tr("Modifier", "Edit")}>
                        <EditIcon />
                      </ActionIconButton>
                      <StatusToggle
                        checked={location.active}
                        onChange={() => handleToggleActive(location)}
                        labelOn={tr("Desactiver", "Disable")}
                        labelOff={tr("Activer", "Enable")}
                      />
                      <ActionIconButton onClick={() => handleDelete(location.id)} label={tr("Supprimer", "Delete")} variant="danger">
                        <DeleteIcon />
                      </ActionIconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingId && (
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-saffron">
            {tr("Modifier l'emplacement", "Edit address")}
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Adresse", "Address")}</span>
              <input
                value={editLocation.addressLine1}
                onChange={(event) =>
                  setEditLocation((prev) => ({ ...prev, addressLine1: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Complement d'adresse", "Address line 2")}</span>
              <input
                value={editLocation.addressLine2}
                onChange={(event) =>
                  setEditLocation((prev) => ({ ...prev, addressLine2: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Code postal", "Postal code")}</span>
              <input
                value={editLocation.postalCode}
                onChange={(event) =>
                  setEditLocation((prev) => ({ ...prev, postalCode: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Ville", "City")}</span>
              <input
                value={editLocation.city}
                onChange={(event) =>
                  setEditLocation((prev) => ({ ...prev, city: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Pays", "Country")}</span>
              <select
                value={editLocation.country}
                onChange={(event) =>
                  setEditLocation((prev) => ({ ...prev, country: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-stone-100">
              <input
                type="checkbox"
                checked={editLocation.active}
                onChange={(event) =>
                  setEditLocation((prev) => ({ ...prev, active: event.target.checked }))
                }
              />
              {tr("Actif", "Active")}
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading}
              className="rounded-lg border border-saffron/40 bg-saffron/15 px-3 py-2 text-xs font-semibold text-saffron"
            >
              {tr("Sauvegarder", "Save")}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-stone-200"
            >
              {tr("Annuler", "Cancel")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
