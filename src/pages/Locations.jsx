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

const emptyLocationForm = {
  name: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  country: "France",
  latitude: "",
  longitude: "",
  notes: "",
  active: true,
};

function normalizeLocationPayload(form) {
  const toNullableNumber = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  return {
    name: form.name.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || null,
    postalCode: form.postalCode.trim(),
    city: form.city.trim(),
    country: form.country.trim() || "France",
    latitude: toNullableNumber(form.latitude),
    longitude: toNullableNumber(form.longitude),
    notes: form.notes.trim() || null,
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
      !newLocation.name.trim() ||
      !newLocation.addressLine1.trim() ||
      !newLocation.postalCode.trim() ||
      !newLocation.city.trim()
    ) {
      setMessage(tr("Nom, adresse, code postal et ville sont obligatoires", "Name, address, postal code and city are required"));
      return;
    }

    try {
      setLoading(true);
      await createLocation(token, normalizeLocationPayload(newLocation));
      setNewLocation(emptyLocationForm);
      setMessage("");
      fetchLocations();
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
      latitude: location.latitude ?? "",
      longitude: location.longitude ?? "",
      addressLine2: location.addressLine2 ?? "",
      notes: location.notes ?? "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditLocation(emptyLocationForm);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateLocation(token, editingId, normalizeLocationPayload(editLocation));
      setMessage("");
      cancelEditing();
      fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (location) => {
    try {
      await activateLocation(token, location.id, !location.active);
      fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du changement de statut", "Error while changing status"));
    }
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm(tr("Supprimer cet emplacement ?", "Delete this location?"))) return;

    try {
      await deleteLocation(token, locationId);
      fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;

  return (
    <div>
      <h2>{tr("Gestion des emplacements", "Location management")}</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleCreate}>
        <h3>{tr("Ajouter un emplacement", "Add location")}</h3>
        <input
          placeholder={tr("Nom", "Name")}
          value={newLocation.name}
          onChange={(event) =>
            setNewLocation((prev) => ({ ...prev, name: event.target.value }))
          }
        />
        <input
          placeholder={tr("Adresse", "Address")}
          value={newLocation.addressLine1}
          onChange={(event) =>
            setNewLocation((prev) => ({ ...prev, addressLine1: event.target.value }))
          }
        />
        <input
          placeholder={tr("Complement d'adresse", "Address line 2")}
          value={newLocation.addressLine2}
          onChange={(event) =>
            setNewLocation((prev) => ({ ...prev, addressLine2: event.target.value }))
          }
        />
        <input
          placeholder={tr("Code postal", "Postal code")}
          value={newLocation.postalCode}
          onChange={(event) =>
            setNewLocation((prev) => ({ ...prev, postalCode: event.target.value }))
          }
        />
        <input
          placeholder={tr("Ville", "City")}
          value={newLocation.city}
          onChange={(event) =>
            setNewLocation((prev) => ({ ...prev, city: event.target.value }))
          }
        />
        <input
          placeholder={tr("Pays", "Country")}
          value={newLocation.country}
          onChange={(event) =>
            setNewLocation((prev) => ({ ...prev, country: event.target.value }))
          }
        />
        <input
          type="number"
          step="0.000001"
          placeholder={tr("Latitude", "Latitude")}
          value={newLocation.latitude}
          onChange={(event) =>
            setNewLocation((prev) => ({ ...prev, latitude: event.target.value }))
          }
        />
        <input
          type="number"
          step="0.000001"
          placeholder={tr("Longitude", "Longitude")}
          value={newLocation.longitude}
          onChange={(event) =>
            setNewLocation((prev) => ({ ...prev, longitude: event.target.value }))
          }
        />
        <input
          placeholder={tr("Notes", "Notes")}
          value={newLocation.notes}
          onChange={(event) =>
            setNewLocation((prev) => ({ ...prev, notes: event.target.value }))
          }
        />
        <button type="submit" disabled={loading} className="w-full">
          {tr("Creer", "Create")}
        </button>
      </form>

      <h3>{tr("Liste des emplacements", "Locations list")}</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{tr("Nom", "Name")}</th>
            <th>{tr("Adresse", "Address")}</th>
            <th>{tr("Actif", "Active")}</th>
            <th>{tr("Actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {locations.length === 0 && (
            <tr>
              <td colSpan="5">{tr("Aucun emplacement", "No location")}</td>
            </tr>
          )}
          {locations.map((location) => (
            <tr key={location.id}>
              <td>{location.id}</td>
              <td>{location.name}</td>
              <td>{formatLocation(location)}</td>
              <td>{location.active ? tr("Oui", "Yes") : tr("Non", "No")}</td>
              <td>
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

      {editingId && (
        <div style={{ marginTop: "16px" }}>
          <h3>{tr("Modifier l'emplacement", "Edit location")} #{editingId}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <input
              placeholder={tr("Nom", "Name")}
              value={editLocation.name}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <input
              placeholder={tr("Adresse", "Address")}
              value={editLocation.addressLine1}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, addressLine1: event.target.value }))
              }
            />
            <input
              placeholder={tr("Complement d'adresse", "Address line 2")}
              value={editLocation.addressLine2}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, addressLine2: event.target.value }))
              }
            />
            <input
              placeholder={tr("Code postal", "Postal code")}
              value={editLocation.postalCode}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, postalCode: event.target.value }))
              }
            />
            <input
              placeholder={tr("Ville", "City")}
              value={editLocation.city}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, city: event.target.value }))
              }
            />
            <input
              placeholder={tr("Pays", "Country")}
              value={editLocation.country}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, country: event.target.value }))
              }
            />
            <input
              type="number"
              step="0.000001"
              placeholder={tr("Latitude", "Latitude")}
              value={editLocation.latitude}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, latitude: event.target.value }))
              }
            />
            <input
              type="number"
              step="0.000001"
              placeholder={tr("Longitude", "Longitude")}
              value={editLocation.longitude}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, longitude: event.target.value }))
              }
            />
            <input
              placeholder={tr("Notes", "Notes")}
              value={editLocation.notes}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
            <label>
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
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleUpdate} disabled={loading}>
              {tr("Sauvegarder", "Save")}
            </button>
            <button onClick={cancelEditing}>{tr("Annuler", "Cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
