import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getLocations } from "../api/location.api";
import {
  activateTimeSlot,
  createTimeSlotsBatch,
  deleteTimeSlot,
  getAllTimeSlots,
} from "../api/timeslot.api";
import { ActionIconButton, DeleteIcon, StatusToggle } from "../components/ui/AdminActions";

function toLocalIsoDate(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSlotServiceDate(slot) {
  return slot.serviceDate ? toLocalIsoDate(slot.serviceDate) : toLocalIsoDate(slot.startTime);
}

function shiftIsoDate(isoDate, delta) {
  const next = new Date(`${isoDate}T00:00:00`);
  next.setDate(next.getDate() + delta);
  return toLocalIsoDate(next);
}

function formatLocation(location, tr) {
  if (!location) return tr("Sans emplacement", "No location");
  const parts = [
    location.name,
    location.addressLine1,
    `${location.postalCode || ""} ${location.city || ""}`.trim(),
  ].filter(Boolean);
  return parts.join(" - ");
}

export default function TimeslotsAdmin() {
  const { token } = useContext(AuthContext);
  const { tr, locale } = useLanguage();
  const initialDate = toLocalIsoDate(new Date());
  const [slots, setSlots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("");
  const [form, setForm] = useState({
    serviceDate: initialDate,
    startTime: "18:00",
    endTime: "22:00",
    duration: 15,
    maxPizzas: 10,
    locationId: "",
  });
  const [loading, setLoading] = useState(false);

  const fetchSlots = useCallback(
    async (date = selectedDate, locationIdFilter = selectedLocationFilter) => {
      try {
        const allSlots = await getAllTimeSlots(token);
        const filtered = allSlots.filter((slot) => {
          const sameDate = getSlotServiceDate(slot) === date;
          if (!sameDate) return false;
          if (!locationIdFilter) return true;
          return Number(slot.locationId) === Number(locationIdFilter);
        });
        setSlots(filtered);
      } catch (err) {
        console.error(err);
        alert(tr("Impossible de recuperer les creneaux", "Unable to fetch timeslots"));
      }
    },
    [token, selectedDate, selectedLocationFilter, tr]
  );

  const fetchLocations = useCallback(async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      console.error(err);
      alert(tr("Impossible de recuperer les emplacements", "Unable to fetch locations"));
    }
  }, [tr]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [slots]
  );

  const changeServiceDate = (delta) => {
    const nextDate = shiftIsoDate(form.serviceDate, delta);
    setForm((prev) => ({ ...prev, serviceDate: nextDate }));
    setSelectedDate(nextDate);
  };

  const handleCreateBatch = async (event) => {
    event.preventDefault();

    if (!form.locationId) {
      alert(tr("Selectionnez un emplacement avant de creer des creneaux", "Select a location before creating timeslots"));
      return;
    }

    setLoading(true);

    try {
      await createTimeSlotsBatch(token, {
        ...form,
        duration: Number(form.duration),
        maxPizzas: Number(form.maxPizzas),
        locationId: Number(form.locationId),
      });
      alert(tr("Creneaux crees", "Timeslots created"));
      fetchSlots(form.serviceDate, selectedLocationFilter);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (slot) => {
    try {
      await activateTimeSlot(token, slot.id, !slot.active);
      fetchSlots();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (slot) => {
    if (!window.confirm(tr("Supprimer ce creneau ?", "Delete this timeslot?"))) return;

    try {
      await deleteTimeSlot(token, slot.id);
      fetchSlots();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAllOfDate = async () => {
    if (!window.confirm(`${tr("Supprimer tous les creneaux du", "Delete all timeslots of")} ${selectedDate} ?`)) return;

    try {
      for (const slot of sortedSlots) {
        await deleteTimeSlot(token, slot.id);
      }
      fetchSlots();
      alert(tr("Tous les creneaux de la date ont ete supprimes", "All timeslots for this date were deleted"));
    } catch (err) {
      console.error(err);
      alert(tr("Erreur lors de la suppression des creneaux", "Error while deleting timeslots"));
    }
  };

  return (
    <div>
      <h2>{tr("Gestion des creneaux", "Timeslot management")}</h2>

      <form onSubmit={handleCreateBatch} style={{ marginBottom: 20 }}>
        <h3>{tr("Creer des creneaux automatiques", "Create automatic timeslots")}</h3>
        <label>
          {tr("Date du service", "Service date")}:
          <div className="mt-1 flex w-full items-center gap-2">
            <button
              type="button"
              onClick={() => changeServiceDate(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/5 text-stone-100 transition hover:bg-white/15"
              aria-label={tr("Jour precedent", "Previous day")}
            >
              <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="m14 6-6 6 6 6" />
              </svg>
            </button>

            <span className="min-w-0 flex-1 rounded-xl border border-white/20 bg-charcoal/50 px-3 py-2 text-center text-sm font-semibold text-stone-100">
              {form.serviceDate}
            </span>

            <button
              type="button"
              onClick={() => changeServiceDate(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/5 text-stone-100 transition hover:bg-white/15"
              aria-label={tr("Jour suivant", "Next day")}
            >
              <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="m10 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </label>
        <label>
          {tr("Heure ouverture", "Opening time")}:
          <input
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, startTime: event.target.value }))
            }
            required
          />
        </label>
        <label>
          {tr("Heure fermeture", "Closing time")}:
          <input
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, endTime: event.target.value }))
            }
            required
          />
        </label>
        <label>
          {tr("Duree creneau (min)", "Timeslot duration (min)")}:
          <input
            type="number"
            min="5"
            value={form.duration}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, duration: parseInt(event.target.value, 10) }))
            }
            required
          />
        </label>
        <label>
          {tr("Max pizzas par creneau", "Max pizzas per timeslot")}:
          <input
            type="number"
            min="1"
            value={form.maxPizzas}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, maxPizzas: parseInt(event.target.value, 10) }))
            }
            required
          />
        </label>
        <label>
          {tr("Emplacement", "Location")}:
          <select
            value={form.locationId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, locationId: event.target.value }))
            }
            required
          >
            <option value="" disabled>{tr("Choisir un emplacement", "Choose a location")}</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {formatLocation(location, tr)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading || !form.locationId} className="mt-2 w-full">
          {tr("Creer les creneaux", "Create timeslots")}
        </button>
      </form>

      <div style={{ marginBottom: 20 }}>
        <label>
          {tr("Filtrer par emplacement", "Filter by location")}:
          <select
            value={selectedLocationFilter}
            onChange={(event) => {
              const next = event.target.value;
              setSelectedLocationFilter(next);
              fetchSlots(selectedDate, next);
            }}
          >
            <option value="">{tr("Tous les emplacements", "All locations")}</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {formatLocation(location, tr)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 20 }}>
        {sortedSlots.length > 0 && (
          <button
            style={{ background: "red", color: "white", padding: "5px 10px" }}
            onClick={handleDeleteAllOfDate}
          >
            {tr("Supprimer tous les creneaux de cette date", "Delete all timeslots for this date")}
          </button>
        )}
      </div>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>{tr("Heure", "Time")}</th>
            <th>{tr("Emplacement", "Location")}</th>
            <th>{tr("Commandes", "Orders")}</th>
            <th>{tr("Actif", "Active")}</th>
            <th>{tr("Actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {sortedSlots.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                {tr("Aucun creneau pour cette date", "No timeslot for this date")}
              </td>
            </tr>
          )}
          {sortedSlots.map((slot) => (
            <tr key={slot.id}>
              <td>
                {new Date(slot.startTime).toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td>{formatLocation(slot.location, tr)}</td>
              <td>
                {slot.currentPizzas}/{slot.maxPizzas}
              </td>
              <td>{slot.active ? tr("Oui", "Yes") : tr("Non", "No")}</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusToggle
                    checked={slot.active}
                    onChange={() => handleToggleActive(slot)}
                    labelOn={tr("Desactiver", "Disable")}
                    labelOff={tr("Activer", "Enable")}
                  />
                  <ActionIconButton
                    onClick={() => handleDelete(slot)}
                    label={tr("Supprimer", "Delete")}
                    variant="danger"
                  >
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
